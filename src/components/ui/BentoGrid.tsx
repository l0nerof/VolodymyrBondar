import { cn } from "@/lib/utils";
import Marquee from "react-fast-marquee";

import Link from "next/link";
import MagicButton from "./MagicButton";
import Image from "next/image";
import GridGlobe from "./GridGlobe";
import { useTranslations } from "next-intl";
import { FaLocationArrow } from "react-icons/fa";

export const BentoGrid = ({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) => {
  return (
    <div
      className={cn(
        "grid grid-cols-1 md:grid-cols-6 lg:grid-cols-5 md:grid-row-7 gap-4 lg:gap-8 max-w-7xl mx-auto ",
        className
      )}
    >
      {children}
    </div>
  );
};

export const BentoGridItem = ({
  className,
  title,
  description,
  id,
  img,
  imgClassName,
  titleClassName,
}: {
  className?: string;
  title?: string | React.ReactNode;
  description?: string | React.ReactNode;
  id: number;
  img?: string;
  imgClassName?: string;
  titleClassName?: string;
}) => {
  const t = useTranslations("About");

  const topList = [
    "React.js",
    "JavaScript",
    "TypeScript",
    "Next.js",
    "HTML & CSS",
    "SASS",
    "Supabase",
  ];
  const bottomList = [
    "React Query",
    "BEM",
    "Webpack",
    "Tailwind",
    "Redux",
    "Git",
    "Vite",
    "Parcel",
  ];

  return (
    <div
      className={cn(
        "row-span-1 relative overflow-hidden rounded-3xl border dark:hover:shadow-purple-100/[0.2] hover:shadow-purple-200/[0.2] dark:border-white/[0.2] border-black/[0.1] group/bento dark:hover:shadow-2xl hover:shadow-2xl transition duration-200 justify-between flex flex-col space-y-4",
        className
      )}
    >
      <div className={`${id === 6 && "flex justify-center"} h-full`}>
        {img && (
          <Image
            src={img}
            alt={img}
            width={1000}
            height={1000}
            className={cn(imgClassName, "object-cover object-center ")}
          />
        )}

        <div
          className={cn(
            titleClassName,
            "group-hover/bento:translate-x-2 transition duration-200 md:h-full min-h-40 flex flex-col px-5 p-5 lg:p-10"
          )}
        >
          <p className="font-sans font-extralight md:text-xs lg:text-base text-sm dark:text-white text-black-100">
            {description}
          </p>

          <h2
            className={`font-sans text-lg lg:text-3xl max-w-96 font-bold z-10`}
          >
            {title}
          </h2>

          {id === 2 && <GridGlobe />}

          {id === 3 && (
            <div className="flex flex-col gap-1 lg:gap-5 absolute inset-0 justify-between">
              <Marquee autoFill direction="left" speed={15}>
                {topList.map((item, i) => (
                  <span
                    key={i}
                    className="lg:py-3 lg:px-3 py-2 px-3 text-xs lg:text-base opacity-100 rounded-lg text-center dark:bg-black-200 bg-white-100 ml-6 inline-block"
                  >
                    {item}
                  </span>
                ))}
              </Marquee>

              <Marquee autoFill direction="right" speed={15}>
                {bottomList.map((item, i) => (
                  <span
                    key={i}
                    className="lg:py-3 lg:px-3 py-2 px-3 text-xs lg:text-base opacity-100 rounded-lg text-center dark:bg-black-200 bg-white-100 ml-6 inline-block"
                  >
                    {item}
                  </span>
                ))}
              </Marquee>
            </div>
          )}

          {id === 6 && (
            <div className="mt-5">
              <Link href="#contact">
                <MagicButton icon={<FaLocationArrow />} position="right">
                  {t("btn")}
                </MagicButton>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
