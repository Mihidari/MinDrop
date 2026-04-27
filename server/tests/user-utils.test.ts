import { describe, expect, it } from 'vitest';
import { getClientIp, getCookie, getSeed, isLocalAddress } from '../user-utils.js';

describe('user utilities', () => {
    it('builds a deterministic numeric seed from an id', () => {
        expect(getSeed('abc123')).toBe(979899123);
        expect(getSeed('12345678901234567890')).toBe(123456789012345);
    });

    it('keeps empty ids numeric for display-name seeding', () => {
        expect(getSeed('')).toBe(0);
    });

    it('reads named cookies from a cookie header', () => {
        expect(getCookie('theme=dark; userid=user-1; session=active', 'userid')).toBe('user-1');
        expect(getCookie('theme=dark', 'userid')).toBeUndefined();
        expect(getCookie(undefined, 'userid')).toBeUndefined();
    });

    it('does not match cookie names by prefix', () => {
        expect(getCookie('myuserid=wrong; userid=right', 'userid')).toBe('right');
    });

    it('prefers the first forwarded address and normalizes mapped IPv4 addresses', () => {
        expect(
            getClientIp({
                headers: { 'x-forwarded-for': '192.168.1.12, 203.0.113.9' },
                socket: { remoteAddress: '10.0.0.1' },
            })
        ).toBe('192.168.1.12');

        expect(
            getClientIp({
                headers: {},
                socket: { remoteAddress: '::ffff:127.0.0.1' },
            })
        ).toBe('127.0.0.1');
    });

    it('normalizes IPv6 loopback addresses', () => {
        expect(
            getClientIp({
                headers: {},
                socket: { remoteAddress: '::1' },
            })
        ).toBe('127.0.0.1');
    });

    it('supports forwarded address arrays from Node headers', () => {
        expect(
            getClientIp({
                headers: { 'x-forwarded-for': ['10.0.0.9', '203.0.113.9'] },
                socket: { remoteAddress: '127.0.0.1' },
            })
        ).toBe('10.0.0.9');
    });

    it('identifies local network room addresses', () => {
        expect(isLocalAddress('127.0.0.1')).toBe(true);
        expect(isLocalAddress('10.0.0.3')).toBe(true);
        expect(isLocalAddress('172.16.0.1')).toBe(true);
        expect(isLocalAddress('172.31.255.255')).toBe(true);
        expect(isLocalAddress('192.168.1.1')).toBe(true);
        expect(isLocalAddress('172.32.0.1')).toBe(false);
        expect(isLocalAddress('203.0.113.8')).toBe(false);
    });
});
