"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { useRouter, usePathname } from "@/navigation";
import { Button } from "@/components/ui/Button";
import Image from "next/image";

type LocaleItem = "ua" | "en";

function LanguageToggle() {
  const router = useRouter();
  const path = usePathname();
  const currentLocale = useLocale();
  const [locale, setLocale] = useState<LocaleItem>(currentLocale as LocaleItem);

  const handleToggle = () => {
    const newLocale: LocaleItem = locale === "ua" ? "en" : "ua";

    setLocale(newLocale);
    router.replace(path, { locale: newLocale });
  };

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={handleToggle}
      className="dark:border-white/[0.2] border-black-100/[0.2]"
    >
      {locale === "ua" ? (
        <Image src="/ukraine.png" alt="Ukraine" width={20} height={20} />
      ) : (
        <Image
          src="/united_kingdom.png"
          alt="United Kingdom"
          width={20}
          height={20}
        />
      )}
      <span className="sr-only">Toggle language</span>
    </Button>
  );
}

export default LanguageToggle;
