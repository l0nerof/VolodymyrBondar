import ProjectsList from "./ProjectsList";
import { getTranslations } from "next-intl/server";

async function Projects() {
  const t = await getTranslations("Projects");

  return (
    <section id="projects" className="mb-32">
      <h2 className="text-center text-5xl font-bold dark:text-white text-black-100 mb-12">
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
