import Events from './event';

type ServerMessage = {
    type: string;
};

const connect = (): WebSocket => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws`);

    ws.onmessage = (msg) => {
        const data = JSON.parse(msg.data) as ServerMessage;

        switch (data.type) {
            case 'join':
            case 'list':
            case 'leave':
            case 'signal':
            case 'return signal':
                Events.fire(data.type, data);
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
        setTimeout(connect, 1000);
    };

    return ws;
};

const ws = connect();

export default ws;
