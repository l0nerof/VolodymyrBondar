import { projects } from "@/data";
import { CardBody, CardContainer, CardItem } from "../ui/3d-card";
import Image from "next/image";
import Link from "next/link";
import { FaLocationArrow } from "react-icons/fa";
import { getTranslations } from "next-intl/server";

async function ProjectsList() {
  const t = await getTranslations("Projects");

  return (
    <ul className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-3">
      {projects.map(({ id, iconLists, img, link, title, desc }) => (
        <li key={id} className="h-full">
          <CardContainer>
            <CardBody className="relative group/card dark:hover:shadow-2xl hover:shadow-2xl dark:hover:shadow-purple-100/20 hover:shadow-purple-200/20 dark:border-white/20 border-black/10 w-full h-full rounded-xl p-6 border flex flex-col gap-4 justify-between">
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
                  className="flex w-full flex-wrap items-center justify-start gap-2"
                >
                  {iconLists.map((icon, index) => (
                    <div
                      key={index}
                      className="h-8 w-8 shrink-0 rounded-full border border-white/20 bg-purple-200/20 dark:bg-purple-100/20 lg:h-10 lg:w-10"
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
