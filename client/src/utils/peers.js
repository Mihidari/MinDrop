import Peer from 'simple-peer';

const createPeer = (ws, userToSignal, callerId) => {
    const peer = new Peer({
        initiator: true,
        trickle: false,
    });

    peer.on('signal', (signal) => {
        console.log(`Sending signal to ${userToSignal}`);
        ws.send(JSON.stringify({ type: 'sending signal', userToSignal, callerId, signal }));
    });

    peer.on('data', (data) => {
        console.log(new TextDecoder().decode(data));
    });

    peer.on('connect', () => console.log('La peer initiatrice est connectée'));
    peer.on('close', () => console.log('La peer initiatrice est fermée'));

    return peer;
};

const addPeer = (ws, incomingSignal, callerId) => {
    const peer = new Peer({
        initiator: false,
        trickle: false,
    });

    peer.on('signal', (signal) => {
        ws.send(JSON.stringify({ type: 'returning signal', signal, callerId, userToSignal: callerId }));
    });

    peer.on('data', (data) => {
        console.log(new TextDecoder().decode(data));
    });

    peer.signal(incomingSignal);

    peer.on('connect', () => console.log('La peer receptrice est connectée'));
    peer.on('close', () => console.log('La peer receptrice est fermée'));

    return peer;
};

export { addPeer, createPeer };
