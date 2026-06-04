# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## ## [1.0.0] — 2026-07-04

### Added

- Feed with story, job, poll, Ask HN, and Show HN posts
- Dedicated Polls feed tab backed by the Algolia HN search API (`hn.algolia.com/api/v1`), returning polls sorted by date
- `HN_SEARCH_BASE` constant for the Algolia API base URL
- `FEED_TYPES` updated to include `'poll'`
- Lazy pagination: load posts on-demand via Intersection Observer, not all at once
- Live update notifications: banner alerts user when new posts appear (polls every 5 seconds)
- Comment threads: nested comments with deleted-comment placeholders, sorted newest-first at every depth
- Comment depth cap: recursion limited to 3 levels for readability and performance
- HTML sanitization: safely render comment text with allowlist of safe tags (p, br, b, i, em, strong, code, pre, a, ul, ol, li, blockquote)
- Relative time display: human-readable timestamps ("just now", "5m ago", "2h ago") with clock-skew handling
- Request throttling: HTTP client limits concurrent requests to 6 (respects API rate limits)
- Item caching: fetched posts and comments cached in memory to avoid duplicate requests
- Accessible UI: ARIA landmarks, semantic markup, keyboard navigation, skip-link, visible focus indicators
- Responsive design: desktop nav tabs, mobile hamburger menu, full-screen comment drawer on phones
- Reduced motion support: animations and transitions respect user preferences
- Classic Hacker News aesthetic: orange header, beige background, compact card layout

### Fixed

- Time formatting: guard against negative/zero timestamps from clock skew (clamp to "just now")
- HTML sanitization: preserve text content when removing disallowed tags
- Link safety: always apply `target="_blank" rel="noopener noreferrer"` to links, regardless of href validity
- Domain display: correctly strip `www.` prefix from URLs shown in comments
- Comment caching: cache every fetched kid in `openComments()` and `renderComment()` to avoid re-fetching on reopen
- Comment depth: cap recursive kid fetch at depth 3 to eliminate unnecessary requests on deep threads
- Live banner: cache intermediate items during `resolveStoryTitle()` parent-chain walk to avoid redundant requests
- Live banner: walk the full parent chain to resolve story title from deeply nested comment IDs
- Poll feed: filter rendered items to poll type only so non-poll items never appear in the Polls tab
- Poll feed: guard against empty `items` array in `live.js` updates to avoid `Math.max()` returning `-Infinity`
- Infinite scroll: add height to scroll sentinel so `IntersectionObserver` fires reliably on scroll
- Infinite scroll: auto-chain next page load when an entire page consists of deleted items so the feed never stalls
- Comments button: stop click event propagating to the document-level click-outside listener to prevent the drawer closing immediately on open
- Comments panel: wire close button and click-outside dismissal in `initFeed()`
- Comments panel: add hover state and keyboard focus ring to the close button
- Store: remove unused import
- Poll rendering: mock async fetch in tests to prevent promise chain breakage

### Documentation

- Add README with project overview, setup instructions, and development commands
- Add CONTRIBUTING guide with team workflow (TDD, conventional commits, no network hits in tests)
