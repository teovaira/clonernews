import { describe, it, expect, beforeEach } from 'vitest';
import {
  getState,
  setState,
  resetFeed,
  cacheItem,
  getCached,
} from '../../src/store/store.js';

// Reset module state between tests by re-importing fresh state.
// We do this by directly resetting via setState before each test.
beforeEach(() => {
  setState({
    currentFeed:  'top',
    allIds:       [],
    loadedCount:  0,
    loading:      false,
    openStoryId:  null,
  });
});

// ─── getState ─────────────────────────────────────────────────────────────────

describe('getState', () => {
  it('returns the default initial state shape', () => {
    const state = getState();
    expect(state).toMatchObject({
      currentFeed:  'top',
      allIds:       [],
      loadedCount:  0,
      loading:      false,
      openStoryId:  null,
    });
  });

  it('returns a copy, not the internal reference', () => {
    const state = getState();
    state.currentFeed = 'hacked';
    expect(getState().currentFeed).toBe('top');
  });
});

// ─── setState ─────────────────────────────────────────────────────────────────

describe('setState', () => {
  it('merges a single key without wiping other keys', () => {
    setState({ loading: true });
    const state = getState();
    expect(state.loading).toBe(true);
    expect(state.currentFeed).toBe('top');   // untouched
    expect(state.allIds).toEqual([]);         // untouched
    expect(state.loadedCount).toBe(0);        // untouched
  });

  it('merges multiple keys at once', () => {
    setState({ currentFeed: 'new', loadedCount: 20 });
    const state = getState();
    expect(state.currentFeed).toBe('new');
    expect(state.loadedCount).toBe(20);
    expect(state.loading).toBe(false);        // untouched
  });

  it('overwrites allIds correctly', () => {
    setState({ allIds: [1, 2, 3] });
    expect(getState().allIds).toEqual([1, 2, 3]);
  });

  it('sets openStoryId to a number', () => {
    setState({ openStoryId: 42 });
    expect(getState().openStoryId).toBe(42);
  });
});

// ─── resetFeed ────────────────────────────────────────────────────────────────

describe('resetFeed', () => {
  it('resets allIds to empty array', () => {
    setState({ allIds: [1, 2, 3] });
    resetFeed();
    expect(getState().allIds).toEqual([]);
  });

  it('resets loadedCount to 0', () => {
    setState({ loadedCount: 40 });
    resetFeed();
    expect(getState().loadedCount).toBe(0);
  });

  it('resets loading to false', () => {
    setState({ loading: true });
    resetFeed();
    expect(getState().loading).toBe(false);
  });

  it('preserves currentFeed', () => {
    setState({ currentFeed: 'ask' });
    resetFeed();
    expect(getState().currentFeed).toBe('ask');
  });

  it('preserves openStoryId', () => {
    setState({ openStoryId: 99 });
    resetFeed();
    expect(getState().openStoryId).toBe(99);
  });
});

// ─── cacheItem / getCached ────────────────────────────────────────────────────

describe('getCached', () => {
  it('returns null for an unknown id', () => {
    expect(getCached(999999)).toBeNull();
  });

  it('returns null for id 0', () => {
    expect(getCached(0)).toBeNull();
  });
});

describe('cacheItem + getCached', () => {
  it('stores and retrieves an item by id', () => {
    const item = { id: 1, type: 'story', title: 'Test' };
    cacheItem(1, item);
    expect(getCached(1)).toEqual(item);
  });

  it('overwrites an existing cache entry', () => {
    const original = { id: 1, type: 'story', title: 'Original' };
    const updated  = { id: 1, type: 'story', title: 'Updated' };
    cacheItem(1, original);
    cacheItem(1, updated);
    expect(getCached(1).title).toBe('Updated');
  });

  it('stores multiple items independently', () => {
    const a = { id: 1, type: 'story' };
    const b = { id: 2, type: 'job' };
    cacheItem(1, a);
    cacheItem(2, b);
    expect(getCached(1)).toEqual(a);
    expect(getCached(2)).toEqual(b);
  });

  it('cached item is the same reference that was stored', () => {
    const item = { id: 5, type: 'poll' };
    cacheItem(5, item);
    expect(getCached(5)).toBe(item);
  });
});