import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../src/api/client.js', () => ({
  get: vi.fn(),
}));

import { HN_BASE } from '../../src/constants.js';
import { get } from '../../src/api/client.js';
import {
  getItem,
  getItems,
  getItemsKeepOrder,
  getStoryIds,
} from '../../src/api/items.js';

beforeEach(() => {
  get.mockReset();
});

describe('getItem', () => {
  it('fetches one item by id', async () => {
    const item = { id: 123, type: 'story', title: 'Hello' };
    get.mockResolvedValueOnce(item);

    await expect(getItem(123)).resolves.toEqual(item);
    expect(get).toHaveBeenCalledWith(`${HN_BASE}/item/123.json`);
  });

  it('returns null for deleted items', async () => {
    get.mockResolvedValueOnce({ id: 123, deleted: true });

    await expect(getItem(123)).resolves.toBeNull();
  });

  it('returns null for dead items', async () => {
    get.mockResolvedValueOnce({ id: 123, dead: true });

    await expect(getItem(123)).resolves.toBeNull();
  });

  it('returns null when the client returns null', async () => {
    get.mockResolvedValueOnce(null);

    await expect(getItem(123)).resolves.toBeNull();
  });
});

describe('getItems', () => {
  it('fetches all ids and filters null results', async () => {
    get
      .mockResolvedValueOnce({ id: 1, type: 'story' })
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 3, type: 'job' });

    await expect(getItems([1, 2, 3])).resolves.toEqual([
      { id: 1, type: 'story' },
      { id: 3, type: 'job' },
    ]);
  });
});

describe('getItemsKeepOrder', () => {
  it('preserves input order and keeps null slots', async () => {
    get
      .mockResolvedValueOnce({ id: 1, type: 'story' })
      .mockResolvedValueOnce({ id: 2, deleted: true })
      .mockResolvedValueOnce({ id: 3, type: 'comment' });

    await expect(getItemsKeepOrder([1, 2, 3])).resolves.toEqual([
      { id: 1, type: 'story' },
      null,
      { id: 3, type: 'comment' },
    ]);
  });
});

describe('getStoryIds', () => {
  it.each([
    ['top', 'topstories'],
    ['new', 'newstories'],
    ['ask', 'askstories'],
    ['show', 'showstories'],
    ['job', 'jobstories'],
  ])('maps %s feed to the %s endpoint', async (feed, endpoint) => {
    get.mockResolvedValueOnce([300, 200, 100]);

    await expect(getStoryIds(feed)).resolves.toEqual([300, 200, 100]);
    expect(get).toHaveBeenCalledWith(`${HN_BASE}/${endpoint}.json`);
  });

  it('returns an empty array when ids cannot be fetched', async () => {
    get.mockResolvedValueOnce(null);

    await expect(getStoryIds('top')).resolves.toEqual([]);
  });
});
