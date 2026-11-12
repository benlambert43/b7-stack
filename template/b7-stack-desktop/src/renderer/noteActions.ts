import { noteIdSchema, noteInputSchema } from "@b7-stack/shared";
import { type NoteFormState, readNoteBody } from "@b7-stack/ui";

import * as api from "@/renderer/api.ts";

export async function createNote(formData: FormData): Promise<NoteFormState> {
  const body = readNoteBody(formData);
  const input = noteInputSchema.safeParse({ body });
  if (!input.success) {
    return { body, error: input.error.issues[0]?.message ?? "Invalid note." };
  }
  try {
    await api.createNote(input.data);
  } catch (error) {
    console.error(error);
    return { body, error: "Could not save the note. Try again." };
  }
  return { body: "", error: null };
}

export async function updateNote(
  id: string,
  formData: FormData,
): Promise<NoteFormState> {
  const body = readNoteBody(formData);
  const noteId = noteIdSchema.safeParse(id);
  const input = noteInputSchema.safeParse({ body });
  if (!noteId.success || !input.success) {
    return {
      body,
      error: input.error?.issues[0]?.message ?? "Invalid note.",
    };
  }
  try {
    await api.updateNote(noteId.data, input.data);
  } catch (error) {
    console.error(error);
    return { body, error: "Could not update the note. Try again." };
  }
  return { body: input.data.body, error: null };
}

export async function deleteNote(
  id: string,
): Promise<{ error: string | null }> {
  const noteId = noteIdSchema.safeParse(id);
  if (!noteId.success) {
    return { error: "Invalid note." };
  }
  try {
    await api.deleteNote(noteId.data);
  } catch (error) {
    console.error(error);
    return { error: "Could not delete the note. Try again." };
  }
  return { error: null };
}
