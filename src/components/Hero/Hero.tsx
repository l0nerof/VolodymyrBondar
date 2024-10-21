import Link from "next/link";
import MagicButton from "../ui/MagicButton";
// import Spotlight from "../ui/Spotlight";
import { TextGenerateEffect } from "../ui/TextGenerate";
import { useTranslations } from "next-intl";
import { FaLocationArrow } from "react-icons/fa";

function Hero() {
  const t = useTranslations("Hero");

  return (
    <section className="pb-36 pt-52">
      {/* <Spotlight className="-top-60 left-60" /> */}

      <div className="h-[70vh] w-full dark:bg-black-100 bg-white dark:bg-grid-white/[0.03] bg-grid-black/[0.03] absolute top-0 left-0 flex items-center justify-center">
        <div className="absolute pointer-events-none inset-0 flex items-center justify-center dark:bg-black-100 bg-white [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]"></div>
      </div>

      <div className="flex justify-center relative my-20 z-10">
        <div className="flex justify-center flex-col items-center max-w-[60vw]">
          <TextGenerateEffect
            className="text-center text-5xl"
            words={t("title")}
            filter={false}
          />
          <Link href="#">
            <MagicButton icon={<FaLocationArrow />} position="right">
              {t("btn")}
            </MagicButton>
          </Link>
        </div>
      </div>
    </section>
  );
}
export default Hero;
