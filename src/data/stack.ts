export type StackGroupKey = "languages" | "data" | "styling" | "testing" | "tooling";

/** The stack by category, in the order the tabs show it. The category names
 * are in messages (About.stackGroups); the technologies are proper names. */
export const STACK_GROUPS: { key: StackGroupKey; items: string[] }[] = [
  { key: "languages", items: ["TypeScript", "React", "Next.js", "Node.js", "Nest.js"] },
  { key: "data", items: ["React Query", "Zustand", "Redux", "Zod", "Prisma", "Supabase"] },
  { key: "styling", items: ["Tailwind", "SCSS", "BEM", "shadcn", "Framer Motion"] },
  { key: "testing", items: ["Vitest", "Jest", "React Testing Library", "Playwright", "Cypress"] },
  { key: "tooling", items: ["Turborepo", "Monorepo", "Docker", "Vite", "Git", "Claude Code", "Codex", "Cursor"] },
];

/** Logos the swarm can draw: on the Stack stage, and typed in the hero.
 * Monorepo has no icon and is drawn as its name in dots. The icons added for
 * the swarm were rendered from react-icons: Simple Icons (CC0) in the brand
 * colours Simple Icons publishes, and Bootstrap Icons (MIT) for OpenAI's mark,
 * which stands for Codex. Playwright's logo is the one its own package ships
 * (playwright-core's trace viewer). */
export const TECH_ICONS: Record<string, string> = {
  TypeScript: "/icons/stack/ts.svg",
  React: "/icons/stack/react.svg",
  "Next.js": "/icons/stack/next.svg",
  "Node.js": "/icons/stack/node.svg",
  "Nest.js": "/icons/stack/nest.svg",
  "React Query": "/icons/stack/react-query.svg",
  Zustand: "/icons/stack/zustand.svg",
  Redux: "/icons/stack/redux.svg",
  Zod: "/icons/stack/zod.svg",
  Prisma: "/icons/stack/prisma.svg",
  Supabase: "/icons/stack/supabase.svg",
  Tailwind: "/icons/stack/tail.svg",
  SCSS: "/icons/stack/scss.svg",
  BEM: "/icons/stack/bem.svg",
  shadcn: "/icons/stack/shadcn.svg",
  "Framer Motion": "/icons/stack/fm.svg",
  Vitest: "/icons/stack/vitest.svg",
  Jest: "/icons/stack/jest.svg",
  "React Testing Library": "/icons/stack/testing-library.svg",
  Playwright: "/icons/stack/playwright.svg",
  Cypress: "/icons/stack/cypress.svg",
  Turborepo: "/icons/stack/turborepo.svg",
  Docker: "/icons/stack/docker.svg",
  Vite: "/icons/stack/vite.svg",
  Git: "/icons/stack/git.svg",
  "Claude Code": "/icons/stack/claude.svg",
  Codex: "/icons/stack/codex.svg",
  Cursor: "/icons/stack/cursor.svg",
  GitHub: "/icons/stack/github.svg",
  Telegram: "/icons/stack/telegram.svg",
  LinkedIn: "/icons/stack/linkedin.svg",
};
