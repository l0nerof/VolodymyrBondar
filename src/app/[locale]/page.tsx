import Approach from "@/components/Approach/Approach";
import Contact from "@/components/Contact/Contact";
import Hero from "@/components/Hero/Hero";
import Projects from "@/components/Projects/Projects";
import WorkExperience from "@/components/WorkExperience/WorkExperience";

export default function Home() {
  return (
    <>
      <Hero />
      <Projects />
      <WorkExperience />
      <Approach />
      <Contact />
    </>
  );
}
