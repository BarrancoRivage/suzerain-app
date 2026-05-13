import type { ReactNode } from "react";

import { CornerOrnament } from "./iso/CornerOrnament";

type Props = {
  children: ReactNode;
};

export function IsoFrame({ children }: Props) {
  return (
    <div className="relative">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_15%,rgba(168,138,60,0.10),transparent_55%),radial-gradient(circle_at_70%_85%,rgba(122,31,31,0.05),transparent_60%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.05] [background-image:radial-gradient(circle_at_25%_15%,#1A1410_1px,transparent_1px),radial-gradient(circle_at_75%_85%,#1A1410_1px,transparent_1px)] [background-size:48px_48px,72px_72px]"
      />

      <header className="relative pt-12 pb-6 text-center">
        <h1 className="font-serif italic text-5xl sm:text-6xl text-ink leading-none">
          Le Fief
        </h1>
        <p className="text-[10px] sm:text-xs uppercase tracking-[0.32em] text-ink/45 font-sans mt-3">
          Anno 1247
        </p>
      </header>

      <div className="relative mx-auto max-w-3xl px-8 pb-12">
        <CornerOrnament
          aria-hidden="true"
          className="pointer-events-none absolute top-0 left-0 w-10 h-10 sm:w-12 sm:h-12 text-gold/70 pixelated"
        />
        <CornerOrnament
          aria-hidden="true"
          className="pointer-events-none absolute top-0 right-0 w-10 h-10 sm:w-12 sm:h-12 text-gold/70 pixelated rotate-90"
        />
        <CornerOrnament
          aria-hidden="true"
          className="pointer-events-none absolute bottom-0 right-0 w-10 h-10 sm:w-12 sm:h-12 text-gold/70 pixelated rotate-180"
        />
        <CornerOrnament
          aria-hidden="true"
          className="pointer-events-none absolute bottom-0 left-0 w-10 h-10 sm:w-12 sm:h-12 text-gold/70 pixelated -rotate-90"
        />

        {children}
      </div>
    </div>
  );
}
