import { projects } from "@/data";
import { useTranslations } from "next-intl";
import { CardBody, CardContainer, CardItem } from "../ui/3d-card";
import Image from "next/image";
import Link from "next/link";
import { FaLocationArrow } from "react-icons/fa";

function ProjectsList() {
  const t = useTranslations("Projects");

  return (
    <ul className="flex gap-10 items-center justify-center flex-wrap">
      {projects.map(({ id, iconLists, img, link, title, desc }) => (
        <li key={id}>
          <CardContainer className="inter-var">
            <CardBody className="relative group/card dark:hover:shadow-2xl dark:hover:shadow-emerald-500/[0.1] dark:border-white/[0.2] border-black/[0.1] w-full sm:w-[30rem] h-full rounded-xl p-6 border">
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
                className="text-xl font-bold dark:text-white text-black-100 mt-4"
              >
                {t(title)}
              </CardItem>

              <CardItem
                as="p"
                translateZ="60"
                className="text-sm mt-2 dark:text-white text-black-100"
              >
                {t(desc)}
              </CardItem>
              <div className="flex justify-between items-center mt-20">
                <CardItem
                  translateZ={20}
                  as="button"
                  className="px-4 py-2 rounded-xl bg-black dark:bg-white dark:text-black text-white text-xs font-bold"
                >
                  Sign up
                </CardItem>

                <CardItem
                  translateZ={20}
                  as={Link}
                  href={link}
                  target="__blank"
                  className="flex items-center gap-2 text-xs font-normal dark:text-purple-100 text-purple-200 dark:hover:text-neutral-500 hover:text-neutral-500"
                >
                  {t("link_btn")} <FaLocationArrow />
                </CardItem>
              </div>
            </CardBody>
          </CardContainer>
        </li>
      ))}
    </ul>
  );
}
export default ProjectsList;
