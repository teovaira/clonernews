import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MAX_CONCURRENT } from '../../src/constants.js';
import { get } from '../../src/api/client.js';

function deferredResponse(body = {}) {
  let resolve;
  const promise = new Promise((r) => {
    resolve = r;
  });

  return {
    promise,
    resolve: () => resolve({
      ok: true,
      json: async () => body,
    }),
  };
}

beforeEach(() => {
  global.fetch = vi.fn();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('get', () => {
  it('returns parsed JSON for a successful response', async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ value: 42 }),
    });

    await expect(get('/ok.json')).resolves.toEqual({ value: 42 });
    expect(fetch).toHaveBeenCalledWith('/ok.json');
  });

  it('returns null for HTTP errors', async () => {
    fetch.mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'not found' }),
    });

    await expect(get('/missing.json')).resolves.toBeNull();
  });

  it('returns null when fetch rejects', async () => {
    fetch.mockRejectedValue(new Error('network down'));

    await expect(get('/fails.json')).resolves.toBeNull();
  });

  it('returns null when response JSON cannot be parsed', async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: async () => {
        throw new Error('bad json');
      },
    });

    await expect(get('/bad-json.json')).resolves.toBeNull();
  });

  it('runs no more than MAX_CONCURRENT requests at the same time', async () => {
    const requests = Array.from({ length: MAX_CONCURRENT + 2 }, (_, i) =>
      deferredResponse({ id: i }),
    );
    let fetchIndex = 0;
    fetch.mockImplementation(() => requests[fetchIndex++].promise);

    const results = requests.map((_, i) => get(`/item/${i}.json`));
    await Promise.resolve();

    expect(fetch).toHaveBeenCalledTimes(MAX_CONCURRENT);

    requests[0].resolve();

    await vi.waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(MAX_CONCURRENT + 1);
    });

    requests.slice(1).forEach((request) => request.resolve());
    await expect(Promise.all(results)).resolves.toEqual(
      requests.map((_, i) => ({ id: i })),
    );
  });
});
