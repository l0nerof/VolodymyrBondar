import { useTranslations } from "next-intl";
import ApproachList from "./ApproachList";

function Approach() {
  const t = useTranslations("Approach");

  return (
    <section id="approach" className="mb-32">
      <h2 className="text-center text-5xl font-bold dark:text-white text-black-100">
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
