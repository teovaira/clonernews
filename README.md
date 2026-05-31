# CloneHN

A UI for the [Hacker News API](https://github.com/HackerNews/API), built with
vanilla JavaScript and [Vite](https://vitejs.dev/). It presents stories, jobs,
Ask/Show posts and polls, with comment threads, infinite scroll and live update
notifications.

## Features

- **Multiple feeds** — Top, New, Ask, Show and Jobs.
- **Lazy loading** — posts load a page at a time as you scroll, never all at once.
- **Live updates** — polls the HN `updates` endpoint and shows a banner when new
  items arrive; click it to refresh the current feed.
- **Comment threads** — open any post to read its comments in a side drawer,
  newest first, with nested replies.
- **Polls** — poll options render with their vote counts.
- **Responsive & accessible** — works from phone to desktop, with keyboard
  navigation, focus styles, ARIA landmarks and reduced-motion support.

## Getting started

```bash
npm install
npm run dev      # start the Vite dev server
npm run build    # production build
npm test         # run the unit test suite (Vitest)
```

## Tech

- Vanilla ES modules — no UI framework.
- Vite for dev server and bundling.
- Vitest + jsdom for tests.
- The official HN Firebase REST API (no auth required).

## Project layout

```
src/
  app.js          entry point
  constants.js    shared config (API base, page size, poll interval…)
  api/            network layer (client, items, polls, live updates)
  store/          in-memory feed state and item cache
  ui/             feed rendering and comment threads
  utils/          time formatting, URL parsing, HTML sanitising
tests/            mirrors src/, plus integration tests
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for the team's workflow and conventions.
