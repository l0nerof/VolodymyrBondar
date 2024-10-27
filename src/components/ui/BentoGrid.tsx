import { cn } from "@/lib/utils";
import Marquee from "react-fast-marquee";
import { IoCopyOutline } from "react-icons/io5";
import MagicButton from "./MagicButton";
import Image from "next/image";

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
        "grid md:auto-rows-[18rem] grid-cols-1 md:grid-cols-6 lg:grid-cols-5 md:grid-row-7 gap-4 lg:gap-8 max-w-7xl mx-auto ",
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
  const leftLists = [
    "React.js",
    "JavaScript",
    "TypeScript",
    "Next.js",
    "TypeScript",
    "HTML & CSS",
    "SASS",
    "Supabase",
  ];
  const rightLists = [
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
            fill={true}
            className="object-cover object-center"
          />
        )}

        <div
          className={cn(
            titleClassName,
            "group-hover/bento:translate-x-2 transition duration-200 relative md:h-full min-h-40 flex flex-col px-5 p-5 lg:p-10"
          )}
        >
          <p className="font-sans font-extralight md:max-w-32 md:text-xs lg:text-base text-sm dark:text-white text-black-100 z-10">
            {description}
          </p>

          <h2
            className={`font-sans text-lg lg:text-3xl dark:text-white text-black-100 max-w-96 font-bold z-10`}
          >
            {title}
          </h2>

          {/* {id === 2 && <GridGlobe />} */}

          {id === 3 && (
            <div className="flex gap-1 lg:gap-5 w-fit absolute -right-3 lg:-right-2">
              {/* tech stack lists */}

              {/* <Marquee autoFill direction="down"> */}
              <div className="flex flex-col gap-3 md:gap-3 lg:gap-8">
                {leftLists.map((item, i) => (
                  <span
                    key={i}
                    className="lg:py-4 lg:px-3 py-2 px-3 text-xs lg:text-base opacity-50 lg:opacity-100 rounded-lg text-center dark:bg-black-200 bg-white-100"
                  >
                    {item}
                  </span>
                ))}
                {/* </Marquee> */}
              </div>
              {/* <span className="lg:py-4 lg:px-3 py-4 px-3  rounded-lg text-center bg-[#10132E]"></span> */}

              <div className="flex flex-col gap-3 md:gap-3 lg:gap-8">
                {/* <span className="lg:py-4 lg:px-3 py-4 px-3  rounded-lg text-center bg-[#10132E]"></span> */}
                {/* <Marquee autoFill direction="up"> */}
                {rightLists.map((item, i) => (
                  <span
                    key={i}
                    className="lg:py-4 lg:px-3 py-2 px-3 text-xs lg:text-base opacity-50 lg:opacity-100 rounded-lg text-center dark:bg-black-200 bg-white-100"
                  >
                    {item}
                  </span>
                ))}
                {/* </Marquee> */}
              </div>
            </div>
          )}
          {id === 6 && (
            <div className="mt-5">
              <MagicButton icon={<IoCopyOutline />} position="left">
                Text
              </MagicButton>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
