import { setRequestLocale } from "next-intl/server";

import { About } from "@/components/sections/About";
import { Hero } from "@/components/sections/Hero";
import { Projects } from "@/components/sections/Projects";
import { Swarm } from "@/components/swarm/Swarm";

export default async function Home({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Each section's data-swarm-field tells the dust behind it what to do:
  // drift like stars, orbit the globe, rise through the timeline, take the
  // Approach colours, or stay calm.
  return (
    <>
      <Swarm />
      <div data-swarm-field="stars">
        <Hero />
      </div>
      <div data-swarm-field="orbit">
        <About />
      </div>
      <div data-swarm-field="stars">
        <Projects />
      </div>
    </>
  );
}
