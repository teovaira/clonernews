import { getItems } from './items.js';

/*
 * Fetches poll option items for a poll's parts array.
 * Returns items sorted by score descending.
 * @param {number[]} partIds
 * @returns {Promise<Item[]>}  — type 'pollopt', sorted score desc
 */

export async function getPollOptions(partIds) {
    const items = await getItems(partIds);
    return [...items].sort((a,b) => (b.score ?? 0) - (a.score ?? 0));
}