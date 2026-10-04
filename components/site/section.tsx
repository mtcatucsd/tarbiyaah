import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Section({ id, className, children }: { id?: string; className?: string; children: ReactNode }) {
  return (
    <section id={id} className={cn("mx-auto w-[var(--frame)] px-4 py-6 sm:px-8 sm:py-10 md:py-14", className)}>
      {children}
    </section>
  );
}
