import "server-only";

import { type Note, type NoteInput, noteSchema } from "@b7-stack/shared";

import { apiUrl } from "@/app/_lib/api.ts";

async function request(path: string, init?: RequestInit): Promise<Response> {
  const response = await fetch(apiUrl(path), {
    ...init,
    headers: { "content-type": "application/json" },
    signal: AbortSignal.timeout(5000),
  });
  if (!response.ok) {
    throw new Error(
      `${init?.method ?? "GET"} ${path} failed with ${response.status}`,
    );
  }
  return response;
}

export async function getNotes(): Promise<Note[]> {
  const response = await request("/api/v1/notes");
  return noteSchema.array().parse(await response.json());
}

export async function createNote(input: NoteInput): Promise<void> {
  await request("/api/v1/notes", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateNote(id: string, input: NoteInput): Promise<void> {
  await request(`/api/v1/notes/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function deleteNote(id: string): Promise<void> {
  await request(`/api/v1/notes/${id}`, { method: "DELETE" });
}
