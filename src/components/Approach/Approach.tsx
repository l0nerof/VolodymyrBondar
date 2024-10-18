import { useTranslations } from "next-intl";
import ApproachList from "./ApproachList";

function Approach() {
  const t = useTranslations("Approach");

  return (
    <section id="approach" className="mb-32">
      <h1 className="text-center text-5xl font-bold dark:text-white text-black-100">
        {t("title")}
      </h1>
      <ApproachList />
    </section>
  );
}
export default Approach;
