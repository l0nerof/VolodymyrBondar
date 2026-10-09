"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";

import { SectionHead } from "@/components/comic/SectionHead";
import { popButton } from "@/components/comic/buttons";
import { Link } from "@/navigation";

export default function ErrorPage({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  const t = useTranslations("Error");

  useEffect(() => {
    console.error("The page failed to render", error);
  }, [error]);

  return (
    <section className="flex min-h-[70svh] flex-col justify-center pt-29 pb-20">
      <SectionHead as="h1" chapter={t("caption")} title={t("title")} />
      <div className="flex flex-wrap gap-4">
        <button type="button" onClick={() => retry()} className={`${popButton.accent} cursor-pointer`}>
          {t("retry")}
        </button>
        <Link href="/" className={popButton.bubble}>
          {t("home")}
        </Link>
      </div>
    </section>
  );
}
