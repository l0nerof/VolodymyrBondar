import { useTranslations } from "next-intl";
import ProjectsList from "./ProjectsList";

function Projects() {
  const t = useTranslations("Projects");

  return (
    <section id="projects" className="mb-32">
      <h1 className="text-center text-5xl font-bold dark:text-white text-black-100">
        {t("title")}
      </h1>
      <ProjectsList />
    </section>
  );
}
export default Projects;
