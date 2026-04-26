import { useCallback, useEffect, useState } from 'react';
import Events from '../utils/event';

const MAX_CHUNK = 64000;
const ACK_TIMEOUT = 5000;
const PEER_PING_TIMEOUT = 1500;

type PeerData = ArrayBuffer | Uint8Array;

type PeerLike = {
    connected?: boolean;
    destroyed?: boolean;
    on: (event: 'connect' | 'close' | 'error' | 'data', handler: (data?: PeerData) => void) => void;
    removeListener: (event: 'connect' | 'close' | 'error' | 'data', handler: (data?: PeerData) => void) => void;
    send: (data: string) => void;
    write: (data: Uint8Array) => void;
};

type FileReceived = {
    name: string;
    size: number;
    blobURL: string;
};

type PeerMessage =
    | { type: 'message'; message: string }
    | { type: 'file-start'; size: number }
    | { type: 'file-done'; name: string; size: number }
    | { type: 'backtracking' }
    | { type: 'peer-ping'; id: string }
    | { type: 'peer-pong'; id: string };

type UsePeerTransferOptions = {
    onMessage?: (message: string) => void;
    onFileReceived?: (file: FileReceived) => void;
};

const isPeerReady = (peer: PeerLike | undefined): peer is PeerLike => Boolean(peer && peer.connected && !peer.destroyed);

const decodePeerData = (data: PeerData): PeerData | PeerMessage => {
    try {
        return JSON.parse(new TextDecoder().decode(data)) as PeerMessage;
    } catch {
        return data;
    }
};

const getByteLength = (data: PeerData) => {
    if (data instanceof ArrayBuffer) return data.byteLength;
    return data.byteLength;
};

const toBlobPart = (data: PeerData): BlobPart => {
    if (data instanceof ArrayBuffer) return data;
    if (data.buffer instanceof ArrayBuffer) return data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
    return new Uint8Array(data).buffer;
};

const waitForChunkAck = () =>
    new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Peer did not acknowledge file chunk')), ACK_TIMEOUT);
        Events.once('backtracking', () => {
            clearTimeout(timeout);
            resolve();
        });
    });

const getPingId = () => {
    if (crypto.randomUUID) return crypto.randomUUID();
    return `${Date.now()}-${Math.random()}`;
};

const waitForPeerPong = (peer: PeerLike) =>
    new Promise<void>((resolve, reject) => {
        const id = getPingId();
        const timeout = setTimeout(() => reject(new Error('Peer did not answer ping')), PEER_PING_TIMEOUT);

        Events.once(`peer-pong:${id}`, () => {
            clearTimeout(timeout);
            resolve();
        });

        peer.send(JSON.stringify({ type: 'peer-ping', id }));
    });

const usePeerTransfer = (peer: PeerLike | undefined, { onMessage, onFileReceived }: UsePeerTransferOptions = {}) => {
    const [peerReady, setPeerReady] = useState(false);
    const [peerReadyVersion, setPeerReadyVersion] = useState(0);
    const [progress, setProgress] = useState(0);
    const [transferring, setTransferring] = useState(false);
    const [receiving, setReceiving] = useState(false);

    const canSend = peerReady && !transferring && !receiving;

    const ensureReady = useCallback(() => {
        if (!isPeerReady(peer)) throw new Error('Peer is not ready');
        return peer;
    }, [peer]);

    const ensureSameReadyPeer = useCallback(
        (expectedPeer: PeerLike) => {
            const currentPeer = ensureReady();
            if (currentPeer !== expectedPeer) throw new Error('Peer changed during transfer');
            return currentPeer;
        },
        [ensureReady]
    );

    useEffect(() => {
        if (!peer) return;

        let chunks: BlobPart[] = [];
        let incomingSize = 0;
        let incomingTotal = 0;
        let previousProgress = 0;

        const updateIncomingProgress = () => {
            const nextProgress = Math.floor((incomingTotal / incomingSize) * 100);
            if (nextProgress !== previousProgress) {
                setProgress(nextProgress);
                previousProgress = nextProgress;
            }
        };

        const resetIncomingTransfer = () => {
            chunks = [];
            incomingSize = 0;
            incomingTotal = 0;
            previousProgress = 0;
            setProgress(0);
            setReceiving(false);
        };

        const markReady = () => {
            setPeerReady(true);
            setPeerReadyVersion((version) => version + 1);
        };
        const handleConnect = () => markReady();
        const handleUnavailable = () => setPeerReady(false);
        const handleData = (data?: PeerData) => {
            if (!data) return;

            const message = decodePeerData(data);
            if (!('type' in message)) {
                chunks.push(toBlobPart(data));
                incomingTotal += getByteLength(data);
                updateIncomingProgress();
                peer.send(JSON.stringify({ type: 'backtracking' }));
                return;
            }

            switch (message.type) {
                case 'message':
                    onMessage?.(message.message);
                    break;
                case 'file-start':
                    incomingSize = message.size;
                    setReceiving(true);
                    break;
                case 'file-done': {
                    const blobURL = URL.createObjectURL(new Blob(chunks));
                    onFileReceived?.({ name: message.name, size: message.size, blobURL });
                    resetIncomingTransfer();
                    break;
                }
                case 'backtracking':
                    Events.fire('backtracking');
                    break;
                case 'peer-ping':
                    peer.send(JSON.stringify({ type: 'peer-pong', id: message.id }));
                    break;
                case 'peer-pong':
                    Events.fire(`peer-pong:${message.id}`);
                    break;
            }
        };

        peer.on('connect', handleConnect);
        peer.on('close', handleUnavailable);
        peer.on('error', handleUnavailable);
        peer.on('data', handleData);
        if (isPeerReady(peer)) markReady();
        else setPeerReady(false);

        return () => {
            peer.removeListener('connect', handleConnect);
            peer.removeListener('close', handleUnavailable);
            peer.removeListener('error', handleUnavailable);
            peer.removeListener('data', handleData);
            setPeerReady(false);
        };
    }, [onFileReceived, onMessage, peer]);

    const sendMessage = useCallback(
        (message: string) => {
            ensureReady().send(JSON.stringify({ type: 'message', message }));
        },
        [ensureReady]
    );

    const sendFile = useCallback(
        async (file: File) => {
            const { name, size } = file;
            let previousProgress = 0;

            try {
                const readyPeer = ensureReady();
                await waitForPeerPong(readyPeer);
                console.log(`[P2P] Sending ${name}...`);
                readyPeer.send(JSON.stringify({ type: 'file-start', size }));
                setTransferring(true);

                const arrayBuffer = await file.arrayBuffer();
                for (let i = 0; i < arrayBuffer.byteLength; i += MAX_CHUNK) {
                    ensureSameReadyPeer(readyPeer).write(new Uint8Array(arrayBuffer.slice(i, i + MAX_CHUNK)));

                    const nextProgress =
                        arrayBuffer.byteLength > i + MAX_CHUNK ? Math.floor(((i + MAX_CHUNK) / size) * 100) : 100;

                    await waitForChunkAck();

                    if (nextProgress !== previousProgress) {
                        setProgress(nextProgress);
                        previousProgress = nextProgress;
                    }
                }

                ensureSameReadyPeer(readyPeer).send(JSON.stringify({ type: 'file-done', name, size }));
                Events.once('transi', () => setProgress(0));
            } catch (error) {
                console.log(`[P2P] Transfer stopped: ${(error as Error).message}`);
                setProgress(0);
                setPeerReady(false);
                return false;
            } finally {
                setTransferring(false);
            }

            return true;
        },
        [ensureReady, ensureSameReadyPeer]
    );

    return {
        canSend,
        peerReady,
        peerReadyVersion,
        progress,
        receiving,
        transferring,
        sendFile,
        sendMessage,
    };
};

export default usePeerTransfer;
