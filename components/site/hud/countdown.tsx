"use client";
import { useEffect, useState } from "react";
import { splitTime } from "@/lib/format";
import { cn } from "@/lib/utils";

const pad = (n: number) => String(n).padStart(2, "0");

export function Countdown({ target }: { target: string }) {
  const [t, setT] = useState<ReturnType<typeof splitTime> | null>(null);
  useEffect(() => {
    const end = new Date(target).getTime();
    const tick = () => setT(splitTime(end - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target]);

  const cells: [string, string][] = [
    ["Days", t ? String(t.days) : "--"],
    ["Hrs", t ? pad(t.hours) : "--"],
    ["Min", t ? pad(t.minutes) : "--"],
    ["Sec", t ? pad(t.seconds) : "--"],
  ];
  return (
    <div className="grid grid-cols-4 overflow-hidden rounded-lg border" role="timer" aria-label="Time until the conference">
      {cells.map(([label, value], i) => (
        <div key={label} className={cn("grid justify-items-center gap-0.5 px-1 py-3", i > 0 && "border-l")}>
          <span className="flicker-once font-mono text-[clamp(1.4rem,3.2vw,2rem)] tabular-nums">{value}</span>
          <span className="mono-label">{label}</span>
        </div>
      ))}
    </div>
  );
}
