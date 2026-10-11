import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { TECH_WORDS } from "@/components/swarm/eggs";

import { STACK_GROUPS, TECH_ICONS } from "./stack";

const items = STACK_GROUPS.flatMap((group) => group.items);

describe("stack", () => {
  it("gives every technology a logo", () => {
    for (const tech of items) expect(TECH_ICONS[tech], tech).toBeDefined();
  });

  it("points every logo at a file in public/", () => {
    for (const [tech, url] of Object.entries(TECH_ICONS)) {
      expect(existsSync(path.join(process.cwd(), "public", url)), tech).toBe(true);
    }
  });

  it("only maps typed words to logos it has", () => {
    // A word left pointing at a dropped logo would ask the swarm for an image
    // that does not exist.
    for (const [word, tech] of Object.entries(TECH_WORDS)) expect(TECH_ICONS[tech], word).toBeDefined();
  });

  it("lists each technology once", () => {
    expect(new Set(items).size).toBe(items.length);
  });
});
