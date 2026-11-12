import type { Note } from "@b7-stack/shared";
import {
  type DeleteNoteAction,
  NoteList,
  NoteListFallback,
  NotesSection,
  type UpdateNoteAction,
} from "@b7-stack/ui";
import { startTransition, Suspense, use, useState } from "react";

import { getNotes } from "@/renderer/api.ts";
import { createNote, deleteNote, updateNote } from "@/renderer/noteActions.ts";

function loadNotes(): Promise<Note[] | null> {
  return getNotes().catch((error: unknown) => {
    console.error(error);
    return null;
  });
}

function LoadedNotes({
  notes,
  updateAction,
  deleteAction,
}: {
  notes: Promise<Note[] | null>;
  updateAction: UpdateNoteAction;
  deleteAction: DeleteNoteAction;
}) {
  return (
    <NoteList
      notes={use(notes)}
      updateAction={updateAction}
      deleteAction={deleteAction}
    />
  );
}

export function Notes() {
  const [notes, setNotes] = useState(loadNotes);

  async function reloadAfter<Result extends { error: string | null }>(
    action: Promise<Result>,
  ): Promise<Result> {
    const result = await action;
    if (!result.error) {
      startTransition(() => {
        setNotes(loadNotes());
      });
    }
    return result;
  }

  return (
    <NotesSection
      createAction={(_previousState, formData) =>
        reloadAfter(createNote(formData))
      }
    >
      <Suspense fallback={<NoteListFallback />}>
        <LoadedNotes
          notes={notes}
          updateAction={(id, _previousState, formData) =>
            reloadAfter(updateNote(id, formData))
          }
          deleteAction={(id) => reloadAfter(deleteNote(id))}
        />
      </Suspense>
    </NotesSection>
  );
}
