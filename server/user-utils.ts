import { IncomingHttpHeaders } from 'node:http';

type RequestAddress = {
    headers: IncomingHttpHeaders;
    socket: {
        remoteAddress?: string;
    };
};

const normalizeIp = (ip: string): string => {
    if (ip.startsWith('::ffff:')) return ip.replace('::ffff:', '');
    if (ip === '::1') return '127.0.0.1';
    return ip;
};

export const getClientIp = (req: RequestAddress): string => {
    const forwardedFor = req.headers['x-forwarded-for'];
    const ip = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor?.split(/\s*,\s*/)[0] ?? req.socket.remoteAddress ?? '';

    return normalizeIp(ip);
};

export const getCookie = (cookieHeader: string | undefined, name: string): string | undefined => {
    return cookieHeader
        ?.split(';')
        .map((cookie) => cookie.trim())
        .find((cookie) => cookie.startsWith(`${name}=`))
        ?.slice(name.length + 1);
};

export const getSeed = (id: string): number => {
    let seed = '';
    const splitId = id.split('');
    for (let char of splitId) {
        if (isNaN(Number(char))) {
            seed += char.charCodeAt(0);
        } else {
            seed += char;
        }
        if (seed.length >= 15) break;
    }
    return Number(seed);
};

export const isLocalAddress = (ip: string): boolean => {
    return ip === '127.0.0.1' || ip.startsWith('10.') || ip.startsWith('192.168.') || /^172\.(1[6-9]|2\d|3[0-1])\./.test(ip);
};
