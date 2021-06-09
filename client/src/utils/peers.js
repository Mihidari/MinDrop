import Peer from 'simple-peer';

const createPeer = (ws, userToSignal, callerId) => {
    const peer = new Peer({
        initiator: true,
        trickle: false,
    });

    peer.on('signal', (signal) => {
        ws.send(JSON.stringify({ type: 'sending signal', userToSignal, callerId, signal }));
    });

    peer.on('data', (data) => {
        console.log(data);
    });

    return peer;
};

const addPeer = (ws, incomingSignal, callerId) => {
    const peer = new Peer({
        initiator: false,
        trickle: false,
    });

    peer.on('signal', (signal) => {
        ws.send(JSON.stringify({ type: 'returning signal', signal, callerId }));
    });

    peer.on('data', (data) => {
        console.log(data);
    });

    peer.signal(incomingSignal);

    return peer;
};

export { addPeer, createPeer };
