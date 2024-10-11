import { useTranslations } from "next-intl";
import MagicButton from "../ui/MagicButton";
import Link from "next/link";
import { FaLocationArrow } from "react-icons/fa";

function Contact() {
  const t = useTranslations("Contact");

  return (
    <section className="mb-32 flex items-center justify-center gap-3 flex-col">
      <h2 className="text-5xl font-bold max-w-[50vw] text-center">
        {t("title")}
      </h2>
      <p className="text-base">{t("reach-out")}</p>

      <Link href="/">
        <MagicButton icon={<FaLocationArrow />} position="right">
          {t("btn")}
        </MagicButton>
      </Link>
    </section>
  );
}
export default Contact;
