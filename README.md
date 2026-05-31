# CloneHN

A responsive, accessible UI for the
[Hacker News API](https://github.com/HackerNews/API), built with vanilla
JavaScript ES modules and [Vite](https://vitejs.dev/). It presents stories,
jobs, Ask/Show posts and polls, with nested comment threads, infinite scroll and
live update notifications.

## Features

- **Multiple feeds** — Top, New, Ask, Show and Jobs.
- **Lazy loading** — posts load one page at a time as you scroll; the app never
  loads all posts at once.
- **Newest-first ordering** — feeds and comments are ordered newest to oldest.
- **Live updates** — polls the HN `updates` endpoint every 5 seconds and shows a
  banner when items change; click it to refresh the current feed.
- **Comment threads** — open any post to read its comments in a side drawer,
  newest first, with nested replies and correct parent attribution.
- **Polls** — poll options render with their vote counts, sorted by score.
- **Throttled requests** — a concurrency-limited fetch queue avoids overloading
  the API.
- **Responsive & accessible** — phone to desktop, with keyboard navigation,
  visible focus, ARIA landmarks/live regions, and reduced-motion support.

## Prerequisites

- [Node.js](https://nodejs.org/) 18 or newer (includes `npm`).

## Quick start

```bash
# 1. Clone the repository
git clone https://platform.zone01.gr/git/ckotsalas/clonernews.git
cd clonernews

# 2. Install dependencies
npm install

# 3. Start the dev server (http://localhost:5173 by default)
npm run dev
```

Open the printed local URL in your browser.

## Available commands

| Command             | What it does                                  |
| ------------------- | --------------------------------------------- |
| `npm run dev`       | Start the Vite dev server with hot reload     |
| `npm run build`     | Produce a production build in `dist/`         |
| `npm run preview`   | Serve the production build locally            |
| `npm test`          | Run the unit + integration test suite once    |
| `npm run test:watch`| Run the test suite in watch mode              |
| `npm run coverage`  | Run tests and report coverage                 |

No API key or environment configuration is required — the Hacker News Firebase
REST API is public and unauthenticated.

## Project structure

```
clonernews/
├── src/
│   ├── constants.js           # shared config (API base, page size, poll interval…)
│   ├── app.js                 # entry point — wires initFeed() on DOMContentLoaded
│   ├── api/
│   │   ├── client.js          # throttled fetch with a concurrency limit
│   │   ├── items.js           # item + story-id fetching
│   │   ├── polls.js           # poll option fetching
│   │   └── live.js            # live-update polling and 'hn:update' event
│   ├── store/
│   │   └── store.js           # in-memory feed state + item cache
│   ├── ui/
│   │   ├── feed.js            # feed rendering, paging, nav, live banner
│   │   └── comments.js        # comment tree rendering and the comment drawer
│   └── utils/
│       ├── time.js            # relative time + URL domain helpers
│       └── sanitise.js        # HTML allowlist sanitiser
├── tests/
│   ├── api/                    # client, items, polls, live tests
│   ├── store/                  # store tests
│   ├── ui/                     # feed, comments tests
│   ├── utils/                  # time, sanitise tests
│   └── integration/            # cross-layer event/flow tests
├── index.html                  # markup + shared DOM contract
├── src/style.css               # styles (responsive, accessible)
├── vite.config.js              # Vite + Vitest config
├── package.json
├── package-lock.json
├── .gitignore
├── README.md
├── CHANGELOG.md
└── CONTRIBUTING.md
```

## Tech stack

- Vanilla ES modules — no UI framework.
- Vite for the dev server and bundling.
- Vitest + jsdom for unit and integration tests.
- The official Hacker News Firebase REST API.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for the team's workflow (TDD, conventional
commits) and code conventions.
