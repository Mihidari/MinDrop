import Events from './event';

const ws = new WebSocket('wss://mindrop.net/ws');
ws.onmessage = (msg) => {
    let data = JSON.parse(msg.data);
    switch (data.type) {
        case 'join':
            Events.fire('join', data);
            break;
        case 'list':
            Events.fire('list', data);
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
        case 'ping':
            ws.send(JSON.stringify({ type: 'pong' }));
            break;
        default:
            console.error('WS: unkown message type', msg);
    }
};

export default ws;
