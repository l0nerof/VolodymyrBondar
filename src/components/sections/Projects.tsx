import { getTranslations } from "next-intl/server";

import { SectionHead } from "@/components/comic/SectionHead";
import { PROJECTS } from "@/data/projects";

import { Gallery } from "./Gallery";

/** Chapter 3: the projects. Translated here on the server; the gallery gets
 * plain data. */
export async function Projects() {
  const t = await getTranslations("Projects");
  const comic = await getTranslations("Comic");

  const items = PROJECTS.map((project) => ({
    ...project,
    title: t(`items.${project.key}.title`),
    desc: t(`items.${project.key}.desc`),
    role: t(`items.${project.key}.role`),
    result: t(`items.${project.key}.result`),
  }));

  return (
    <section id="projects" className="mb-28">
      <SectionHead
        chapter={comic("chapter", { number: 3, title: t("chapter") })}
        title={t("title")}
        highlight={t("highlight")}
      />
      <Gallery
        items={items}
        labels={{
          filters: t("filters.label"),
          all: t("filters.all"),
          commercial: t("filters.commercial"),
          personal: t("filters.personal"),
          figure: t("figure"),
          role: t("role"),
          result: t("result"),
          live: t("live"),
          private: t("private"),
          sfx: t("sfx"),
        }}
      />
    </section>
  );
}
