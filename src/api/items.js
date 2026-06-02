import { get } from './client.js';
import { HN_BASE } from '../constants.js';

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
