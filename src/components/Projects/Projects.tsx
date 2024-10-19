import { useTranslations } from "next-intl";
import ProjectsList from "./ProjectsList";

function Projects() {
  const t = useTranslations("Projects");

  return (
    <section id="projects" className="mb-32">
      <h2 className="text-center text-5xl font-bold dark:text-white text-black-100">
        {t("title")}
        <span className="dark:text-purple-100 text-purple-200">
          {t("highlight")}
        </span>
      </h2>
      <ProjectsList />
    </section>
  );
}
export default Projects;
