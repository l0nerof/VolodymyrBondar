export type Social = {
  name: "GitHub" | "LinkedIn" | "Telegram" | "Instagram";
  href: string;
  handle: string;
};

export const SOCIALS: Social[] = [
  { name: "GitHub", href: "https://github.com/l0nerof", handle: "l0nerof" },
  { name: "LinkedIn", href: "https://www.linkedin.com/in/bondar-volodymyr/", handle: "bondar-volodymyr" },
  { name: "Telegram", href: "https://t.me/vovab_17", handle: "@vovab_17" },
  { name: "Instagram", href: "https://www.instagram.com/l0nercs", handle: "l0nercs" },
];
