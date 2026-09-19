# Working on this portfolio

## Project context

Personal portfolio built with Next.js App Router, React, TypeScript, Tailwind CSS,
next-intl, Framer Motion, and React Three Fiber. Preserve the interactive identity:
3D globe, hover cards, animated borders, text reveals, and light/dark themes.

## Setup and commands

- Use Node.js 24 and npm. `package.json` pins the runtime to `24.x`.
- Install reproducibly with `npm ci`. Commit `package-lock.json` with dependency changes.
- `npm run dev` starts the development server.
- `npm run lint` runs ESLint; `npm run typecheck` generates route types and checks TypeScript.
- `npm run build` creates the production build and logs the Node.js version.
  It explicitly retains Webpack (the previous build pipeline); Turbopack's CSS worker
  cannot bind its local IPC port in the current restricted development environment.
- `npm start` serves that build for browser verification.
- There is no automated test suite yet. Do not claim tests passed based only on a build.

## Code map and conventions

- `src/app/[locale]`: page, layout, global CSS, error and not-found UI.
- `src/components`: page sections; `src/components/ui`: reusable interactive components.
- `messages/en.json` and `messages/ua.json`: translations. Keep keys synchronized.
- `src/i18n`, `src/navigation.ts`, `src/proxy.ts`: locale routing. The existing Ukrainian
  URL code is `ua`, the default locale; preserve it unless a URL migration is requested.
- `src/data`: portfolio content and globe data; `public`: images, icons and resume.
- Use strict TypeScript, the `@/` import alias, double quotes and semicolons, matching
  surrounding code. Keep Server Components by default and client boundaries narrow.
- Keep browser-only/WebGL code behind client boundaries and the existing dynamic import.
- React and React DOM must match. Check React Three Fiber peer dependencies before
  upgrading React; currently Fiber 9.7 requires React below 19.3.
- TypeScript remains on 5.9 for this migration; evaluate major compiler upgrades separately.
- ESLint stays on 9 because Next.js's React/import/accessibility plugins do not yet
  declare support for ESLint 10. Upgrade together when their peer ranges allow it.

## Validation

Run lint, typecheck and production build for dependency/framework or application changes.
New React compiler lint diagnostics in specific existing components are temporarily
warnings in `eslint.config.mjs`; do not extend those exceptions to new code. Resolve
them alongside the relevant animation/hydration refactor and remove the exceptions.

In a real browser, verify `/ua` and `/en`, language switching, theme switching, navigation
anchors, project links, resume download, contact actions, and a missing route. Check
desktop and mobile widths, browser errors, hydration and WebGL rendering. Preserve
keyboard access, visible focus, readable contrast, and reduced-motion preferences when
improving interactions. Record limitations instead of treating untested behavior as passed.

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
