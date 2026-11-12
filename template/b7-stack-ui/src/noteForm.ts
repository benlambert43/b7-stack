export interface NoteFormState {
  body: string;
  error: string | null;
}

export type CreateNoteAction = (
  previousState: NoteFormState,
  formData: FormData,
) => Promise<NoteFormState>;

export type UpdateNoteAction = (
  id: string,
  previousState: NoteFormState,
  formData: FormData,
) => Promise<NoteFormState>;

export type DeleteNoteAction = (
  id: string,
) => Promise<{ error: string | null }>;

export function readNoteBody(formData: FormData): string {
  const body = formData.get("body");
  return typeof body === "string" ? body : "";
}
