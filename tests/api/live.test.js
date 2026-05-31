import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { startLiveUpdates, stopLiveUpdates } from '../../src/api/live.js';

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('../../src/api/client.js', () => ({
  get: vi.fn(),
}));

import { get } from '../../src/api/client.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeUpdatesPayload(items) {
  return { items, profiles: [] };
}

// ─── Setup / Teardown ─────────────────────────────────────────────────────────

beforeEach(() => {
  vi.useFakeTimers();
  get.mockReset();
  stopLiveUpdates(); // ensure clean state before each test
});

afterEach(() => {
  stopLiveUpdates();
  vi.useRealTimers();
});

// ─── startLiveUpdates ─────────────────────────────────────────────────────────

describe('startLiveUpdates', () => {
  it('does NOT dispatch hn:update on the first poll', async () => {
    get.mockResolvedValueOnce(makeUpdatesPayload([100, 200, 300]));

    const listener = vi.fn();
    document.addEventListener('hn:update', listener);

    startLiveUpdates();
    await vi.advanceTimersByTimeAsync(5000);

    expect(listener).not.toHaveBeenCalled();
    document.removeEventListener('hn:update', listener);
  });

  it('does NOT dispatch hn:update on second poll if no new IDs', async () => {
    // Both polls return the same IDs
    get
      .mockResolvedValueOnce(makeUpdatesPayload([100, 200, 300]))
      .mockResolvedValueOnce(makeUpdatesPayload([100, 200, 300]));

    const listener = vi.fn();
    document.addEventListener('hn:update', listener);

    startLiveUpdates();
    await vi.advanceTimersByTimeAsync(5000);
    await vi.advanceTimersByTimeAsync(5000);

    expect(listener).not.toHaveBeenCalled();
    document.removeEventListener('hn:update', listener);
  });

  it('dispatches hn:update on second poll when new IDs found', async () => {
    get
      .mockResolvedValueOnce(makeUpdatesPayload([100, 200, 300]))  // baseline
      .mockResolvedValueOnce(makeUpdatesPayload([100, 200, 300, 400, 500])); // new

    const listener = vi.fn();
    document.addEventListener('hn:update', listener);

    startLiveUpdates();

    // First poll — baseline
    await vi.advanceTimersByTimeAsync(5000);
    expect(listener).not.toHaveBeenCalled();

    // Second poll — new IDs
    await vi.advanceTimersByTimeAsync(5000);
    expect(listener).toHaveBeenCalledTimes(1);

    document.removeEventListener('hn:update', listener);
  });

  it('dispatches correct UpdatePayload shape', async () => {
    get
      .mockResolvedValueOnce(makeUpdatesPayload([100, 200, 300]))
      .mockResolvedValueOnce(makeUpdatesPayload([100, 200, 300, 400, 500]));

    let detail = null;
    document.addEventListener('hn:update', (e) => { detail = e.detail; });

    startLiveUpdates();
    await vi.advanceTimersByTimeAsync(5000);  // baseline
    await vi.advanceTimersByTimeAsync(5000);  // new IDs

    expect(detail).toEqual({
      newIds: [400, 500],
      count:  2,
    });
  });

  it('only includes IDs higher than the baseline max', async () => {
    get
      .mockResolvedValueOnce(makeUpdatesPayload([100, 200, 300]))
      .mockResolvedValueOnce(makeUpdatesPayload([50, 100, 200, 300, 400]));

    let detail = null;
    document.addEventListener('hn:update', (e) => { detail = e.detail; });

    startLiveUpdates();
    await vi.advanceTimersByTimeAsync(5000);
    await vi.advanceTimersByTimeAsync(5000);

    // 50 is lower than baseline max (300), should not be included
    expect(detail.newIds).toEqual([400]);
    expect(detail.count).toBe(1);
  });

  it('accumulates baseline across multiple polls', async () => {
    get
      .mockResolvedValueOnce(makeUpdatesPayload([100, 200, 300])) // baseline max = 300
      .mockResolvedValueOnce(makeUpdatesPayload([300, 400, 500])) // new: 400, 500 — max now 500
      .mockResolvedValueOnce(makeUpdatesPayload([500, 600]));     // new: 600 — not 400/500 again

    const listener = vi.fn();
    let lastDetail = null;
    document.addEventListener('hn:update', (e) => {
      listener();
      lastDetail = e.detail;
    });

    startLiveUpdates();
    await vi.advanceTimersByTimeAsync(5000); // baseline
    await vi.advanceTimersByTimeAsync(5000); // first real poll
    await vi.advanceTimersByTimeAsync(5000); // second real poll

    expect(listener).toHaveBeenCalledTimes(2);
    expect(lastDetail.newIds).toEqual([600]);
  });
});

// ─── stopLiveUpdates ──────────────────────────────────────────────────────────

describe('stopLiveUpdates', () => {
  it('stops polling after stopLiveUpdates is called', async () => {
    get
      .mockResolvedValueOnce(makeUpdatesPayload([100, 200, 300]))
      .mockResolvedValueOnce(makeUpdatesPayload([400, 500, 600]));

    const listener = vi.fn();
    document.addEventListener('hn:update', listener);

    startLiveUpdates();
    await vi.advanceTimersByTimeAsync(5000); // baseline
    stopLiveUpdates();
    await vi.advanceTimersByTimeAsync(10000); // would have triggered polls

    expect(listener).not.toHaveBeenCalled();
    document.removeEventListener('hn:update', listener);
  });

  it('is safe to call if never started', () => {
    expect(() => stopLiveUpdates()).not.toThrow();
  });

  it('is safe to call multiple times', () => {
    startLiveUpdates();
    expect(() => {
      stopLiveUpdates();
      stopLiveUpdates();
      stopLiveUpdates();
    }).not.toThrow();
  });
});