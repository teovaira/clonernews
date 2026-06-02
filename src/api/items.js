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
