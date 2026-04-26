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
    blob: Blob;
    blobURL: string;
};

type PeerMessage =
    | { type: 'message'; message: string }
    | { type: 'file-start'; name?: string; size: number; batchCount?: number; batchIndex?: number; batchTotalSize?: number }
    | { type: 'file-done'; name: string; size: number }
    | { type: 'file-batch-done' }
    | { type: 'backtracking' }
    | { type: 'peer-ping'; id: string }
    | { type: 'peer-pong'; id: string };

type UsePeerTransferOptions = {
    onMessage?: (message: string) => void;
    onFileReceived?: (file: FileReceived) => void;
    onFilesReceived?: (files: FileReceived[]) => void;
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

const usePeerTransfer = (peer: PeerLike | undefined, { onMessage, onFileReceived, onFilesReceived }: UsePeerTransferOptions = {}) => {
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

        let currentChunks: BlobPart[] = [];
        let currentFileName = '';
        let currentFileSize = 0;
        let currentFileReceived = 0;
        let batchTotalSize = 0;
        let batchFileCount = 0;
        let receivedFileCount = 0;
        let receivedSize = 0;
        let receivedFiles: FileReceived[] = [];
        let previousProgress = 0;

        const updateIncomingProgress = () => {
            const nextProgress =
                batchTotalSize > 0
                    ? Math.floor(((receivedSize + currentFileReceived) / batchTotalSize) * 100)
                    : currentFileSize > 0
                    ? Math.floor((currentFileReceived / currentFileSize) * 100)
                    : batchFileCount > 0
                    ? Math.floor((receivedFileCount / batchFileCount) * 100)
                    : 100;

            if (nextProgress !== previousProgress) {
                setProgress(Math.min(nextProgress, 100));
                previousProgress = nextProgress;
            }
        };

        const resetIncomingTransfer = () => {
            currentChunks = [];
            currentFileName = '';
            currentFileSize = 0;
            currentFileReceived = 0;
            batchTotalSize = 0;
            batchFileCount = 0;
            receivedFileCount = 0;
            receivedSize = 0;
            receivedFiles = [];
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
                currentChunks.push(toBlobPart(data));
                currentFileReceived += getByteLength(data);
                updateIncomingProgress();
                peer.send(JSON.stringify({ type: 'backtracking' }));
                return;
            }

            switch (message.type) {
                case 'message':
                    onMessage?.(message.message);
                    break;
                case 'file-start':
                    currentChunks = [];
                    currentFileName = message.name ?? '';
                    currentFileSize = message.size;
                    currentFileReceived = 0;
                    batchFileCount = message.batchCount ?? 0;
                    batchTotalSize = message.batchTotalSize ?? currentFileSize;

                    if (!message.batchCount || message.batchIndex === 0) {
                        receivedFiles = [];
                        receivedFileCount = 0;
                        receivedSize = 0;
                        previousProgress = 0;
                        setProgress(0);
                    }

                    setReceiving(true);
                    break;
                case 'file-done': {
                    const blob = new Blob(currentChunks);
                    const file = {
                        name: message.name || currentFileName,
                        size: message.size ?? currentFileSize,
                        blob,
                        blobURL: URL.createObjectURL(blob),
                    };

                    receivedFiles = [...receivedFiles, file];
                    receivedFileCount += 1;
                    receivedSize += currentFileSize;
                    currentChunks = [];
                    currentFileReceived = 0;

                    if (batchFileCount === 0) {
                        onFileReceived?.(file);
                        onFilesReceived?.(receivedFiles);
                        resetIncomingTransfer();
                    }
                    break;
                }
                case 'file-batch-done':
                    onFilesReceived?.(receivedFiles);
                    if (receivedFiles.length === 1) onFileReceived?.(receivedFiles[0]);
                    resetIncomingTransfer();
                    break;
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
    }, [onFileReceived, onFilesReceived, onMessage, peer]);

    const sendMessage = useCallback(
        (message: string) => {
            ensureReady().send(JSON.stringify({ type: 'message', message }));
        },
        [ensureReady]
    );

    const sendFiles = useCallback(
        async (files: File[]) => {
            const totalSize = files.reduce((sum, file) => sum + file.size, 0);
            let transferredSize = 0;
            let previousProgress = 0;

            try {
                const readyPeer = ensureReady();
                await waitForPeerPong(readyPeer);
                setTransferring(true);

                for (const [fileIndex, file] of files.entries()) {
                    const { name, size } = file;
                    let fileProgressSize = 0;

                    console.log(`[P2P] Sending ${name}...`);
                    ensureSameReadyPeer(readyPeer).send(
                        JSON.stringify({
                            type: 'file-start',
                            name,
                            size,
                            batchCount: files.length,
                            batchIndex: fileIndex,
                            batchTotalSize: totalSize,
                        })
                    );

                    const arrayBuffer = await file.arrayBuffer();
                    for (let i = 0; i < arrayBuffer.byteLength; i += MAX_CHUNK) {
                        const chunk = arrayBuffer.slice(i, i + MAX_CHUNK);
                        ensureSameReadyPeer(readyPeer).write(new Uint8Array(chunk));
                        fileProgressSize += chunk.byteLength;

                        const nextProgress =
                            totalSize > 0
                                ? Math.floor(((transferredSize + fileProgressSize) / totalSize) * 100)
                                : Math.floor(((fileIndex + 1) / files.length) * 100);

                        await waitForChunkAck();

                        if (nextProgress !== previousProgress) {
                            setProgress(nextProgress);
                            previousProgress = nextProgress;
                        }
                    }

                    transferredSize += size;
                    ensureSameReadyPeer(readyPeer).send(JSON.stringify({ type: 'file-done', name, size }));
                }

                ensureSameReadyPeer(readyPeer).send(JSON.stringify({ type: 'file-batch-done' }));
                setProgress(100);
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

    const sendFile = useCallback((file: File) => sendFiles([file]), [sendFiles]);

    return {
        canSend,
        peerReady,
        peerReadyVersion,
        progress,
        receiving,
        transferring,
        sendFile,
        sendFiles,
        sendMessage,
    };
};

export default usePeerTransfer;
