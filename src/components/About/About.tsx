import { useTranslations } from "next-intl";
import { BentoGrid, BentoGridItem } from "../ui/BentoGrid";
import { about } from "@/data";

function About() {
  const t = useTranslations("About");

  return (
    <section id="about" className="my-32">
      <BentoGrid>
        {about.map(
          ({
            id,
            title,
            desc,
            className,
            img,
            imgClassName,
            titleClassName,
          }) => (
            <BentoGridItem
              id={id}
              key={id}
              title={t(title)}
              description={t(desc)}
              className={className}
              img={img}
              imgClassName={imgClassName}
              titleClassName={titleClassName}
            />
          )
        )}
      </BentoGrid>
    </section>
  );
}
export default About;
