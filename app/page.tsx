import Link from "next/link";

import { CrownIcon } from "@/components/CrownIcon";

export default function HomePage() {
  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center px-6 py-16 bg-parchment text-ink overflow-hidden">
      <div className="pointer-events-none absolute inset-0 opacity-[0.04] [background-image:radial-gradient(circle_at_25%_15%,#1A1410_1px,transparent_1px),radial-gradient(circle_at_75%_85%,#1A1410_1px,transparent_1px)] [background-size:48px_48px,72px_72px]" />

      <section className="animate-fade-in relative z-10 flex flex-col items-center text-center max-w-2xl">
        <CrownIcon className="w-20 h-20 sm:w-24 sm:h-24 text-gold pixelated" />

        <h1 className="mt-8 font-serif text-6xl sm:text-7xl md:text-8xl tracking-tight text-ink">
          Suzerain
        </h1>

        <p className="mt-4 font-serif italic text-lg sm:text-xl md:text-2xl text-ink/70 leading-relaxed">
          Anno 1247. Le royaume d&rsquo;Aldemar attend son seigneur.
        </p>

        <Link
          href="/play"
          className="mt-10 inline-flex items-center gap-3 rounded-md border border-gold bg-parchment px-6 py-3 font-serif text-lg text-ink shadow-sm transition-colors hover:border-blood hover:bg-parchment hover:text-blood"
        >
          Entrer dans le royaume
          <span aria-hidden="true">→</span>
        </Link>

        <span className="mt-6 inline-flex items-center gap-2 rounded-full border border-gold/40 bg-parchment/60 px-4 py-1.5 text-xs sm:text-sm font-sans text-ink/70 tracking-wide">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-blood" />
          v0.2 — Le fief s&rsquo;éveille.
        </span>
      </section>

      <footer className="absolute bottom-6 inset-x-0 text-center text-xs sm:text-sm text-ink/40 font-sans tracking-wide">
        Suzerain — Construit par Antoine, Grégory, Justin
      </footer>
    </main>
  );
}
