import { IncomingMessage } from 'node:http';
import { uniqueNamesGenerator, animals, colors } from 'unique-names-generator';
import { v4 as uuidv4 } from 'uuid';
import { WebSocket, WebSocketServer } from 'ws';
import { UAParser } from 'ua-parser-js';

interface UserInfo {
    name: string;
    id: string;
    os: string;
    nav: string;
}

interface Message {
    type: string;
    userToSignal: string;
    signal: unknown;
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
    private wss: WebSocketServer;

    constructor(port: number) {
        this.wss = new WebSocketServer({ port });
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

        if (!this.rooms[user.room]) {
            this.rooms[user.room] = { [user.id]: user };
        } else {
            if (this.rooms[user.room][user.id]) return;
            else this.rooms[user.room][user.id] = user;
        }

        for (let peer in this.rooms[user.room]) {
            let socketPeer = this.rooms[user.room][peer];
            socketPeer.socket.send(JSON.stringify({ infos: user.getInfo(), type: 'join' }));

            if (peer !== user.id) user.socket.send(JSON.stringify({ infos: socketPeer.getInfo(), type: 'list' }));
        }
    }

    private setCookie(headers: string[], response: WsIncomingMessage): void {
        if (response.headers.cookie && response.headers.cookie.indexOf('userid=') !== -1) return;
        const id = uuidv4();
        response.userId = id;
        const secure = response.headers['x-forwarded-proto'] === 'https' ? '; Secure' : '';
        headers.push(`Set-Cookie: userid=${id}; Path=/; SameSite=Strict${secure}`);
    }

    private leaveRoom(user: User): void {
        if (!this.rooms[user.room] || !this.rooms[user.room][user.id]) return;

        if (user && user.timerId) clearTimeout(user.timerId);

        delete this.rooms[user.room][user.id];

        if (Object.keys(this.rooms[user.room]).length === 0) {
            delete this.rooms[user.room];
            return;
        }

        for (let peer in this.rooms[user.room]) {
            let socketPeer = this.rooms[user.room][peer];
            socketPeer.socket.send(JSON.stringify({ infos: user.getInfo(), type: 'leave' }));
        }
    }

    private handleMessage(user: User, message: string): void {
        let messageJSON: Message = JSON.parse(message);

        if (messageJSON.type === 'sending signal' || messageJSON.type === 'returning signal') {
            let userToSignal = messageJSON.userToSignal;

            if (this.rooms[user.room][userToSignal]) {
                let socket = this.rooms[user.room][userToSignal].socket;
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
    room: string;
    ua: string;
    os: string;
    nav: string;
    timerId: ReturnType<typeof setTimeout>;
    lastBeat: number;

    constructor(socket: WebSocket, req: WsIncomingMessage) {
        this.id = req.userId || User.getCookie(req.headers.cookie, 'userid') || uuidv4();
        this.socket = socket;
        this.setIp(req);
        this.room = User.isLocalAddress(this.ip) ? 'local-network' : this.ip;

        const ua = new UAParser(req.headers['user-agent']).getResult();
        this.os = ua.os.name ?? '';
        this.nav = ua.browser.name ?? '';
    }

    private setIp(req: WsIncomingMessage) {
        if (req.headers['x-forwarded-for']) {
            this.ip = (<string>req.headers['x-forwarded-for']).split(/\s*,\s*/)[0];
        } else {
            this.ip = <string>req.socket.remoteAddress;
        }
        if (this.ip.startsWith('::ffff:')) this.ip = this.ip.replace('::ffff:', '');
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

    private static getCookie(cookieHeader: string | undefined, name: string): string | undefined {
        return cookieHeader
            ?.split(';')
            .map((cookie) => cookie.trim())
            .find((cookie) => cookie.startsWith(`${name}=`))
            ?.slice(name.length + 1);
    }

    private static isLocalAddress(ip: string): boolean {
        return (
            ip === '127.0.0.1' ||
            ip.startsWith('10.') ||
            ip.startsWith('192.168.') ||
            /^172\.(1[6-9]|2\d|3[0-1])\./.test(ip)
        );
    }
}

new Server(Number(process.env.PORT) || 3387);
