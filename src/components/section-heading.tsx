import Link from "next/link";
import type { ReactNode } from "react";

export function SectionHeading({
  kicker,
  title,
  description,
  action,
  center = false,
  tone = "dark",
}: {
  kicker?: string;
  title: ReactNode;
  description?: string;
  action?: { href: string; label: string };
  center?: boolean;
  tone?: "dark" | "light";
}) {
  return (
    <div
      className={`mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between ${
        center ? "sm:flex-col sm:items-center sm:text-center" : ""
      }`}
    >
      <div className={center ? "flex flex-col items-center text-center" : ""}>
        {kicker ? <p className="kicker">{kicker}</p> : null}
        <h2
          className={`mt-2 max-w-2xl text-balance font-display text-3xl leading-tight sm:text-4xl ${
            tone === "light" ? "text-cream" : ""
          }`}
        >
          {title}
        </h2>
        <div className="rule-gold mt-4" />
        {description ? (
          <p
            className={`mt-4 max-w-xl text-sm leading-relaxed sm:text-base ${
              tone === "light" ? "text-cream/75" : "text-muted"
            }`}
          >
            {description}
          </p>
        ) : null}
      </div>

      {action ? (
        <Link
          href={action.href}
          className={`shrink-0 text-sm font-semibold underline-offset-4 transition hover:underline ${
            tone === "light" ? "text-gold-soft" : "text-crust"
          }`}
        >
          {action.label} →
        </Link>
      ) : null}
    </div>
  );
}
