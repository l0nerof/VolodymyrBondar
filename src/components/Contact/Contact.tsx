import { useTranslations } from "next-intl";
import MagicButton from "../ui/MagicButton";
import Link from "next/link";
import { FaLocationArrow } from "react-icons/fa";
import { Boxes } from "../ui/BackgroundBoxes";

function Contact() {
  const t = useTranslations("Contact");

  return (
    <section
      id="contact"
      className="mb-32 h-[60vh] w-full bg-black-100 relative"
    >
      <div className="flex items-center overflow-hidden justify-center gap-3 flex-col absolute inset-0 w-full h-full dark:bg-black-100 bg-white z-20 [mask-image:radial-gradient(white,white)]">
        <Boxes />

        <h2 className="text-5xl font-bold max-w-[50vw] text-center relative z-20">
          {t("title")}
        </h2>
        <p className="text-base relative z-20">{t("reach-out")}</p>

        <Link
          href="https://drive.google.com/file/d/1hhQDKHFjVJh8Tj3Qsc8iTDswi-K7VF-Z/view?usp=sharing"
          rel="noopener noreferrer"
          target="_blank"
          className="relative z-20"
        >
          <MagicButton icon={<FaLocationArrow />} position="right">
            {t("btn")}
          </MagicButton>
        </Link>
      </div>
    </section>
  );
}
export default Contact;
