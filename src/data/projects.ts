export type ProjectKey =
  | "rollin"
  | "nemoMoney"
  | "bondarDesign"
  | "dotSorter"
  | "wildOasis"
  | "wildOasisAdmin"
  | "natours";

export type Project = {
  key: ProjectKey;
  /** A screenshot in /public. */
  img: string;
  /** The live site; private projects have none. */
  link?: string;
  kind: "commercial" | "personal";
  year: number;
  stack: string[];
};

/** In the gallery's order. Titles, descriptions, roles and results are in
 * messages (Projects.items). */
export const PROJECTS: Project[] = [
  {
    key: "rollin",
    img: "/rollin.jpg",
    kind: "commercial",
    year: 2024,
    stack: ["Next.js", "TypeScript", "Zustand", "React Query", "Firebase"],
  },
  {
    key: "nemoMoney",
    img: "/nemo-money.jpg",
    link: "https://explore.nemo.money/",
    kind: "commercial",
    year: 2024,
    stack: ["Next.js", "TypeScript", "shadcn", "React Query"],
  },
  {
    key: "bondarDesign",
    img: "/bondardesign.jpg",
    link: "https://www.bondardesign.com/",
    kind: "commercial",
    year: 2023,
    stack: ["Next.js", "TypeScript", "SCSS", "Framer Motion"],
  },
  {
    key: "dotSorter",
    img: "/dot-sorter-game.jpg",
    link: "https://dot-sorter-game.vercel.app/",
    kind: "personal",
    year: 2024,
    stack: ["Vite", "React", "TypeScript", "Tailwind"],
  },
  {
    key: "wildOasis",
    img: "/wild-oasis.jpg",
    link: "https://the-wild-oasis-website-nine.vercel.app/",
    kind: "personal",
    year: 2023,
    stack: ["Next.js", "React", "Supabase"],
  },
  {
    key: "wildOasisAdmin",
    img: "/wild-oasis-admin.jpg",
    link: "https://the-wild-oasis-henna-theta.vercel.app/",
    kind: "personal",
    year: 2023,
    stack: ["React", "Vite", "Supabase", "styled-components"],
  },
  {
    key: "natours",
    img: "/natours.jpg",
    link: "https://l0nerof.github.io/Natours/",
    kind: "personal",
    year: 2022,
    stack: ["HTML", "SCSS", "BEM"],
  },
];
