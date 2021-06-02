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
            this._rooms[user.ip] = { [user.id]: user };
        } else {
            this._rooms[user.ip][user.id] = user;
        }

        for (let peer in this._rooms[user.ip]) {
            let socketPeer = this._rooms[user.ip][peer];
            socketPeer.socket.send(JSON.stringify({ infos: socketPeer.getInfo(), type: 'join' }));
        }
    }

    #leaveRoom(user) {
        if (!this._rooms[user.ip] || !this._rooms[user.ip][user.id]) return;

        delete this._rooms[user.ip][user.id];

        if (Object.keys(this._rooms[user.ip]).length === 0) delete this._rooms[user.ip];

        for (let peer in this._rooms[user.ip]) {
            let socketPeer = this._rooms[user.ip][peer];
            socketPeer.socket.send(JSON.stringify({ infos: socketPeer.getInfo(), type: 'leave' }));
        }
    }

    #setCookie(headers, response) {
        if (response.headers.cookie && response.headers.cookie.indexOf('userid=') !== -1) return;
        const { v4: uuidv4 } = require('uuid');
        const id = uuidv4();
        response.userid = id;
        headers.push(`Set-Cookie: userid=${id}; SameSite=Strict; Secure`);
    }
}

class User {
    constructor(socket, req) {
        this.id = req.userid || req.headers.cookie.replace('userid=', '');
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

    getInfo() {
        return {
            name: this.getName(User.getSeed(this.id)),
            id: this.id,
        };
    }

    getName(seed) {
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

    static getSeed(id) {
        let seed = '';
        for (let char of id) {
            if (isNaN(char)) {
                seed += char.charCodeAt();
            } else {
                seed += char;
            }
            if (seed.length >= 15) break;
        }
        return +seed;
    }
}

new Server(process.env.PORT || 3387);
