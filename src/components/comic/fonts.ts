import { Kablammo, Rubik, Shantell_Sans } from "next/font/google";

// Rubik Black Italic in capitals is the cover lettering: titles and the name.
// The upright face is loaded too: the swarm letters technology names in it.
const rubik = Rubik({
  subsets: ["latin", "cyrillic"],
  style: ["normal", "italic"],
  variable: "--nf-rubik",
  display: "swap",
});

// Shantell Sans, a letterer's marker hand, sets the text and the captions.
// Its "informal" and "bounce" axes are dialled in globals.css.
const shantell = Shantell_Sans({
  subsets: ["latin", "cyrillic"],
  axes: ["INFM", "BNCE"],
  variable: "--nf-shantell",
  display: "swap",
});

// Kablammo: the sound effects and the "V.B." mark.
const kablammo = Kablammo({
  subsets: ["latin", "cyrillic"],
  axes: ["MORF"],
  variable: "--nf-kablammo",
  display: "swap",
});

/** Classes for <html> that define the three font variables. */
export const fontVariables = `${rubik.variable} ${shantell.variable} ${kablammo.variable}`;
