import Peer from 'simple-peer';

const createPeer = (ws, userToSignal, callerId) => {
    const peer = new Peer({
        initiator: true,
        trickle: false,
    });

    peer.on('signal', (signal) => {
        console.log(`[P2P] Sending signal to ${userToSignal}`);
        ws.send(JSON.stringify({ type: 'sending signal', userToSignal, callerId, signal }));
    });

    peer.on('data', (data) => {
        console.log(new TextDecoder().decode(data));
    });

    peer.on('connect', () => console.log(`[P2P] Peer connected with ${userToSignal}`));
    peer.on('close', () => console.log(`[P2P] Channel closed with ${callerId}`));

    return peer;
};

const addPeer = (ws, incomingSignal, callerId) => {
    const peer = new Peer({
        initiator: false,
        trickle: false,
    });

    peer.on('signal', (signal) => {
        console.log(`[P2P] Signal received from ${callerId}`);
        ws.send(JSON.stringify({ type: 'returning signal', signal, callerId, userToSignal: callerId }));
    });

    peer.on('data', (data) => {
        console.log(new TextDecoder().decode(data));
    });

    peer.signal(incomingSignal);

    peer.on('connect', () => console.log(`[P2P] Peer connected with ${callerId}`));
    peer.on('close', () => console.log(`[P2P] Channel closed with ${callerId}`));

    return peer;
};

export { addPeer, createPeer };
