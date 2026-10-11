import { FaGithub, FaInstagram, FaLinkedin, FaTelegram } from "react-icons/fa";

import { SOCIALS, type Social } from "@/data/socials";
import { cn } from "@/lib/utils";

const ICONS: Record<Social["name"], typeof FaGithub> = {
  GitHub: FaGithub,
  LinkedIn: FaLinkedin,
  Telegram: FaTelegram,
  Instagram: FaInstagram,
};

/** The socials as small pop buttons, with the same press as the big ones. */
export function SocialIcons({ className }: { className?: string }) {
  return (
    <ul className={cn("flex flex-wrap gap-3", className)}>
      {SOCIALS.map(({ name, href }) => {
        const Icon = ICONS[name];
        return (
          <li key={name}>
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={name}
              className="inline-flex size-11 items-center justify-center border-[3px] border-on-accent bg-bubble text-bubble-ink shadow-[3px_3px_0_var(--pop)] transition-[translate,box-shadow] duration-200 ease-out hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0_var(--pop)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0_var(--pop)]"
            >
              <Icon aria-hidden className="size-[18px]" />
            </a>
          </li>
        );
      })}
    </ul>
  );
}
