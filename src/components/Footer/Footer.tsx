import { useTranslations } from "next-intl";
import Socials from "../ui/Socials";

function Footer() {
  const t = useTranslations("Footer");

  return (
    <footer className="flex items-center justify-between gap-2 p-8">
      <p className="text-sm">{t("copyright")}</p>

      <Socials />
    </footer>
  );
}

export default Footer;
