import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { ImageResponse } from "next/og";

import { SITE_URL } from "@/data/site";
import { routing } from "@/i18n/routing";

// The name is printed in Latin capitals in both languages.
export const alt = "Volodymyr Bondar";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// The night edition's colours (globals.css).
const PAPER = "#0f0f12";
const INK = "#f7f1e3";
const YELLOW = "#ffd60a";
const RED = "#ff3b30";

/** Route handlers do not inherit the layout's static params: listing the
 * locales here renders both covers at build time. */
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

async function download(url: string) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`OG image: ${url} answered ${response.status}`);
  return response;
}

/** A Google font cut down to `text`, as TrueType: ImageResponse reads
 * TTF/OTF/WOFF, not the WOFF2 that next/font serves. Fetched at build time. */
async function googleFont(family: string, text: string) {
  const css = await download(
    `https://fonts.googleapis.com/css2?family=${family}&text=${encodeURIComponent(text)}`
  ).then((response) => response.text());
  const url = css.match(/src: url\((.+?)\) format\('(opentype|truetype)'\)/)?.[1];
  if (!url) throw new Error(`OG image: no TrueType source for ${family}`);
  return download(url).then((response) => response.arrayBuffer());
}

/** The cover of issue #1 for link previews: the caption, the name in cover
 * lettering and the role in its box, as on the page. */
export default async function Image({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  const t = await getTranslations({ locale, namespace: "Hero" });
  const issue = t("issue").toUpperCase();
  const role = t("role").toUpperCase();
  const site = new URL(SITE_URL).host;
  const name = ["VOLODYMYR", "BONDAR"];

  const [display, lettering] = await Promise.all([
    googleFont("Rubik:ital,wght@1,900", name.join("") + role),
    googleFont("Shantell+Sans:wght@700", issue + site),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "56px 64px 64px",
          background: PAPER,
          color: INK,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div
            style={{
              display: "flex",
              transform: "rotate(-1deg)",
              border: `3px solid ${PAPER}`,
              background: YELLOW,
              color: PAPER,
              padding: "8px 16px",
              fontFamily: "Lettering",
              fontSize: 26,
              letterSpacing: 1.5,
            }}
          >
            {issue}
          </div>
          <div style={{ display: "flex", fontFamily: "Lettering", fontSize: 26 }}>{site}</div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            fontFamily: "Display",
            fontSize: 150,
            lineHeight: 0.9,
            letterSpacing: -3,
          }}
        >
          {name.map((word) => (
            <span key={word} style={{ display: "flex", textShadow: `9px 9px 0 ${RED}` }}>
              {word}
            </span>
          ))}
        </div>

        <div
          style={{
            display: "flex",
            alignSelf: "flex-start",
            transform: "rotate(-1deg)",
            border: `4px solid ${PAPER}`,
            background: YELLOW,
            color: PAPER,
            padding: "10px 22px",
            fontFamily: "Display",
            fontSize: 40,
            boxShadow: `8px 8px 0 ${RED}`,
          }}
        >
          {role}
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Display", data: display, style: "italic", weight: 900 },
        { name: "Lettering", data: lettering, style: "normal", weight: 700 },
      ],
    }
  );
}
