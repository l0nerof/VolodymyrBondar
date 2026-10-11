import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";

import { SectionHead } from "@/components/comic/SectionHead";
import { popButton } from "@/components/comic/buttons";
import { Link } from "@/navigation";

export default function NotFound() {
  const t = useTranslations("NotFound");

  return (
    // Fills the page between the header and the footer, content centred.
    <section className="flex flex-1 flex-col justify-center pt-29 pb-20">
      <SectionHead as="h1" chapter={t("caption")} title={t("title")} />
      <Link href="/" className={`${popButton.accent} self-start`}>
        {t("home")}
        <ArrowRight aria-hidden className="size-4 shrink-0" strokeWidth={3} />
      </Link>
    </section>
  );
}
