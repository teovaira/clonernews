import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getPollOptions } from '../../src/api/polls.js';


vi.mock('../../src/api/items.js', () => ({
  getItems: vi.fn(),
}));

import { getItems } from '../../src/api/items.js';


beforeEach(() => {
  getItems.mockReset();
});


describe('getPollOptions', () => {
  it('calls getItems with the provided partIds', async () => {
    getItems.mockResolvedValueOnce([]);
    await getPollOptions([1, 2, 3]);
    expect(getItems).toHaveBeenCalledWith([1, 2, 3]);
  });

  it('returns items sorted by score descending', async () => {
    getItems.mockResolvedValueOnce([
      { id: 1, type: 'pollopt', score: 10 },
      { id: 2, type: 'pollopt', score: 50 },
      { id: 3, type: 'pollopt', score: 25 },
    ]);

    const result = await getPollOptions([1, 2, 3]);
    expect(result.map(i => i.score)).toEqual([50, 25, 10]);
  });

  it('returns empty array when partIds is empty', async () => {
    getItems.mockResolvedValueOnce([]);
    const result = await getPollOptions([]);
    expect(result).toEqual([]);
  });

  it('handles items with equal scores without crashing', async () => {
    getItems.mockResolvedValueOnce([
      { id: 1, type: 'pollopt', score: 20 },
      { id: 2, type: 'pollopt', score: 20 },
      { id: 3, type: 'pollopt', score: 20 },
    ]);

    const result = await getPollOptions([1, 2, 3]);
    expect(result).toHaveLength(3);
    expect(result.every(i => i.score === 20)).toBe(true);
  });

  it('handles items with undefined score without crashing', async () => {
    getItems.mockResolvedValueOnce([
      { id: 1, type: 'pollopt', score: 10 },
      { id: 2, type: 'pollopt' },             // no score
      { id: 3, type: 'pollopt', score: 5 },
    ]);

    const result = await getPollOptions([1, 2, 3]);
    expect(result).toHaveLength(3);
    expect(result[0].score).toBe(10);
  });

  it('does not mutate the original array returned by getItems', async () => {
    const original = [
      { id: 1, type: 'pollopt', score: 10 },
      { id: 2, type: 'pollopt', score: 50 },
    ];
    getItems.mockResolvedValueOnce(original);

    await getPollOptions([1, 2]);
    // original should still be in its original order
    expect(original[0].score).toBe(10);
    expect(original[1].score).toBe(50);
  });

  it('returns only pollopt type items as provided by getItems', async () => {
    getItems.mockResolvedValueOnce([
      { id: 1, type: 'pollopt', score: 30 },
      { id: 2, type: 'pollopt', score: 10 },
    ]);

    const result = await getPollOptions([1, 2]);
    expect(result.every(i => i.type === 'pollopt')).toBe(true);
  });
});