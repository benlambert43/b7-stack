import { describe, expect, it, vi } from "vitest";

import { createNote } from "@/app/_actions/notes.ts";
import * as notesApi from "@/app/_lib/notesApi.ts";

vi.mock("next/cache", () => ({ refresh: vi.fn() }));
vi.mock("@/app/_lib/notesApi.ts", () => ({ createNote: vi.fn() }));

describe("createNote", () => {
  it("rejects an empty note before it reaches the API", async () => {
    const formData = new FormData();
    formData.set("body", "  ");
    await expect(
      createNote({ body: "", error: null }, formData),
    ).resolves.toEqual({ body: "  ", error: "Write something first." });
    expect(notesApi.createNote).not.toHaveBeenCalled();
  });
});
