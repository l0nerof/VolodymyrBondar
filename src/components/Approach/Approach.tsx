import { getTranslations } from "next-intl/server";
import ApproachList from "./ApproachList";

async function Approach() {
  const t = await getTranslations("Approach");

  return (
    <section id="approach" className="sm:mb-32">
      <h2 className="text-center text-5xl font-bold dark:text-white text-black-100 mb-12">
        {t("title")}
        <span className="dark:text-purple-100 text-purple-200">
          {t("highlight")}
        </span>
      </h2>
      <ApproachList />
    </section>
  );
}
export default Approach;
