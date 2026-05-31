import { describe, it, expect, vi, beforeEach } from 'vitest';

// Rule #5: feed.js transitively imports api/, so every dependency is mocked
// with an inline factory. Nothing here ever touches the real network or the
// real teammate modules (which may not exist yet) — Vitest intercepts the
// specifier before it is resolved on disk.

vi.mock('../../src/api/items.js', () => ({
  getStoryIds: vi.fn(),
  getItems: vi.fn(),
}));

vi.mock('../../src/api/polls.js', () => ({
  getPollOptions: vi.fn(),
}));

vi.mock('../../src/api/live.js', () => ({
  startLiveUpdates: vi.fn(),
}));

vi.mock('../../src/ui/comments.js', () => ({
  openComments: vi.fn(),
}));

// The store mock keeps a real mutable object so the loading/loadedCount guards
// in loadNextPage exercise true branching logic rather than a frozen stub.
vi.mock('../../src/store/store.js', () => {
  let state;
  const reset = () => {
    state = {
      currentFeed: 'top',
      allIds: [],
      loadedCount: 0,
      loading: false,
      openStoryId: null,
    };
  };
  reset();
  return {
    getState: vi.fn(() => state),
    setState: vi.fn((partial) => Object.assign(state, partial)),
    resetFeed: vi.fn(() => {
      // Mirror the real contract: clear feed data, preserve currentFeed.
      state.allIds = [];
      state.loadedCount = 0;
      state.loading = false;
    }),
    // Test-only hook so each test starts from a known state.
    __resetStore: reset,
  };
});

import { getStoryIds, getItems } from '../../src/api/items.js';
import { getPollOptions } from '../../src/api/polls.js';
import { startLiveUpdates } from '../../src/api/live.js';
import { openComments } from '../../src/ui/comments.js';
import {
  getState,
  setState,
  resetFeed,
  __resetStore,
} from '../../src/store/store.js';
import {
  initFeed,
  switchFeed,
  loadNextPage,
  renderStoryItem,
  showUpdateBanner,
} from '../../src/ui/feed.js';

// Minimal DOM matching the index.html contract these functions read from.
function mountDom() {
  document.body.innerHTML = `
    <nav id="feed-nav">
      <button class="feed-tab" data-feed="top">Top</button>
      <button class="feed-tab" data-feed="new">New</button>
      <button class="feed-tab" data-feed="ask">Ask</button>
      <button class="feed-tab" data-feed="show">Show</button>
      <button class="feed-tab" data-feed="job">Jobs</button>
    </nav>
    <div id="live-banner" class="hidden"><span id="live-banner-text"></span></div>
    <div id="feed"></div>
    <div id="scroll-sentinel"></div>
  `;
}

// jsdom has no IntersectionObserver; initFeed constructs one, so we stub it
// and capture the callback to simulate the sentinel scrolling into view.
let ioCallback;
beforeEach(() => {
  vi.clearAllMocks();
  __resetStore();
  mountDom();
  ioCallback = null;
  global.IntersectionObserver = class {
    constructor(cb) {
      ioCallback = cb;
    }
    observe() {}
    disconnect() {}
    unobserve() {}
  };
});

describe('renderStoryItem', () => {
  it('returns an element whose data-id matches item.id', () => {
    const el = renderStoryItem(
      { id: 42, type: 'story', title: 'Hello', by: 'me', time: 1, score: 5 },
      1,
    );
    expect(el.dataset.id).toBe('42');
  });

  it('renders the correct type badge for story, job and poll', () => {
    const story = renderStoryItem({ id: 1, type: 'story', title: 'S', by: 'a', time: 1 }, 1);
    const job = renderStoryItem({ id: 2, type: 'job', title: 'J', by: 'b', time: 1 }, 2);
    const poll = renderStoryItem({ id: 3, type: 'poll', title: 'P', by: 'c', time: 1, parts: [] }, 3);

    expect(story.textContent.toLowerCase()).toContain('story');
    expect(job.textContent.toLowerCase()).toContain('job');
    expect(poll.textContent.toLowerCase()).toContain('poll');
  });

  it('does not crash when score is undefined (job items)', () => {
    expect(() =>
      renderStoryItem({ id: 7, type: 'job', title: 'Hiring', by: 'co', time: 1 }, 1),
    ).not.toThrow();
  });

  it('wires the comments button to openComments with the numeric item id', () => {
    const el = renderStoryItem(
      { id: 99, type: 'story', title: 'X', by: 'u', time: 1, descendants: 3 },
      1,
    );
    el.querySelector('.comments-btn').click();
    expect(openComments).toHaveBeenCalledWith(99);
  });

  it('renders a poll card synchronously and fills options when getPollOptions resolves', async () => {
    let resolveOpts;
    getPollOptions.mockReturnValue(new Promise((r) => (resolveOpts = r)));

    const el = renderStoryItem(
      { id: 5, type: 'poll', title: 'Poll?', by: 'pg', time: 1, parts: [10, 11] },
      1,
    );

    // Synchronous: the options container exists immediately but is empty.
    const optsDiv = el.querySelector('.poll-options');
    expect(optsDiv).not.toBeNull();
    expect(getPollOptions).toHaveBeenCalledWith([10, 11]);

    resolveOpts([
      { id: 11, type: 'pollopt', text: 'B', score: 9 },
      { id: 10, type: 'pollopt', text: 'A', score: 3 },
    ]);
    await vi.waitFor(() => expect(optsDiv.children.length).toBe(2));
  });
});

describe('showUpdateBanner', () => {
  it('removes the hidden class from #live-banner', () => {
    const banner = document.getElementById('live-banner');
    expect(banner.classList.contains('hidden')).toBe(true);

    showUpdateBanner({ newIds: [1, 2, 3], count: 3 });

    expect(banner.classList.contains('hidden')).toBe(false);
  });

  it('writes the update count into #live-banner-text', () => {
    showUpdateBanner({ newIds: [1, 2, 3], count: 3 });
    expect(document.getElementById('live-banner-text').textContent).toContain('3');
  });
});

describe('switchFeed', () => {
  it('calls resetFeed before fetching ids', async () => {
    const order = [];
    resetFeed.mockImplementation(() => order.push('reset'));
    getStoryIds.mockImplementation(async () => {
      order.push('fetch');
      return [];
    });

    await switchFeed('new');

    expect(order[0]).toBe('reset');
    expect(getStoryIds).toHaveBeenCalledWith('new');
  });

  it('stores the fetched ids and records the new current feed', async () => {
    getStoryIds.mockResolvedValue([300, 200, 100]);
    getItems.mockResolvedValue([]);

    await switchFeed('new');

    expect(setState).toHaveBeenCalledWith(expect.objectContaining({ currentFeed: 'new' }));
    expect(getState().allIds).toEqual([300, 200, 100]);
  });
});

describe('loadNextPage', () => {
  it('returns immediately when a load is already in flight', async () => {
    setState({ loading: true, allIds: [1, 2, 3] });

    await loadNextPage();

    expect(getItems).not.toHaveBeenCalled();
  });

  it('does nothing when everything is already loaded', async () => {
    setState({ allIds: [1, 2], loadedCount: 2, loading: false });

    await loadNextPage();

    expect(getItems).not.toHaveBeenCalled();
  });

  it('appends rendered items to #feed and advances loadedCount', async () => {
    setState({ allIds: [1, 2], loadedCount: 0, loading: false });
    getItems.mockResolvedValue([
      { id: 1, type: 'story', title: 'One', by: 'a', time: 1 },
      { id: 2, type: 'story', title: 'Two', by: 'b', time: 1 },
    ]);

    await loadNextPage();

    expect(document.querySelectorAll('#feed .story-item').length).toBe(2);
    expect(getState().loadedCount).toBe(2);
    expect(getState().loading).toBe(false);
  });

  it('clears the loading flag even if the fetch rejects', async () => {
    setState({ allIds: [1], loadedCount: 0, loading: false });
    getItems.mockRejectedValue(new Error('network'));

    await loadNextPage();

    expect(getState().loading).toBe(false);
  });
});

describe('initFeed', () => {
  it('starts live updates and reacts to hn:update by showing the banner', () => {
    getStoryIds.mockResolvedValue([]);
    getItems.mockResolvedValue([]);

    initFeed();

    expect(startLiveUpdates).toHaveBeenCalled();

    document.dispatchEvent(
      new CustomEvent('hn:update', { detail: { newIds: [9], count: 1 } }),
    );
    expect(document.getElementById('live-banner').classList.contains('hidden')).toBe(false);
  });

  it('observes the scroll sentinel and loads a page when it intersects', async () => {
    getStoryIds.mockResolvedValue([]);
    getItems.mockResolvedValue([]);

    initFeed();
    expect(ioCallback).toBeTypeOf('function');

    // Simulate the sentinel entering the viewport.
    setState({ allIds: [1], loadedCount: 0, loading: false });
    getItems.mockResolvedValue([{ id: 1, type: 'story', title: 'X', by: 'a', time: 1 }]);
    ioCallback([{ isIntersecting: true }]);

    await vi.waitFor(() =>
      expect(document.querySelectorAll('#feed .story-item').length).toBe(1),
    );
  });
});
