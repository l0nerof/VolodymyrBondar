export type StackGroupKey = "frontend" | "data" | "styling" | "backend" | "testing" | "tooling" | "ai";

/** The stack by category, in the order the tabs show it: what the owner's
 * resume and profiles list, cut to what a client, a recruiter or a hiring
 * engineer looks for. The category names are in messages
 * (About.stackGroups); the technologies are proper names. */
export const STACK_GROUPS: { key: StackGroupKey; items: string[] }[] = [
  { key: "frontend", items: ["TypeScript", "JavaScript", "React", "Next.js"] },
  { key: "data", items: ["React Query", "Zustand", "Redux", "Zod", "React Hook Form"] },
  { key: "styling", items: ["Tailwind CSS", "shadcn/ui", "Sass", "Framer Motion"] },
  { key: "backend", items: ["Node.js", "Nest.js", "PostgreSQL", "Prisma", "Supabase", "Firebase"] },
  { key: "testing", items: ["Vitest", "Jest", "React Testing Library", "Playwright", "Cypress"] },
  { key: "tooling", items: ["Git", "Docker", "Turborepo", "Vite", "Webpack", "Vercel"] },
  { key: "ai", items: ["Cursor", "Claude Code", "Codex", "Gemini"] },
];

/** Logos the swarm can draw: on the Stack stage, and typed in the hero. Every
 * technology in the stack has one. The icons added for the swarm were rendered
 * from react-icons: Simple Icons (CC0) in the brand colours Simple Icons
 * publishes, and Bootstrap Icons (MIT) for OpenAI's mark, which stands for
 * Codex. Playwright's logo is the one its own package ships (playwright-core's
 * trace viewer). */
export const TECH_ICONS: Record<string, string> = {
  TypeScript: "/icons/stack/ts.svg",
  JavaScript: "/icons/stack/javascript.svg",
  React: "/icons/stack/react.svg",
  "Next.js": "/icons/stack/next.svg",
  "React Query": "/icons/stack/react-query.svg",
  Zustand: "/icons/stack/zustand.svg",
  Redux: "/icons/stack/redux.svg",
  Zod: "/icons/stack/zod.svg",
  "React Hook Form": "/icons/stack/react-hook-form.svg",
  "Tailwind CSS": "/icons/stack/tail.svg",
  "shadcn/ui": "/icons/stack/shadcn.svg",
  Sass: "/icons/stack/scss.svg",
  "Framer Motion": "/icons/stack/fm.svg",
  "Node.js": "/icons/stack/node.svg",
  "Nest.js": "/icons/stack/nest.svg",
  PostgreSQL: "/icons/stack/postgresql.svg",
  Prisma: "/icons/stack/prisma.svg",
  Supabase: "/icons/stack/supabase.svg",
  Firebase: "/icons/stack/firebase.svg",
  Vitest: "/icons/stack/vitest.svg",
  Jest: "/icons/stack/jest.svg",
  "React Testing Library": "/icons/stack/testing-library.svg",
  Playwright: "/icons/stack/playwright.svg",
  Cypress: "/icons/stack/cypress.svg",
  Git: "/icons/stack/git.svg",
  Docker: "/icons/stack/docker.svg",
  Turborepo: "/icons/stack/turborepo.svg",
  Vite: "/icons/stack/vite.svg",
  Webpack: "/icons/stack/webpack.svg",
  Vercel: "/icons/stack/vercel.svg",
  Cursor: "/icons/stack/cursor.svg",
  "Claude Code": "/icons/stack/claude.svg",
  Codex: "/icons/stack/codex.svg",
  Gemini: "/icons/stack/gemini.svg",
  GitHub: "/icons/stack/github.svg",
  Telegram: "/icons/stack/telegram.svg",
  LinkedIn: "/icons/stack/linkedin.svg",
};
