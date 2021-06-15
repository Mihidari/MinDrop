import Events from './event';

const connect = () => {
    const ws = new WebSocket('ws://localhost:3387');

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

    ws.onclose = (e) => {
        console.log(`[WS] Disconnected ${e.reason}`);
        setTimeout(() => {
            connect();
        }, 1000);
    };

    return ws;
};

const ws = connect();

export default ws;
