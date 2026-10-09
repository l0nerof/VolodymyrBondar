import { useTranslations } from "next-intl";

import { SectionHead } from "@/components/comic/SectionHead";
import { popButton } from "@/components/comic/buttons";
import { Link } from "@/navigation";

export default function NotFound() {
  const t = useTranslations("NotFound");

  return (
    <section className="flex min-h-[70svh] flex-col justify-center pt-29 pb-20">
      <SectionHead as="h1" chapter={t("caption")} title={t("title")} />
      <Link href="/" className={`${popButton.accent} self-start`}>
        {t("home")} <span aria-hidden>→</span>
      </Link>
    </section>
  );
}
