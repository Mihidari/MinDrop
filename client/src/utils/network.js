import Events from './event';

const ws = new WebSocket('ws://localhost:3387');
ws.onmessage = (msg) => {
    let data = JSON.parse(msg.data);
    switch (data.type) {
        case 'join':
            Events.fire('join', data);
            break;
        case 'leave':
            Events.fire('leave', data);
            break;
        case 'signal':
            Events.fire('signal', data);
            break;
        case 'return signal':
            Events.fire('return signal', data);
            break;
        default:
            console.error('WS: unkown message type', msg);
    }
};

export default ws;