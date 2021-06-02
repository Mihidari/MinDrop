class Server {
    constructor(port) {
        const WebSocket = require('ws');
        const wss = Symbol('wss');
        this[wss] = new WebSocket.Server({ port });
        this[wss].on('connection', (socket, req) => {
            this.#joinRoom(new User(socket, req));
        });
        this._rooms = {};
    }

    #joinRoom(user) {
        user.socket.on('close', () => this.#leaveRoom(user));

        if (!this._rooms[user.ip]) {
            this._rooms[user.ip] = { [user.id]: user.socket };
        } else {
            this._rooms[user.ip][user.id] = user.socket;
        }
    }

    #leaveRoom(user) {
        if (!this._rooms[user.ip] && !this._rooms[user.ip][user.id]) return;

        delete this._rooms[user.ip][user.id];

        if (Object.keys(this._rooms[user.ip]).length === 0)
            delete this._rooms[user.ip];
    }
}

class User {
    constructor(socket, req) {
        const { v4: uuidv4 } = require('uuid');
        this.id = uuidv4();
        this.socket = socket;
        this.#setIp(req);
    }

    #setIp(req) {
        if (req.headers['x-forwarded-for']) {
            this.ip = req.headers['x-forwarded-for'].split(/\s*,\s*/)[0];
        } else {
            this.ip = req.socket.remoteAddress;
        }

        if (this.ip == '::1' || this.ip == '::ffff:127.0.0.1')
            this.ip = '127.0.0.1';
    }
}

const server = new Server(process.env.PORT || 3387);
