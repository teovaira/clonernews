import { MAX_CONCURRENT } from '../constants.js';

let activeRequests = 0;
const queue = [];

// Call this after a request finishes to start the next one in the queue, if any.
function runNext() {
  if (activeRequests >= MAX_CONCURRENT || queue.length === 0) return;

  const next = queue.shift();
  activeRequests += 1;
  // next() is the resolve function from a Promise.
  next();
}

// Returns a Promise that resolves when it's this call's turn to make a request.
function waitForSlot() {
  return new Promise((resolve) => {
    queue.push(resolve);
    runNext();
  });
}

/**
 * Throttled fetch. Max MAX_CONCURRENT requests in flight at once.
 * Never rejects — returns null on any failure.
 * @param {string} url
 * @returns {Promise<any|null>}
 */
export async function get(url) {
  await waitForSlot();

  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  } finally {
    activeRequests -= 1;
    runNext();
  }
}
