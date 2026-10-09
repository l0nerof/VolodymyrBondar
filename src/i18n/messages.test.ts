import { isStructurallySame, parse } from "@formatjs/icu-messageformat-parser";
import { createTranslator } from "next-intl";
import { describe, expect, it } from "vitest";

import en from "../../messages/en.json";
import uk from "../../messages/uk.json";

type Tree = { [key: string]: string | Tree };

const LOCALES = { uk: uk as Tree, en: en as Tree };

/** Every message key as a dotted path, sorted. */
function keysOf(tree: Tree, prefix = ""): string[] {
  return Object.entries(tree)
    .flatMap(([key, value]) =>
      typeof value === "string" ? [`${prefix}${key}`] : keysOf(value, `${prefix}${key}.`)
    )
    .sort();
}

function messageAt(tree: Tree, path: string): string {
  const value = path.split(".").reduce<string | Tree>((node, key) => (node as Tree)[key], tree);
  if (typeof value !== "string") throw new Error(`${path} is not a message`);
  return value;
}

/** Placeholder values for a message: 2 for every argument, and for rich text
 * tags (<tag></tag>) a function, as t.rich needs. */
function valuesFor(message: string) {
  const values: Record<string, unknown> = {};
  const visit = (elements: ReturnType<typeof parse>) => {
    for (const element of elements) {
      if ("children" in element) {
        values[element.value] = () => element.value;
        visit(element.children);
      } else if ("options" in element) {
        values[element.value] = 2;
        Object.values(element.options).forEach((option) => visit(option.value));
      } else if (element.type !== 0 && element.type !== 7) {
        values[element.value] = 2;
      }
    }
  };
  visit(parse(message));
  return values;
}

describe("messages", () => {
  const keys = keysOf(LOCALES.uk);

  it("has the same keys in every locale", () => {
    expect(keysOf(LOCALES.en)).toEqual(keys);
  });

  it("uses the same arguments and tags in every locale", () => {
    for (const key of keys) {
      const [ukrainian, english] = [parse(messageAt(LOCALES.uk, key)), parse(messageAt(LOCALES.en, key))];
      // The check is one-way (every argument of the first is in the second),
      // so run it both ways. Plural branches may differ: Ukrainian has "few".
      for (const [a, b] of [[ukrainian, english], [english, ukrainian]]) {
        const same = isStructurallySame(a, b);
        expect(same.success, `${key}: ${same.error?.message}`).toBe(true);
      }
    }
  });

  it("formats every message with next-intl", () => {
    for (const [locale, tree] of Object.entries(LOCALES)) {
      const errors: string[] = [];
      const t = createTranslator({
        locale,
        messages: tree,
        onError: (error) => errors.push(error.message),
      });
      for (const key of keysOf(tree)) {
        const message = messageAt(tree, key);
        // Rich text goes through t.rich, as in the components.
        if (/<\w+>/.test(message)) t.rich(key as never, valuesFor(message) as never);
        else t(key as never, valuesFor(message) as never);
      }
      expect(errors, locale).toEqual([]);
    }
  });
});
