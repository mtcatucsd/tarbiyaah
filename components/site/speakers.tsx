import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { speakers } from "@/data/speakers";
import { cn } from "@/lib/utils";

// Speakers as a row of tilted portrait prints; each opens a short biography.
const tilts = ["-rotate-2", "rotate-1", "-rotate-1", "rotate-2"];

export function Speakers() {
  return (
    <section id="speakers" className="qe-section grid justify-items-center gap-8">
      <div className="grid justify-items-center gap-3">
        <p className="mono-label">Speakers</p>
        <h2 data-anim="lines" className="qe-lead">Voices of the conference</h2>
      </div>
      <ul data-scene="speakers" className="grid w-full max-w-[1100px] grid-cols-2 gap-x-6 gap-y-12 md:grid-cols-4">
        {speakers.map((s, i) => (
          <li key={s.id}>
            <Dialog>
              <DialogTrigger asChild>
                <button type="button" className="group grid w-full justify-items-center gap-4 text-center">
                  <span className={cn("qe-print block w-full transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:rotate-0 group-hover:-translate-y-1", tilts[i % 4])}>
                    <span className="plate portrait !rounded-[2px] !border-0" aria-hidden="true" />
                  </span>
                  <span className="font-display text-2xl leading-none text-ink-deep">{s.name}</span>
                  <span className="mono-label">{s.role}</span>
                </button>
              </DialogTrigger>
              <DialogContent className="bg-background">
                <DialogHeader>
                  <DialogTitle className="font-display text-3xl font-normal text-ink-deep">{s.name}</DialogTitle>
                  <DialogDescription>{s.role}</DialogDescription>
                </DialogHeader>
                <p className="leading-7 text-ink-deep/85">{s.bio}</p>
              </DialogContent>
            </Dialog>
          </li>
        ))}
      </ul>
    </section>
  );
}
