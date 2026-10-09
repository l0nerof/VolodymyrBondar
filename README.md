# Volodymyr Bondar · Portfolio

My portfolio, drawn as issue #1 of a comic: the name lettered by a swarm of particles,
chapters for my work, experience and approach, and a last page to get in touch. It
comes in a night edition (the default) and a day edition, in Ukrainian (`/ua`) and
English (`/en`).

Live: https://volodymyrbondar.vercel.app

## Inside

- **Next.js App Router** with Server Components; the interactive parts are small client
  islands.
- **A WebGL particle swarm**, written from scratch: a few thousand particles in one draw
  call letter the name, the clock and the stack, draw the globe and flock between
  sections. They answer the cursor, clicks and typing, hold still for reduced motion,
  and give way to plain text without WebGL.
- **Tailwind CSS 4** with the comic's design tokens for both editions.
- **next-intl** with ICU plurals for Ukrainian and English, plus metadata, a link-preview
  cover and a sitemap for both languages.
- **Vitest** for the logic and **Playwright** for the pages, at desktop and phone sizes.

## Local development

Use Node.js 24 and npm:

```sh
npm ci
npm run dev
```

Checks: `npm run lint`, `npm run typecheck` and `npm test`, then `npm run build` and
`npm run test:e2e` (Playwright starts the production server itself). `scripts/qa` holds
browser checks for the swarm; see its README. [AGENTS.md](AGENTS.md) has the project
conventions.

Vercel builds with Node.js `24.x` from `package.json`; the build logs print the actual
runtime.

## Contact

The last page of the site has my email, resume and channels.
