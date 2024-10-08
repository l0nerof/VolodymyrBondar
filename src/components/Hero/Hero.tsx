import Link from "next/link";
import MagicButton from "../ui/MagicButton";
import Spotlight from "../ui/Spotlight";
import { TextGenerateEffect } from "../ui/TextGenerate";

function Hero() {
  return (
    <section className="pb-36 pt-52">
      <Spotlight className="-top-40 left-0 md:left-60 md:-top-20" />

      <div className="h-screen w-full dark:bg-black-100 bg-white  dark:bg-grid-white/[0.03] bg-grid-black/[0.03] absolute top-0 left-0 flex items-center justify-center">
        <div className="absolute pointer-events-none inset-0 flex items-center justify-center dark:bg-black-100 bg-white [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]"></div>
      </div>

      <div className="flex justify-center relative my-20 z-10">
        <div className="flex justify-center flex-col items-center max-w-[60vw]">
          <TextGenerateEffect
            className="text-center text-5xl"
            words="Hello there! I`m Vova, a Front-End Developer based in Ukraine."
            filter={false}
          />
          <Link href="#">
            <MagicButton>See my works</MagicButton>
          </Link>
        </div>
      </div>
    </section>
  );
}
export default Hero;
