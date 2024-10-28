import { useTranslations } from "next-intl";
import Socials from "../ui/Socials";

function Footer() {
  const t = useTranslations("Footer");

  return (
    <footer className="flex flex-col sm:flex-row  items-center justify-between gap-5 p-8">
      <p className="text-sm dark:text-white text-black-100">{t("copyright")}</p>

      <Socials />
    </footer>
  );
}

export default Footer;
