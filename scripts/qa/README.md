# QA scripts

Browser checks for the swarm pages, run against a dev server. They drive
headless Chrome over the DevTools Protocol; nothing to install (Node 24 has
`fetch` and `WebSocket` built in). Output goes to `scripts/qa/out/`, which is
git-ignored.

```bash
npm run dev
node scripts/qa/shots.mjs http://localhost:3000/ua --theme=light --tag=home
node scripts/qa/audit.mjs http://localhost:3000/ua --phone
node scripts/qa/contrast.mjs http://localhost:3000/en --theme=dark
```

Flags: `--phone` (390x844 touch screen; otherwise 1440x900 with real
scrollbars), `--theme=light|dark` (written to next-themes' `localStorage`
key before the page loads), `--tag=name` (file prefix). Chrome is found at
its usual install path; set `CHROME_PATH` if it lives elsewhere.

| Script | What it tells you |
|---|---|
| `shots.mjs` | One screenshot per section after the swarm settles, plus console errors. |
| `audit.mjs` | Scrolls between neighbouring sections in both directions and back to the top. Per leg: `p95`/`max` bright dots moving more than 6px a frame (the flock that carries the swarm between sections makes this large on purpose, so compare with a baseline run rather than aiming for zero) and `fill`, members per shape for every shape in view. A `!` after a fill means a shape arrived below 97%, which is a bug. |
| `contrast.mjs` | WCAG 2 contrast of every visible text in `main`, `header` and `footer` against its nearest opaque background. Outlined lettering is listed separately to check by eye. Text on a starburst sticker is a known false positive. |

`audit.mjs` reads the engine through `window.__swarm`, which the engine sets
only when `NODE_ENV === "development"` (see `start()` in the engine). A
production build never has it, so run the audit against `npm run dev`.

## Things learned the hard way

- The editor's built-in browser stops `requestAnimationFrame` while its pane is
  hidden, so the swarm cannot be judged there. Use these scripts or a real
  browser window.
- Keep the scrollbars: one bug (the canvas sized from `innerWidth`, which
  includes the scrollbar) only showed with a classic Windows scrollbar.
- CDP screenshot clips of a WebGL canvas come out blank; `crop()` takes a full
  screenshot and cuts it in the page instead.
- Filmstrips (a dozen screenshots during one scroll, tiled into one image) are
  the fastest way to see how the swarm travels: ghosts, late arrivals, jumps.
- The owner notices 1-3px offsets. Measure alignment with
  `getBoundingClientRect()`, do not judge it from a screenshot.
