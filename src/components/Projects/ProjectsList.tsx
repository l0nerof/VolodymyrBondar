import { projects } from "@/data";
import { CardBody, CardContainer, CardItem } from "../ui/3d-card";
import Image from "next/image";
import Link from "next/link";
import { FaLocationArrow } from "react-icons/fa";
import { getTranslations } from "next-intl/server";

async function ProjectsList() {
  const t = await getTranslations("Projects");

  return (
    <ul className="flex gap-10 items-stretch justify-center flex-wrap">
      {projects.map(({ id, iconLists, img, link, title, desc }) => (
        <li key={id}>
          <CardContainer>
            <CardBody className="relative group/card dark:hover:shadow-2xl hover:shadow-2xl dark:hover:shadow-purple-100/20 hover:shadow-purple-200/20 dark:border-white/20 border-black/10 w-full sm:w-120 h-full rounded-xl p-6 border flex flex-col gap-4 justify-between">
              <CardItem translateZ="100" className="w-full mt-4">
                <Image
                  src={img}
                  height="1000"
                  width="1000"
                  className="h-60 w-full object-cover rounded-xl group-hover/card:shadow-xl"
                  alt="thumbnail"
                />
              </CardItem>

              <CardItem
                translateZ="50"
                className="text-xl font-bold dark:text-white text-black-100"
              >
                {t(title)}
              </CardItem>

              <CardItem
                as="p"
                translateZ="60"
                className="text-sm dark:text-white text-black-100"
              >
                {t(desc)}
              </CardItem>
              <div className="flex flex-col gap-5">
                <CardItem
                  translateZ={20}
                  className="flex justify-between items-center gap-1"
                >
                  {iconLists.map((icon, index) => (
                    <div
                      key={index}
                      className="border border-white/20 rounded-full dark:bg-purple-100/20 bg-purple-200/20 lg:w-10 lg:h-10 w-8 h-8"
                    >
                      <Image
                        src={icon}
                        alt="Project-icon"
                        width={40}
                        height={40}
                        className="p-2"
                      />
                    </div>
                  ))}
                </CardItem>

                {link && (
                  <CardItem
                    translateZ={20}
                    as={Link}
                    href={link}
                    target="_blank"
                    className="cursor-pointer flex items-center justify-center gap-2 w-full text-sm font-normal p-2 rounded-lg bg-purple-200/20 dark:bg-purple-100/20 dark:text-purple-100 text-purple-200 dark:hover:text-neutral-500 hover:text-neutral-500 hover:bg-purple-200/40 dark:hover:bg-purple-100/40"
                  >
                    {t("link_btn")} <FaLocationArrow />
                  </CardItem>
                )}
              </div>
            </CardBody>
          </CardContainer>
        </li>
      ))}
    </ul>
  );
}
export default ProjectsList;
