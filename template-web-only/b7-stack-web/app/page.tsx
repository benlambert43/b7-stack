import type { Metadata } from "next";

import { Notes } from "@/app/_components/Notes.tsx";
import { StatusChecks } from "@/app/_components/StatusChecks.tsx";
import { site, siteOpenGraph } from "@/app/_lib/site.ts";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
  openGraph: { ...siteOpenGraph, url: "/" },
};

export default function Home() {
  return (
    <main
      className="flex flex-1 flex-col items-center gap-10 px-6 py-16
        text-center"
    >
      <header className="flex flex-col items-center gap-4">
        <h1 className="text-4xl font-semibold tracking-tight">{site.name}</h1>
        <p className="max-w-md text-lg text-zinc-600 dark:text-zinc-400">
          {site.description}
        </p>
      </header>
      <Notes />
      <StatusChecks />
    </main>
  );
}
