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
// Its "informal" axis is dialled in globals.css. The "bounce" axis is not
// loaded: the page keeps it at its default, level lines.
const shantell = Shantell_Sans({
  subsets: ["latin", "cyrillic"],
  axes: ["INFM"],
  variable: "--nf-shantell",
  display: "swap",
});

// Kablammo: the sound effects and the "V.B." mark, in its default form. The
// "morph" axis is not loaded: nothing sets it.
const kablammo = Kablammo({
  subsets: ["latin", "cyrillic"],
  variable: "--nf-kablammo",
  display: "swap",
});

/** Classes for <html> that define the three font variables. */
export const fontVariables = `${rubik.variable} ${shantell.variable} ${kablammo.variable}`;
