import { CanvasRevealEffect } from "../ui/CardRevealEffect";
import ApproachCard from "./ApproachCard";
import MagicButton from "../ui/MagicButton";
import { getTranslations } from "next-intl/server";

async function ApproachList() {
  const t = await getTranslations("Approach");

  return (
    <ul className="flex flex-col lg:flex-row items-center justify-center bg-white dark:bg-black-100 w-full gap-4 mx-auto">
      <ApproachCard
        title={t("card1.title")}
        desc={t("card1.desc")}
        icon={<MagicButton>{t("card1.btn")}</MagicButton>}
      >
        <CanvasRevealEffect
          animationSpeed={5.1}
          containerClassName="bg-emerald-900 rounded-3xl overflow-hidden"
        />
      </ApproachCard>

      <ApproachCard
        title={t("card2.title")}
        desc={t("card2.desc")}
        icon={<MagicButton>{t("card2.btn")}</MagicButton>}
      >
        <CanvasRevealEffect
          animationSpeed={3}
          containerClassName="bg-black rounded-3xl overflow-hidden"
          colors={[
            [236, 72, 153],
            [232, 121, 249],
          ]}
          dotSize={2}
        />
      </ApproachCard>

      <ApproachCard
        title={t("card3.title")}
        desc={t("card3.desc")}
        icon={<MagicButton>{t("card3.btn")}</MagicButton>}
      >
        <CanvasRevealEffect
          animationSpeed={3}
          containerClassName="bg-sky-600 rounded-3xl overflow-hidden"
          colors={[[125, 211, 252]]}
        />
      </ApproachCard>
    </ul>
  );
}
export default ApproachList;
