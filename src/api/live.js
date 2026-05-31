import { get } from './client.js';
import { HN_BASE, POLL_MS } from '../constants.js';

let intervalId = null;
let lastSeenMaxId = 0;
let isFirstPoll = true;

async function poll() {
    const data = await get(`${HN_BASE}/updates.json`);
    if (!data || !Array.isArray(data.items)) return;

    const ids = data.items;
    const maxId = Math.max(...ids);

    if (isFirstPoll) {
        lastSeenMaxId = maxId;
        isFirstPoll = false;
        return;
    }

    const newIds = ids.filter(id => id > lastSeenMaxId);

    if (newIds.length > 0) {
        lastSeenMaxId = Math.max(...newIds);
        document.dispatchEvent(new CustomEvent('hn:update', {
            detail: { newIds, count: newIds.length },
        }));
    }
}

/*
 * Starts polling /v0/updates every POLL_MS milliseconds.
 * First poll sets the baseline — does NOT dispatch event.
 * Subsequent polls: if new item IDs found (id > lastSeenMaxId),
 * dispatches CustomEvent 'hn:update' on document with detail: UpdatePayload.
 * @returns {void}
 */
export function startLiveUpdates() {
    if (intervalId !== null) return;

    isFirstPoll = true;
    lastSeenMaxId = 0;

    intervalId = setInterval(poll, POLL_MS);
}

/*
 * Stops polling. Safe to call if never started.
 * @returns {void}
 */
export function stopLiveUpdates() {
    if (intervalId !== null) {
        clearInterval(intervalId);
        intervalId = null;
    }
    isFirstPoll = true;
    lastSeenMaxId = 0;
}