# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Feed with story, job, poll, Ask HN, and Show HN posts
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
- Poll rendering: mock async fetch in tests to prevent promise chain breakage

### Documentation

- Add README with project overview, setup instructions, and development commands
- Add CONTRIBUTING guide with team workflow (TDD, conventional commits, no network hits in tests)
