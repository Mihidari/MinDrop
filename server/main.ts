import WebSocket = require('ws');
import { IncomingMessage } from 'http';

interface UserInfo {
    name: string;
    id: string;
    os: string;
    nav: string;
}

interface Message {
    type: string;
    userToSignal: string;
    signal: string;
    callerId: string;
}

interface Rooms {
    [key: string]: { [key: string]: User };
}

class WsIncomingMessage extends IncomingMessage {
    userId: string;
}

class Server {
    private rooms: Rooms = {};
    private wss: WebSocket.Server;

    constructor(port: number) {
        this.wss = new WebSocket.Server({ port });
        this.wss.on('connection', (socket: WebSocket, req: WsIncomingMessage) => {
            this.joinRoom(new User(socket, req));
        });
        this.wss.on('headers', (headers: string[], response: WsIncomingMessage) => {
            this.setCookie(headers, response);
        });
    }

    private joinRoom(user: User): void {
        user.socket.on('message', (message: string) => this.handleMessage(user, message));
        user.socket.on('close', () => this.leaveRoom(user));
        this.heartBeat(user);

        if (!this.rooms[user.ip]) {
            this.rooms[user.ip] = { [user.id]: user };
        } else {
            if (this.rooms[user.ip][user.id]) return;
            else this.rooms[user.ip][user.id] = user;
        }

        for (let peer in this.rooms[user.ip]) {
            let socketPeer = this.rooms[user.ip][peer];
            socketPeer.socket.send(JSON.stringify({ infos: user.getInfo(), type: 'join' }));

            if (peer !== user.id) user.socket.send(JSON.stringify({ infos: socketPeer.getInfo(), type: 'list' }));
        }
    }

    private setCookie(headers: string[], response: WsIncomingMessage): void {
        if (response.headers.cookie && response.headers.cookie.indexOf('userid=') !== -1) return;
        const { v4: uuidv4 } = require('uuid');
        const id = uuidv4();
        response.userId = id;
        headers.push(`Set-Cookie: userid=${id}; SameSite=Strict; Secure`);
    }

    private leaveRoom(user: User): void {
        if (!this.rooms[user.ip] || !this.rooms[user.ip][user.id]) return;
        if (user && user.timerId) clearTimeout(user.timerId);

        delete this.rooms[user.ip][user.id];

        if (Object.keys(this.rooms[user.ip]).length === 0) delete this.rooms[user.ip];

        for (let peer in this.rooms[user.ip]) {
            let socketPeer = this.rooms[user.ip][peer];
            socketPeer.socket.send(JSON.stringify({ infos: user.getInfo(), type: 'leave' }));
        }
    }

    private handleMessage(user: User, message: string): void {
        let messageJSON: Message = JSON.parse(message);

        if (messageJSON.type === 'sending signal' || messageJSON.type === 'returning signal') {
            let userToSignal = messageJSON.userToSignal;

            if (this.rooms[user.ip][userToSignal]) {
                let socket = this.rooms[user.ip][userToSignal].socket;
                let type = messageJSON.type === 'sending signal' ? 'signal' : 'return signal';
                socket.send(
                    JSON.stringify({
                        type: type,
                        callerId: messageJSON.callerId,
                        signal: messageJSON.signal,
                        userToSignal: user.id,
                    })
                );
            }
        }

        if (messageJSON.type === 'pong') user.lastBeat = Date.now();
    }

    private heartBeat(user: User): void {
        let bpm = 20000;
        let delay = 5000;

        if (user && user.timerId) clearTimeout(user.timerId);

        if (!user.lastBeat) user.lastBeat = Date.now();
        if (Date.now() - user.lastBeat > 2 * bpm + delay) {
            this.leaveRoom(user);
            return;
        }

        user.socket.send(JSON.stringify({ type: 'ping' }));
        user.timerId = setTimeout(() => this.heartBeat(user), bpm);
    }
}

class User {
    readonly id: string;
    readonly socket: WebSocket;
    ip: string;
    ua: string;
    os: string;
    nav: string;
    timerId: ReturnType<typeof setTimeout>;
    lastBeat: number;

    constructor(socket: WebSocket, req: WsIncomingMessage) {
        this.id = req.userId || req.headers.cookie.replace('userid=', '');
        this.socket = socket;
        this.setIp(req);

        const parser = require('ua-parser-js');
        let ua = parser(req.headers['user-agent']);
        this.os = ua.os.name ?? '';
        this.nav = ua.browser.name ?? '';
    }

    private setIp(req: WsIncomingMessage) {
        if (req.headers['x-forwarded-for']) {
            this.ip = (<string>req.headers['x-forwarded-for']).split(/\s*,\s*/)[0];
        } else {
            this.ip = <string>req.socket.remoteAddress;
        }
        if (this.ip == '::1' || this.ip == '::ffff:127.0.0.1') this.ip = '127.0.0.1';
    }

    public getInfo(): UserInfo {
        return {
            name: this.getName(User.getSeed(this.id)),
            id: this.id,
            os: this.os,
            nav: this.nav,
        };
    }

    public getName(seed: number): string {
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

    static getSeed(id: string): number {
        let seed: string = '';
        let splitId: string[] = id.split('');
        for (let char of splitId) {
            if (isNaN(Number(char))) {
                seed += char.charCodeAt(0);
            } else {
                seed += char;
            }
            if (seed.length >= 15) break;
        }
        return Number(seed);
    }
}

new Server(Number(process.env.PORT) || 3387);
