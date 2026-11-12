"use server";

import { noteIdSchema, noteInputSchema } from "@b7-stack/shared";
import { refresh } from "next/cache";

import * as notesApi from "@/app/_lib/notesApi.ts";

export interface NoteFormState {
  body: string;
  error: string | null;
}

function readBody(formData: FormData): string {
  const body = formData.get("body");
  return typeof body === "string" ? body : "";
}

export async function createNote(
  _previousState: NoteFormState,
  formData: FormData,
): Promise<NoteFormState> {
  const body = readBody(formData);
  const input = noteInputSchema.safeParse({ body });
  if (!input.success) {
    return { body, error: input.error.issues[0]?.message ?? "Invalid note." };
  }
  try {
    await notesApi.createNote(input.data);
  } catch (error) {
    console.error(error);
    return { body, error: "Could not save the note. Try again." };
  }
  refresh();
  return { body: "", error: null };
}

export async function updateNote(
  id: string,
  _previousState: NoteFormState,
  formData: FormData,
): Promise<NoteFormState> {
  const body = readBody(formData);
  const noteId = noteIdSchema.safeParse(id);
  const input = noteInputSchema.safeParse({ body });
  if (!noteId.success || !input.success) {
    return {
      body,
      error: input.error?.issues[0]?.message ?? "Invalid note.",
    };
  }
  try {
    await notesApi.updateNote(noteId.data, input.data);
  } catch (error) {
    console.error(error);
    return { body, error: "Could not update the note. Try again." };
  }
  refresh();
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
    await notesApi.deleteNote(noteId.data);
  } catch (error) {
    console.error(error);
    return { error: "Could not delete the note. Try again." };
  }
  refresh();
  return { error: null };
}
