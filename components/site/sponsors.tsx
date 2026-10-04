import { sponsors } from "@/data/sponsors";

// Sponsors as a single line of thanks, then quiet logo slots (placeholders until logos arrive).
export function Sponsors() {
  return (
    <section id="sponsors" className="qe-section grid justify-items-center gap-12">
      <p data-focus="" className="qe-lead-sm">With thanks to the sponsors who make the day possible. They will be announced soon.</p>
      <ul className="grid w-full max-w-[880px] grid-cols-2 gap-5 md:grid-cols-4">
        {sponsors.map((s) => (
          <li key={s.id} className="grid aspect-[3/2] place-items-center rounded-[3px] border border-dashed border-ink/35 bg-[#fbf8f0]">
            <span className="mono-label">{s.name}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
