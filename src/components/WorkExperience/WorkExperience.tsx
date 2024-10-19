import { useTranslations } from "next-intl";
import WorkExperienceList from "./WorkExperienceList";

function WorkExperience() {
  const t = useTranslations("WorkExperience");

  return (
    <section id="work-experience" className="mb-32">
      <h2 className="text-5xl font-bold text-center">
        {t("title")}
        <span className="dark:text-purple-100 text-purple-200">
          {t("highlight")}
        </span>
      </h2>

      <WorkExperienceList />
    </section>
  );
}
export default WorkExperience;
