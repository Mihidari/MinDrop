import Events from './event';

type ServerMessage = {
    type: string;
};

let activeWs: WebSocket;

const connect = (): WebSocket => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const socket = new WebSocket(`${protocol}//${window.location.host}/ws`);
    activeWs = socket;

    socket.onmessage = (msg) => {
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
                socket.send(JSON.stringify({ type: 'pong' }));
                break;
            default:
                console.error('WS: unkown message type', msg);
        }
    };

    socket.onclose = (e) => {
        console.log(`[WS] Disconnected ${e.reason}`);
        if (activeWs === socket) setTimeout(connect, 1000);
    };

    return socket;
};

connect();

const ws = {
    send(data: string) {
        if (activeWs.readyState !== WebSocket.OPEN) {
            throw new Error('WebSocket is not connected');
        }
        activeWs.send(data);
    },
};

export default ws;
