import { get } from './client.js';
import { HN_BASE, HN_SEARCH_BASE } from '../constants.js';

/**
 * @param {number} id
 * @returns {Promise<Item|null>}
 */
export async function getItem(id) {
  const item = await get(`${HN_BASE}/item/${id}.json`);

  if (!item || item.deleted || item.dead) return null;
  return item;
}

/**
 * Fetches all ids in parallel (respects client.js throttle).
 * Filters out nulls. Does NOT sort — caller sorts.
 * Use this for FEED items (deleted ones should disappear).
 * @param {number[]} ids
 * @returns {Promise<Item[]>}
 */
export async function getItems(ids) {
  const items = await Promise.all(ids.map((id) => getItem(id)));
  return items.filter((item) => item !== null);
}

/**
 * Same as getItems but KEEPS nulls in place (does not filter).
 * Comments need this so deleted comments keep their thread position
 * and can render a "[deleted]" placeholder. Order matches input ids.
 * @param {number[]} ids
 * @returns {Promise<(Item|null)[]>}
 */
export async function getItemsKeepOrder(ids) {
  return Promise.all(ids.map((id) => getItem(id)));
}

/**
 * @param {'top'|'new'|'ask'|'show'|'job'|'poll'} feed
 * @returns {Promise<number[]>}  — ordered by HN (newest first for 'new', ranked for others)
 */
export async function getStoryIds(feed) {
  if (feed === 'poll') {
    const data = await get(`${HN_SEARCH_BASE}/search_by_date?tags=poll&hitsPerPage=100`);
    if (!data || !Array.isArray(data.hits)) return [];

    return data.hits
      .map((hit) => Number(hit.objectID))
      .filter((id) => Number.isInteger(id));
  }

  const endpoints = {
    top: 'topstories',
    new: 'newstories',
    ask: 'askstories',
    show: 'showstories',
    job: 'jobstories',
  };
  const endpoint = endpoints[feed];

  if (!endpoint) return [];

  const ids = await get(`${HN_BASE}/${endpoint}.json`);
  return Array.isArray(ids) ? ids : [];
}
