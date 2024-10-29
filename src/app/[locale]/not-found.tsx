import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { FaLocationArrow } from "react-icons/fa";
import MagicButton from "@/components/ui/MagicButton";

function NotFound() {
  const locale = useLocale();
  const t = useTranslations("NotFound");

  return (
    <main className="h-[89vh] flex-col flex justify-center items-center gap-5">
      <h1 className="text-3xl font-bold dark:text-white text-black-100">
        {t("title")}
      </h1>
      <Link href={`/${locale}`}>
        <MagicButton icon={<FaLocationArrow />} position="right">
          {t("btn")}
        </MagicButton>
      </Link>
    </main>
  );
}

export default NotFound;
