let state = {
    currentFeed: 'top',
    allIds: [],
    loadedCount: 0,
    loading: false,
    openStoryId: null,
};

const cache = new Map();

/*
 * @returns {FeedState}
 */
export function getState() {
    return { ...state };
}

/*
 * Shallow merges partial into current state.
 * @param {Partial<FeedState>} partial
 * @returns {void}
 */
export function setState(partial) {
    state = { ...state, ...partial };
}

/*
 * Resets allIds→[], loadedCount→0, loading→false.
 * Preserves currentFeed and openStoryId.
 * @returns {void}
 */
export function resetFeed() {
    state = {
        ...state,
        allIds: [],
        loadedCount: 0,
        loading: false,
    };
}

/*
 * @param {number} id
 * @param {Item} item
 * @returns {void}
 */
export function cacheItem(id, item) {
    cache.set(id, item);
}

/*
 * @param {number} id
 * @returns {Item|null}
 */
export function getCached(id) {
    return cache.get(id) ?? null;
}