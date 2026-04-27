import { describe, expect, it, vi } from 'vitest';
import Events from '../../src/utils/event';

describe('Events', () => {
  it('dispatches custom events with detail payloads', () => {
    const listener = vi.fn();

    window.addEventListener('mindrop:test-event', listener);
    Events.fire('mindrop:test-event', { id: 'device-1' });
    window.removeEventListener('mindrop:test-event', listener);

    expect(listener).toHaveBeenCalledOnce();
    expect(listener.mock.calls[0][0]).toMatchObject({
      type: 'mindrop:test-event',
      detail: { id: 'device-1' },
    });
  });

  it('registers one-shot listeners', () => {
    const listener = vi.fn();

    Events.once('mindrop:once-event', listener);
    Events.fire('mindrop:once-event');
    Events.fire('mindrop:once-event');

    expect(listener).toHaveBeenCalledOnce();
  });
});
