import Link from "next/link";
import MagicButton from "../ui/MagicButton";
import { TextGenerateEffect } from "../ui/TextGenerate";
import { FaLocationArrow } from "react-icons/fa";
import { getTranslations } from "next-intl/server";

async function Hero() {
  const t = await getTranslations("Hero");

  return (
    <section className="pb-28 sm:pb-36 pt-52">
      <div className="h-[75vh] w-full dark:bg-black-100 bg-white absolute top-0 left-0 flex items-center justify-center [background-size:80px_80px] [background-image:linear-gradient(to_right,#e4e4e7_1px,transparent_1px),linear-gradient(to_bottom,#e4e4e7_1px,transparent_1px)] dark:[background-image:linear-gradient(to_right,#262626_1px,transparent_1px),linear-gradient(to_bottom,#262626_1px,transparent_1px)]">
        <div className="absolute pointer-events-none inset-0 flex items-center justify-center dark:bg-black-100 bg-white mask-[radial-gradient(ellipse_at_center,transparent_20%,black)]" />
      </div>

      <div className="flex justify-center relative sm:my-20 z-10">
        <div className="flex justify-center flex-col items-center max-w-[80vw] lg:max-w-[60vw]">
          <TextGenerateEffect
            className="text-center text-5xl"
            words={t("title")}
            filter={false}
          />
          <Link href="#projects">
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
