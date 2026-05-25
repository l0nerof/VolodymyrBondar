"use client";

import { useEffect, useState } from "react";
import Socials from "../ui/Socials";
import { useTranslations } from "next-intl";

function Footer() {
  const t = useTranslations("Footer");
  const [currentYear, setCurrentYear] = useState("");

  useEffect(() => {
    setCurrentYear(new Date().getFullYear().toString());
  }, []);

  const copyright = t("copyright").replace(/\d{4}/, currentYear);

  return (
    <footer className="flex flex-col sm:flex-row  items-center justify-between gap-5 p-8">
      <p className="text-sm dark:text-white text-black-100">{copyright}</p>

      <Socials />
    </footer>
  );
}

export default Footer;
