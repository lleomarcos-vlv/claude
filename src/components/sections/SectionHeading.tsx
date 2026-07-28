import type { ReactNode } from "react";
import { Reveal } from "@/components/ui/Reveal";

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  tone = "light",
  action,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  align?: "left" | "center";
  tone?: "light" | "dark";
  action?: ReactNode;
}) {
  const centered = align === "center";
  const dark = tone === "dark";

  return (
    <Reveal
      className={`flex flex-col gap-5 ${
        centered ? "mx-auto max-w-2xl text-center" : action ? "md:flex-row md:items-end md:justify-between md:gap-10" : "max-w-3xl"
      }`}
    >
      <div className={centered ? "" : "max-w-2xl"}>
        {eyebrow ? <p className={`eyebrow ${dark ? "text-verde-300" : ""}`}>{eyebrow}</p> : null}
        <h2 className={`mt-3 text-display font-semibold ${dark ? "text-white" : "text-verde-800"}`}>{title}</h2>
        {description ? (
          <p className={`mt-4 text-lg leading-relaxed ${dark ? "text-verde-200" : "text-cinza-700"}`}>{description}</p>
        ) : null}
      </div>
      {action ? <div className={centered ? "flex justify-center" : "shrink-0"}>{action}</div> : null}
    </Reveal>
  );
}
