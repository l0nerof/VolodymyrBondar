// Hero easter eggs: words that, typed while the name is on screen, draw
// something other than themselves.

/** Words that draw a logo instead of themselves. */
export const TECH_WORDS: Record<string, string> = {
  react: "React",
  next: "Next.js",
  nextjs: "Next.js",
  "next.js": "Next.js",
  ts: "TypeScript",
  typescript: "TypeScript",
  node: "Node.js",
  nodejs: "Node.js",
  nest: "Nest.js",
  nestjs: "Nest.js",
  redux: "Redux",
  prisma: "Prisma",
  tailwind: "Tailwind",
  vite: "Vite",
  vitest: "Vitest",
  zod: "Zod",
  zustand: "Zustand",
  supabase: "Supabase",
  jest: "Jest",
  cypress: "Cypress",
  scss: "SCSS",
  sass: "SCSS",
  shadcn: "shadcn",
  bem: "BEM",
  docker: "Docker",
  git: "Git",
  turbo: "Turborepo",
  turborepo: "Turborepo",
  claude: "Claude Code",
  tanstack: "React Query",
  "react query": "React Query",
  framer: "Framer Motion",
  "framer motion": "Framer Motion",
  github: "GitHub",
  telegram: "Telegram",
  linkedin: "LinkedIn",
};

/** Words that draw an emoji in its own colours. */
export const EMOJI_WORDS: Record<string, string> = {
  кава: "☕",
  coffee: "☕",
  ракета: "🚀",
  rocket: "🚀",
  кіт: "🐈",
  cat: "🐈",
  серце: "❤️",
  love: "❤️",
  піца: "🍕",
  pizza: "🍕",
};

/** Words that draw Ukraine's outline in the flag's colours. */
export const UKRAINE_WORDS = new Set(["україна", "ukraine", "слава україні"]);
