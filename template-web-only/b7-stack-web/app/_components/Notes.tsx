import { connection } from "next/server";
import { Suspense } from "react";

import { NoteForm } from "@/app/_components/NoteForm.tsx";
import { NoteItem } from "@/app/_components/NoteItem.tsx";
import { getNotes } from "@/app/_lib/notesApi.ts";

async function NoteList() {
  await connection();
  let notes;
  try {
    notes = await getNotes();
  } catch (error) {
    console.error(error);
    return (
      <p role="alert" className="py-3 text-sm text-red-600 dark:text-red-400">
        Could not load notes.
      </p>
    );
  }

  if (notes.length === 0) {
    return <p className="py-3 text-sm text-zinc-500">No notes yet.</p>;
  }

  return (
    <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
      {notes.map((note) => (
        <NoteItem key={note.id} note={note} />
      ))}
    </ul>
  );
}

export function Notes() {
  return (
    <section className="flex w-full max-w-xl flex-col gap-4 text-left">
      <h2
        className="text-sm font-semibold tracking-wide text-zinc-500 uppercase"
      >
        Notes
      </h2>
      <NoteForm />
      <Suspense
        fallback={<p className="py-3 text-sm text-zinc-500">Loading notes…</p>}
      >
        <NoteList />
      </Suspense>
    </section>
  );
}
