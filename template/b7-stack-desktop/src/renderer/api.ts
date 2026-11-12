import {
  type HealthResponse,
  healthResponseSchema,
  type Note,
  type NoteInput,
  noteSchema,
} from "@b7-stack/shared";

import { env } from "@/env.ts";

function apiUrl(path: string): URL {
  return new URL(path, env.VITE_API_BASE_URL);
}

async function request(
  path: string,
  method = "GET",
  body?: unknown,
): Promise<Response> {
  const response = await fetch(apiUrl(path), {
    method,
    ...(body !== undefined && {
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
    signal: AbortSignal.timeout(5000),
  });
  if (!response.ok) {
    throw new Error(`${method} ${path} failed with ${String(response.status)}`);
  }
  return response;
}

export async function getHealth(): Promise<HealthResponse | null> {
  try {
    const response = await fetch(apiUrl("/api/v1/health"), {
      signal: AbortSignal.timeout(3000),
    });
    const parsed = healthResponseSchema.safeParse(await response.json());
    return parsed.success ? parsed.data : null;
  } catch (error) {
    console.error("API health check failed", error);
    return null;
  }
}

export async function getNotes(): Promise<Note[]> {
  const response = await request("/api/v1/notes");
  return noteSchema.array().parse(await response.json());
}

export async function createNote(input: NoteInput): Promise<void> {
  await request("/api/v1/notes", "POST", input);
}

export async function updateNote(id: string, input: NoteInput): Promise<void> {
  await request(`/api/v1/notes/${id}`, "PATCH", input);
}

export async function deleteNote(id: string): Promise<void> {
  await request(`/api/v1/notes/${id}`, "DELETE");
}
