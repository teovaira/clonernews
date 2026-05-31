import { getStoryIds, getItems } from '../api/items.js';
import { getPollOptions } from '../api/polls.js';
import { getState, setState, resetFeed } from '../store/store.js';
import { startLiveUpdates } from '../api/live.js';
import { openComments } from './comments.js';
import { PAGE_SIZE } from '../constants.js';

/**
 * Switches to feedType. Resets state, clears #feed, fetches the new id list,
 * and renders the first page.
 * @param {'top'|'new'|'ask'|'show'|'job'} feedType
 * @returns {Promise<void>}
 */
export async function switchFeed(feedType) {
  resetFeed();
  setState({ currentFeed: feedType });

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
  // as text rather than relying on a colour-only cue.
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
  commentsBtn.addEventListener('click', () => openComments(item.id));
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
