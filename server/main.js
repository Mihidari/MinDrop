class Server {
    constructor(port) {
        const WebSocket = require('ws');
        const wss = Symbol('wss');
        this[wss] = new WebSocket.Server({ port });
        this[wss].on('connection', (socket, req) => {
            this.#joinRoom(new User(socket, req));
        });
        this[wss].on('headers', (headers, response) => {
            this.#setCookie(headers, response);
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

        if (Object.keys(this._rooms[user.ip]).length === 0) delete this._rooms[user.ip];
    }

    #setCookie(headers, response) {
        if (response.headers.cookie && response.headers.cookie.indexOf('userid=') !== -1) return;
        const { v4: uuidv4 } = require('uuid');
        const id = uuidv4();
        headers.push(`Set-Cookie: userid=${id}; SameSite=Strict; Secure`);
    }
}

class User {
    constructor(socket, req) {
        this.id = req.headers.cookie.replace('userid=', '');
        this.socket = socket;
        this.#setIp(req);
    }

    #setIp(req) {
        if (req.headers['x-forwarded-for']) {
            this.ip = req.headers['x-forwarded-for'].split(/\s*,\s*/)[0];
        } else {
            this.ip = req.socket.remoteAddress;
        }

        if (this.ip == '::1' || this.ip == '::ffff:127.0.0.1') this.ip = '127.0.0.1';
    }

    static getName(seed) {
        const { uniqueNamesGenerator, animals, colors } = require('unique-names-generator');
        const displayName = uniqueNamesGenerator({
            length: 2,
            separator: ' ',
            dictionaries: [colors, animals],
            style: 'capital',
            seed: seed,
        });
        return displayName;
    }
}

new Server(process.env.PORT || 3387);
