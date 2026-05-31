import { initFeed } from './ui/feed.js';

// Single entry point — the only module index.html loads. Bootstrapping lives
// here rather than in feed.js so feed.js stays free of side effects and
// remains unit-testable.
document.addEventListener('DOMContentLoaded', initFeed);
