import { createTranslator } from "next-intl";
import { describe, expect, it } from "vitest";

import en from "../../messages/en.json";
import ua from "../../messages/ua.json";

type Tree = { [key: string]: string | Tree };

const LOCALES = { ua: ua as Tree, en: en as Tree };

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

/** ICU argument names: `{name}`, `{count, plural, …}`. A `#` inside a plural
 * branch is not an argument. */
function argumentsOf(message: string): string[] {
  return [...new Set(Array.from(message.matchAll(/\{\s*(\w+)\s*[,}]/g), (match) => match[1]))].sort();
}

describe("messages", () => {
  const keys = keysOf(LOCALES.ua);

  it("has the same keys in every locale", () => {
    expect(keysOf(LOCALES.en)).toEqual(keys);
  });

  it("uses the same arguments in every locale", () => {
    for (const key of keys) {
      expect(argumentsOf(messageAt(LOCALES.en, key)), key).toEqual(argumentsOf(messageAt(LOCALES.ua, key)));
    }
  });

  it("formats every message with next-intl", () => {
    for (const [locale, tree] of Object.entries(LOCALES)) {
      const errors: string[] = [];
      const t = createTranslator({
        locale: locale === "ua" ? "uk" : locale,
        messages: tree,
        onError: (error) => errors.push(error.message),
      });
      for (const key of keysOf(tree)) {
        const values = Object.fromEntries(argumentsOf(messageAt(tree, key)).map((name) => [name, 2]));
        t(key as never, values as never);
      }
      expect(errors, locale).toEqual([]);
    }
  });
});
