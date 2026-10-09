# Working on this portfolio

## Project context

Personal portfolio in a comic-book design ("Комікс"), built with Next.js App Router,
React, TypeScript, Tailwind CSS 4, next-intl and a hand-written WebGL particle swarm.
Preserve the interactive identity: the swarm that letters the name, the clock and the
stack and draws the globe, the tilting project cards, the moving border on the current
role, the comic lettering, and the night (default) and day editions.

## Setup and commands

- Use Node.js 24 and npm. `package.json` pins the runtime to `24.x`.
- Install reproducibly with `npm ci`. Commit `package-lock.json` with dependency changes.
  npm 11.8 drops the `libc` fields from the lockfile; change dependencies with a newer
  npm (for example `npx npm@11.21.0 install`) so the diff holds only the real change.
- `npm run dev` starts the development server.
- `npm run lint` runs ESLint; `npm run typecheck` generates route types and checks TypeScript.
- `npm test` runs the Vitest unit tests: messages, plurals, routing, time zones, swarm maths.
- `npm run test:e2e` runs Playwright against the production build at desktop and Pixel 7
  sizes, in the installed Chrome. Playwright starts `next start` on port 3100 itself;
  run `npm run build` first.
- `npm run build` creates the production build and logs the Node.js version.
  It explicitly retains Webpack (the previous build pipeline); Turbopack's CSS worker
  cannot bind its local IPC port in the current restricted development environment.
  The build downloads Google Fonts (next/font and the link-preview cover).
- `npm start` serves that build for browser verification.
- `scripts/qa` measures the swarm in headless Chrome against `npm run dev` (see its
  README). Use it for animation work: the editor's browser pane pauses
  `requestAnimationFrame` while it is hidden.

## Code map and conventions

- `src/app/[locale]`: the page, the layout and its metadata, global CSS with the design
  tokens of both editions, the link-preview cover (`opengraph-image.tsx`), error and
  not-found UI. `src/app/robots.ts` and `src/app/sitemap.ts` sit outside the locale.
- `src/components/sections`: the page's sections and their small client islands.
- `src/components/comic`: the comic vocabulary: caption, speech bubble, starburst, sound
  effects, panel, moving border, section heads, buttons and fonts.
- `src/components/swarm`: the particle swarm. `Swarm.tsx` mounts the canvas and
  `engine.ts` runs the loop; scenes, allocation, flock, dust, input, quality, eggs,
  pairing, glyphs, shapes, palette and renderer are plain TypeScript modules. Sections
  mark what the swarm draws with `data-swarm-*` attributes; its colours are the
  `--swarm-*` tokens in `globals.css`.
- `src/components/ui/ThemeProvider.tsx`: next-themes, with its script kept hydration-safe.
- `messages/uk.json` and `messages/en.json`: translations with ICU plurals. Keep keys,
  arguments and tags synchronized; `src/i18n/messages.test.ts` checks them.
- `src/i18n`, `src/navigation.ts`, `src/proxy.ts`: locale routing. The internal locale is
  `uk` (BCP 47, so `Intl` formats Ukrainian numbers and plurals); its URL prefix is `/ua`,
  the default. Preserve `/ua` unless a URL migration is requested. The proxy skips
  `opengraph-image`, whose URL Next builds from the internal locale.
- `src/data`: portfolio content (projects, experience, stack, contact, socials, the site
  URL) and the globe data; `public`: project screenshots and icons.
- `src/lib`: Kyiv time-zone helpers, the reduced-motion hook and `cn`.
- Use strict TypeScript, the `@/` import alias, double quotes and semicolons, matching
  surrounding code. Keep Server Components by default and client boundaries narrow.
- Keep browser-only and WebGL code in client components and effects. The swarm is
  decoration: without WebGL, or while its context is lost, the page shows plain text.
- React and React DOM must match.
- TypeScript remains on 5.9 for this migration; evaluate major compiler upgrades separately.
- ESLint stays on 9 because Next.js's React/import/accessibility plugins do not yet
  declare support for ESLint 10. Upgrade together when their peer ranges allow it.

## Validation

Run lint, typecheck, unit tests, the production build and the e2e suite for
dependency, framework or application changes. ESLint runs without exceptions; keep it
at zero warnings.

The e2e suite covers both locales, language and edition switching, the Contents panel,
a missing route, phone widths down to 320px, the swarm (with and without WebGL, a lost
context, reduced motion), project links, contact actions, the resume link and the SEO
tags. Beyond it, check in a real browser what a test cannot judge: the swarm's motion
and shapes (with `scripts/qa`), contrast in both editions, hydration warnings in the
dev console, and the page at desktop and mobile widths. Preserve keyboard access,
visible focus, readable contrast, and reduced-motion preferences when improving
interactions. Record limitations instead of treating untested behavior as passed.

## Changes and deployment

- Keep dependency/runtime/documentation work separate from UI/UX changes in commits.
- Do not change portfolio claims, contact details, or external destinations without intent.
- Never commit secrets, `.env` files, `.vercel`, `node_modules`, or generated `.next` output.
- Vercel project: `volodymyrbondar`, team `vovas-projects-cfe9fb39`.
  Production deploys from `main` to `https://volodymyrbondar.vercel.app`.
- After an authorized production push, verify the deployment matches the commit, reaches
  READY, uses Node.js 24 in build logs, and passes browser smoke checks before starting
  the next stage. The `engines.node` field overrides the dashboard runtime setting.
- Report checks, remaining warnings and deployment status explicitly.

This file follows the project-specific guidance format described at https://agents.md/.
