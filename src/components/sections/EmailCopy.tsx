"use client";

import { Check, Copy } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

const SHOW_COPIED_MS = 1800;

/** The address and its "copy" button share one state: clicking either copies
 * the address and the button says so. The address stays a mailto link, so a
 * mail app still opens. */
export function EmailCopy({
  email,
  labels,
  emailClassName,
  buttonClassName,
}: {
  email: string;
  labels: { copy: string; copied: string };
  emailClassName?: string;
  buttonClassName?: string;
}) {
  const [copied, setCopied] = useState(false);
  const timer = useRef(0);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(email);
    } catch (error) {
      // Clipboard access can be refused; the mailto link still works.
      console.warn("Could not copy the email address", error);
      return;
    }
    setCopied(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), SHOW_COPIED_MS);
  }

  // Where a long address has to wrap, it wraps after the "@", never inside a
  // word ("…@gmai / l.com").
  const at = email.indexOf("@");

  return (
    <>
      <a href={`mailto:${email}`} onClick={copy} className={emailClassName}>
        {email.slice(0, at + 1)}
        <wbr />
        {email.slice(at + 1)}
      </a>
      <button
        type="button"
        onClick={copy}
        aria-label={`${labels.copy}: ${email}`}
        className={cn("group/copy inline-flex cursor-pointer items-center gap-2", buttonClassName)}
      >
        {copied ? (
          <Check aria-hidden strokeWidth={3} className="size-4 shrink-0" />
        ) : (
          <Copy
            aria-hidden
            strokeWidth={2.5}
            className="size-4 shrink-0 transition-[translate] duration-200 ease-out group-hover/copy:-translate-y-0.5"
          />
        )}
        <span aria-live="polite">{copied ? labels.copied : labels.copy}</span>
      </button>
    </>
  );
}
