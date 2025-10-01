import MagicButton from "../ui/MagicButton";
import Link from "next/link";
import { FaLocationArrow } from "react-icons/fa";
import { Boxes } from "../ui/BackgroundBoxes";
import { getTranslations } from "next-intl/server";

async function Contact() {
  const t = await getTranslations("Contact");

  return (
    <section
      id="contact"
      className="sm:mb-32 h-screen md:h-[600px] w-full bg-black-100 relative"
    >
      <div className="flex items-center overflow-hidden justify-center gap-3 flex-col absolute inset-0 w-full h-full dark:bg-black-100 bg-white z-20 [mask-image:radial-gradient(white, transparent)]">
        <Boxes />

        <h2 className="text-4xl sm:text-5xl font-bold max-w-[70vw] sm:max-w-[90vw] lg:max-w-[50vw] text-center dark:text-white text-black-100 relative z-20">
          {t("title")}
          <span className="dark:text-purple-100 text-purple-200">
            {t("highlight")}
          </span>
        </h2>
        <p className="text-base relative z-20 dark:text-white text-black-100 max-w-[70vw] sm:max-w-[90vw] lg:max-w-[50vw] text-center">
          {t("reach-out")}
        </p>

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
