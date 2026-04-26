import Peer from 'simple-peer';

type SignalData = Parameters<Peer.Instance['signal']>[0];
type SignalingSocket = Pick<WebSocket, 'send'>;

const createPeer = (ws: SignalingSocket, userToSignal: string, callerId: string) => {
    const peer = new Peer({
        initiator: true,
        trickle: false,
    });

    peer.on('signal', (signal: SignalData) => {
        console.log(`[P2P] Sending signal to ${userToSignal}`);
        ws.send(JSON.stringify({ type: 'sending signal', userToSignal, callerId, signal }));
    });

    peer.on('error', (e: Error) => {
        console.log(`[P2P] ${e}`);
    });
    peer.on('connect', () => console.log(`[P2P] Peer connected with ${userToSignal}`));
    peer.on('close', () => console.log(`[P2P] Channel closed with ${userToSignal}`));

    return peer;
};

const addPeer = (ws: SignalingSocket, incomingSignal: SignalData, callerId: string) => {
    const peer = new Peer({
        initiator: false,
        trickle: false,
    });

    peer.on('signal', (signal: SignalData) => {
        console.log(`[P2P] Signal received from ${callerId}`);
        ws.send(JSON.stringify({ type: 'returning signal', signal, callerId, userToSignal: callerId }));
    });

    peer.signal(incomingSignal);

    peer.on('error', (e: Error) => {
        console.log(`[P2P] ${e}`);
    });

    peer.on('connect', () => console.log(`[P2P] Peer connected with ${callerId}`));
    peer.on('close', () => console.log(`[P2P] Channel closed with ${callerId}`));

    return peer;
};

export { addPeer, createPeer };
