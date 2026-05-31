import { getStoryIds, getItems } from '../api/items.js';
import { getPollOptions } from '../api/polls.js';
import { getState, setState, resetFeed } from '../store/store.js';
import { startLiveUpdates } from '../api/live.js';
import { openComments } from './comments.js';
import { PAGE_SIZE } from '../constants.js';

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
