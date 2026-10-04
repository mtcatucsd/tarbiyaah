"use client";
import { Menu } from "lucide-react";
import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ticketHref } from "@/lib/format";
import { siteConfig } from "@/lib/site-config";
import { cn } from "@/lib/utils";

// Quiet Edition-style bar: script wordmark left; date, a tickets pill and the menu right.
// It sits on a paper strip so it stays legible over the hero's patterned arch.
const links = [
  { href: "#about", label: "About" },
  { href: "#schedule", label: "Schedule" },
  { href: "#speakers", label: "Speakers" },
  { href: "#find-us", label: "Find the MPR" },
  { href: "#gallery", label: "Gallery" },
  { href: "#faq", label: "FAQ" },
  { href: "#tickets", label: "Tickets" },
];

export function Nav() {
  const [open, setOpen] = useState(false);
  // Over the dark hero the bar is transparent with light text; once the hero has scrolled away it turns cream.
  const [solid, setSolid] = useState(false);
  const [lifted, setLifted] = useState(false); // scrolled a little: give the bar a teal backing so content never collides with it
  useEffect(() => {
    const check = () => {
      setLifted(window.scrollY > 24);
      setSolid(window.scrollY > Math.max(120, (document.getElementById("top")?.offsetHeight ?? 600) - 90));
    };
    check();
    window.addEventListener("scroll", check, { passive: true });
    return () => window.removeEventListener("scroll", check);
  }, []);
  const tickets = ticketHref(siteConfig.ticketUrl);
  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 border-b transition-colors duration-300",
        solid ? "border-ink/15 bg-background/95 text-ink-deep" : cn("text-[#f4efe3]", lifted ? "border-[#f4efe3]/15 bg-[#0f3b3f]/90" : "border-transparent bg-transparent"),
      )}
    >
      <div className="flex h-14 items-center justify-between gap-4 px-4 md:px-6">
        <a href="#top" className="msa-logo-link" aria-label="MSA at UC San Diego: Tarbiyyah Conference, back to top">
          <span className="msa-logo" aria-hidden="true" />
        </a>
        <div className="flex items-center gap-3 md:gap-5">
          <span className="hidden font-display text-[1.35rem] leading-none md:inline">Nov 1, 2026 · UC San Diego</span>
          <a href={tickets} className={cn("qe-pill !py-1.5 !text-sm", !solid && "!border-[#f4efe3]/50 !bg-[#f4efe3]/10 !text-[#f4efe3] hover:!bg-[#f4efe3] hover:!text-[#0f3b3f]")} {...(tickets.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
            Get tickets
          </a>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button type="button" className="grid size-9 place-items-center rounded-full hover:bg-ink/10" aria-label="Open menu">
                <Menu className="size-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[min(340px,86vw)] bg-background">
              <SheetHeader>
                <SheetTitle className="font-script text-4xl font-normal text-ink-deep">Tarbiyyah</SheetTitle>
              </SheetHeader>
              <ul className="grid gap-1 px-4">
                {links.map((l) => (
                  <li key={l.href}>
                    <a href={l.href} onClick={() => setOpen(false)} className="block border-b border-ink/15 py-3 font-display text-2xl text-ink-deep">
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
