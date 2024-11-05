import { workExperience } from "@/data";
import { useTranslations } from "next-intl";
import { Button } from "../ui/MovingBorder";
import Image from "next/image";

function WorkExperienceList() {
  const t = useTranslations("WorkExperience");

  return (
    <ul className="mt-12 grid lg:grid-cols-2 grid-cols-1 gap-10">
      {workExperience.map(({ id, title, thumbnail, desc }) => (
        <Button
          key={id}
          duration={Math.floor(Math.random() * 10000) + 10000}
          borderRadius="1.75rem"
          className="cursor-default"
        >
          <div className="flex flex-col p-3 py-6 md:p-5 lg:p-10 gap-3">
            <Image src={thumbnail} alt={thumbnail} width={100} height={50} />

            <h1 className="text-start text-xl md:text-2xl font-bold dark:text-white text-black-100">
              {t(title)}
            </h1>
            <p className="text-start dark:text-white text-black-100 font-semibold">
              {t(desc)}
            </p>
          </div>
        </Button>
      ))}
    </ul>
  );
}
export default WorkExperienceList;
