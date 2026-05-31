# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Project scaffold: `package.json`, `vite.config.js`, `.gitignore`.
- Shared constants (`HN_BASE`, `PAGE_SIZE`, `POLL_MS`, `MAX_CONCURRENT`,
  `FEED_TYPES`).
- Feed UI (`src/ui/feed.js`): feed switching, lazy paging via Intersection
  Observer, story/job/poll card rendering, and the live-update banner.
- Application entry point (`src/app.js`) wiring `initFeed` on `DOMContentLoaded`.
- Markup (`index.html`) with the shared DOM contract, ARIA landmarks, a
  skip-link, an accessible mobile nav toggle, and a live-update status region.
- Styles (`src/style.css`): classic Hacker News theme, sticky header with a
  collapsible mobile nav, story cards, poll options, a right-side comment
  drawer (full-screen on mobile), a loading spinner, and `prefers-reduced-motion`
  support.
- Unit tests for the feed UI (`tests/ui/feed.test.js`).
