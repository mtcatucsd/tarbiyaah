import type { Metadata } from "next";
import { Geist, Geist_Mono, Instrument_Serif, Pinyon_Script } from "next/font/google";
import { EngravingDefs } from "@/components/engraving/defs";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });
const pinyon = Pinyon_Script({ subsets: ["latin"], weight: "400", variable: "--font-pinyon" });
const serif = Instrument_Serif({ subsets: ["latin"], weight: "400", style: ["normal", "italic"], variable: "--font-instrument" });

export const metadata: Metadata = {
  title: "Tarbiyyah Conference 2026 — MSA at UC San Diego",
  description: "A gathering of knowledge and community, presented by MSA at UC San Diego.",
  icons: { icon: "/msalogo.jpg" },
};

// Without JS nothing may stay hidden: show revealed content, drawn strokes and all tab panels.
const noscriptCss =
  "[data-reveal]{opacity:1!important;transform:none!important}" +
  ".draw,.draw-abs{stroke-dashoffset:0!important}.hatch-in{opacity:1!important}[data-focus]{filter:none!important;opacity:1!important}" +
  ".spine-fill{transform:translateX(-50%)!important}" +
  ".spine-node{background:var(--ink)!important}.spine-connector{border-color:var(--ink)!important}" +
  ".intro{opacity:1!important;transform:none!important}.night-reel-wrap{opacity:1!important}.glyph{stroke-dashoffset:0!important;fill-opacity:1!important}" +
  "[role=tabpanel][hidden]{display:block!important}";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} ${geistMono.variable} ${pinyon.variable} ${serif.variable}`}>
      <head>
        <noscript><style>{noscriptCss}</style></noscript>
      </head>
      <body>
        <EngravingDefs />
        {children}
      </body>
    </html>
  );
}
