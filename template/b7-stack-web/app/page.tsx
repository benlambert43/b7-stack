import { Notes } from "@/app/_components/Notes.tsx";
import { StatusChecks } from "@/app/_components/StatusChecks.tsx";

export default function Home() {
  return (
    <main
      className="flex flex-1 flex-col items-center gap-10 px-6 py-16
        text-center"
    >
      <header className="flex flex-col items-center gap-4">
        <h1 className="text-4xl font-semibold tracking-tight">B7 Stack</h1>
        <p className="max-w-md text-lg text-zinc-600 dark:text-zinc-400">
          A new B7 Stack project.
        </p>
      </header>
      <Notes />
      <StatusChecks />
    </main>
  );
}
