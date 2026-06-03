import { getStoryIds, getItems } from '../api/items.js';
import { getPollOptions } from '../api/polls.js';
import { getState, setState, resetFeed } from '../store/store.js';
import { startLiveUpdates } from '../api/live.js';
import { openComments, closeComments } from './comments.js';
import { PAGE_SIZE } from '../constants.js';

/**
 * Entry point. Call once on DOMContentLoaded.
 * Sets up nav listeners, Intersection Observer on #scroll-sentinel,
 * listens for 'hn:update' on document, calls startLiveUpdates().
 * @returns {void}
 */
export function initFeed() {
  // One delegated listener on the nav rather than one per tab: keeps the
  // wiring intact even if the tab markup is regenerated.
  const nav = document.getElementById('feed-nav');
  const navToggle = document.getElementById('nav-toggle');

  // Hamburger drives the mobile nav purely through aria-expanded: the CSS
  // sibling selector reveals the menu, so the accessible state IS the visual
  // state — they can't drift apart.
  if (navToggle) {
    navToggle.addEventListener('click', () => {
      const open = navToggle.getAttribute('aria-expanded') === 'true';
      navToggle.setAttribute('aria-expanded', String(!open));
    });
  }

  if (nav) {
    nav.addEventListener('click', (e) => {
      const tab = e.target.closest('.feed-tab');
      if (tab) {
        switchFeed(tab.dataset.feed);
        // Collapse the menu after a choice so it doesn't stay covering the
        // feed on mobile.
        if (navToggle) navToggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // The banner is the only signal that data changed; clicking it re-runs the
  // current feed so the user pulls new items deliberately — we never silently
  // reorder the list under their scroll position.
  const banner = document.getElementById('live-banner');
  if (banner) {
    banner.addEventListener('click', () => {
      banner.classList.add('hidden');
      switchFeed(getState().currentFeed);
    });
  }

  // Infinite scroll is driven by the user reaching the sentinel, which is what
  // satisfies "do not load all posts at once".
  const sentinel = document.getElementById('scroll-sentinel');
  if (sentinel && typeof IntersectionObserver !== 'undefined') {
    const observer = new IntersectionObserver((entries) => {
      // loadNextPage has its own in-flight guard, so repeated intersections
      // are harmless and need no extra debounce here.
      if (entries.some((entry) => entry.isIntersecting)) loadNextPage();
    });
    observer.observe(sentinel);
  }

  // Close button in the comment drawer — wired here because feed.js owns the
  // DOM setup; comments.js owns the logic but not the event binding.
  const closeBtn = document.getElementById('close-comments');
  if (closeBtn) closeBtn.addEventListener('click', closeComments);

  // Click outside the panel to dismiss it — only when the panel is visible,
  // and only when the click lands outside the panel itself.
  document.addEventListener('click', (e) => {
    const panel = document.getElementById('comment-panel');
    if (panel && !panel.classList.contains('hidden') && !panel.contains(e.target)) {
      closeComments();
    }
  });

  // live.js owns polling and only emits the event; feed.js reacts to it.
  // Keeping the listener here preserves the one-way data flow.
  document.addEventListener('hn:update', (e) => showUpdateBanner(e.detail));

  startLiveUpdates();

  // Render the default feed so the page is never empty on first paint.
  switchFeed(getState().currentFeed);
}

/**
 * Switches to feedType. Resets state, clears #feed, fetches the new id list,
 * and renders the first page.
 * @param {'top'|'new'|'ask'|'show'|'job'} feedType
 * @returns {Promise<void>}
 */
export async function switchFeed(feedType) {
  resetFeed();
  setState({ currentFeed: feedType });

  // Move aria-current to the chosen tab now (before the await) so the active
  // highlight and the screen-reader "current page" state track the click
  // immediately, not after the network round-trip.
  document.querySelectorAll('.feed-tab').forEach((tab) => {
    if (tab.dataset.feed === feedType) {
      tab.setAttribute('aria-current', 'page');
    } else {
      tab.removeAttribute('aria-current');
    }
  });

  const feed = document.getElementById('feed');
  if (feed) feed.innerHTML = '';

  const ids = await getStoryIds(feedType);

  // Race guard: the await yielded, so the user may have clicked another tab.
  // If the current feed changed, this fetch is stale — drop it.
  if (getState().currentFeed !== feedType) return;

  // Store ids as-is: per the Ordering Rule the HN feed order is already
  // newest-first (or correctly ranked for 'top'). Re-sorting would require
  // fetching every item, which is exactly what we must avoid.
  setState({ allIds: ids });
  await loadNextPage();
}

/**
 * Loads the next PAGE_SIZE items and appends them to #feed.
 * @returns {Promise<void>}
 */
export async function loadNextPage() {
  const state = getState();

  // One page in flight at a time. Without this guard, a burst of sentinel
  // intersections would fire overlapping fetches and spam the API.
  if (state.loading) return;
  if (state.loadedCount >= state.allIds.length) return;

  const feedAtStart = state.currentFeed;
  const start = state.loadedCount;
  const nextIds = state.allIds.slice(start, start + PAGE_SIZE);

  setState({ loading: true });
  let items = [];
  try {
    items = await getItems(nextIds);
  } catch {
    // If the whole batch rejects we still must release the lock in `finally`,
    // otherwise the feed would be permanently stuck.
    items = [];
  } finally {
    setState({ loading: false });
  }

  // Race guard: discard results if the user switched feeds mid-fetch.
  if (getState().currentFeed !== feedAtStart) return;

  const feed = document.getElementById('feed');
  if (feed) {
    items.forEach((item, i) => {
      // Rank is 1-based and continues across pages so numbering stays stable.
      feed.appendChild(renderStoryItem(item, start + i + 1));
    });
  }

  // Advance by the page span, not items.length: getItems may have filtered
  // deleted entries, but those ids are still consumed from allIds.
  setState({ loadedCount: start + nextIds.length });

  // If the whole page was deleted items, nothing was appended so the sentinel
  // won't re-fire. Chain the next page automatically so the feed doesn't stall.
  const updated = getState();
  if (items.length === 0 && updated.loadedCount < updated.allIds.length) {
    loadNextPage();
  }
}

/**
 * Creates and returns a DOM element for one story/job/poll/ask/show item.
 * SYNCHRONOUS — returns the card skeleton immediately; poll options fill in
 * later so a slow poll fetch never blocks the rest of the feed from rendering.
 * @param {Item} item
 * @param {number} rank   — 1-based display rank
 * @returns {HTMLElement}
 */
export function renderStoryItem(item, rank) {
  const card = document.createElement('article');
  card.className = 'story-item';
  card.dataset.id = String(item.id);

  const badge = document.createElement('span');
  badge.className = 'type-badge';
  // The badge is the accessible label of the post type, so we render the type
  // as text rather than relying on a colour-only cue. data-type drives the
  // per-type tint in CSS — the colour is purely a redundant visual layer.
  badge.dataset.type = item.type;
  badge.textContent = item.type;
  card.appendChild(badge);

  const title = document.createElement('h2');
  title.className = 'story-title';
  if (item.url) {
    // Stories link out; jobs/asks/polls without a url render as plain text.
    const link = document.createElement('a');
    link.href = item.url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = item.title ?? '';
    title.appendChild(link);
  } else {
    title.textContent = item.title ?? '';
  }
  card.appendChild(title);

  const meta = document.createElement('div');
  meta.className = 'story-meta';
  // Jobs carry no score; coalesce so undefined never reaches the DOM as "NaN".
  const score = item.score ?? 0;
  const parts = [`#${rank}`];
  if (item.type !== 'job') parts.push(`${score} points`);
  if (item.by) parts.push(`by ${item.by}`);
  meta.textContent = parts.join(' · ');
  card.appendChild(meta);

  // Poll options are fetched lazily and filled once resolved. The empty
  // container is created now so the async fill has a stable target and this
  // function can stay synchronous (the contract forbids making it async).
  if (item.type === 'poll' && Array.isArray(item.parts)) {
    const optsDiv = document.createElement('div');
    optsDiv.className = 'poll-options';
    card.appendChild(optsDiv);
    getPollOptions(item.parts)
      .then((opts) => {
        (opts ?? []).forEach((opt) => {
          const row = document.createElement('div');
          row.className = 'poll-option';
          row.textContent = `${opt.text ?? ''} (${opt.score ?? 0})`;
          optsDiv.appendChild(row);
        });
      })
      .catch(() => {
        // A failed poll fetch degrades gracefully — the card still renders,
        // just without options — and never throws into the feed loop.
      });
  }

  const commentsBtn = document.createElement('button');
  commentsBtn.className = 'comments-btn';
  commentsBtn.dataset.id = String(item.id);
  const count = item.descendants ?? 0;
  commentsBtn.textContent = `${count} comments`;
  // Pass the id directly: openComments must not scrape it back out of the DOM
  // (frozen contract with Vasiliki's comments.js).
  // stopPropagation prevents the document-level click-outside listener from
  // treating this button click as an "outside the panel" click and immediately
  // closing the drawer the moment it opens.
  commentsBtn.addEventListener('click', (e) => { e.stopPropagation(); openComments(item.id); });
  card.appendChild(commentsBtn);

  return card;
}

/**
 * Makes #live-banner visible and announces how many items changed.
 * @param {UpdatePayload} payload
 * @returns {void}
 */
export function showUpdateBanner(payload) {
  const banner = document.getElementById('live-banner');
  if (!banner) return;
  const text = document.getElementById('live-banner-text');
  if (text) {
    const count = payload?.count ?? 0;
    // Pluralise so the message reads naturally for a single update too.
    text.textContent = `${count} new or updated item${count === 1 ? '' : 's'} — click to refresh`;
  }
  banner.classList.remove('hidden');
}
