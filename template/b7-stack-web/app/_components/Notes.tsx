import { NoteList, NoteListFallback, NotesSection } from "@b7-stack/ui";
import { connection } from "next/server";
import { Suspense } from "react";

import { createNote, deleteNote, updateNote } from "@/app/_actions/notes.ts";
import { getNotes } from "@/app/_lib/notesApi.ts";

async function LoadedNotes() {
  await connection();
  const notes = await getNotes().catch((error: unknown) => {
    console.error(error);
    return null;
  });
  return (
    <NoteList
      notes={notes}
      updateAction={updateNote}
      deleteAction={deleteNote}
    />
  );
}

export function Notes() {
  return (
    <NotesSection createAction={createNote}>
      <Suspense fallback={<NoteListFallback />}>
        <LoadedNotes />
      </Suspense>
    </NotesSection>
  );
}
