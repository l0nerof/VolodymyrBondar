import About from "@/components/About/About";
import Approach from "@/components/Approach/Approach";
import Contact from "@/components/Contact/Contact";
import Hero from "@/components/Hero/Hero";
import Projects from "@/components/Projects/Projects";
import WorkExperience from "@/components/WorkExperience/WorkExperience";

export default async function Home() {
  return (
    <>
      <Hero />
      <About />
      <Projects />
      <WorkExperience />
      <Approach />
      <Contact />
    </>
  );
}
