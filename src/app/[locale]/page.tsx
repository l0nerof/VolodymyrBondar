import { setRequestLocale } from "next-intl/server";

import { Hero } from "@/components/sections/Hero";

export default async function Home({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <Hero />;
}
