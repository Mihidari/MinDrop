import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  fire: vi.fn(),
}));

vi.mock('../../src/utils/event', () => ({
  default: {
    fire: mocks.fire,
  },
}));

type MessageHandler = (event: { data: string }) => void;
type CloseHandler = (event: { reason: string }) => void;

const sockets: FakeWebSocket[] = [];

class FakeWebSocket {
  static OPEN = 1;

  onmessage?: MessageHandler;
  onclose?: CloseHandler;
  readyState = FakeWebSocket.OPEN;
  sent: string[] = [];

  constructor(readonly url: string) {
    sockets.push(this);
  }

  send(data: string) {
    this.sent.push(data);
  }
}

describe('network websocket client', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubGlobal('WebSocket', FakeWebSocket);
    mocks.fire.mockReset();
    sockets.length = 0;
  });

  it('connects to the current host websocket endpoint', async () => {
    await import('../../src/utils/network');

    expect(sockets).toHaveLength(1);
    expect(sockets[0].url).toMatch(/^ws:\/\/.*\/ws$/);
  });

  it('dispatches server peer events through Events', async () => {
    await import('../../src/utils/network');
    const message = { type: 'join', infos: { id: 'peer-1' } };

    sockets[0].onmessage?.({ data: JSON.stringify(message) });

    expect(mocks.fire).toHaveBeenCalledWith('join', message);
  });

  it('responds to server ping messages with pong', async () => {
    await import('../../src/utils/network');

    sockets[0].onmessage?.({ data: JSON.stringify({ type: 'ping' }) });

    expect(sockets[0].sent).toContain(JSON.stringify({ type: 'pong' }));
  });

  it('guards sends when the websocket is not open', async () => {
    const ws = (await import('../../src/utils/network')).default;
    sockets[0].readyState = 3;

    expect(() => ws.send('hello')).toThrow('WebSocket is not connected');
  });
});
