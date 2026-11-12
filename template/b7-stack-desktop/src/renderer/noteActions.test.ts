import { describe, expect, it, vi } from "vitest";

import * as api from "@/renderer/api.ts";
import { createNote } from "@/renderer/noteActions.ts";

vi.mock("@/renderer/api.ts", () => ({ createNote: vi.fn() }));

describe("createNote", () => {
  it("rejects an empty note before it reaches the API", async () => {
    const formData = new FormData();
    formData.set("body", "  ");
    await expect(createNote(formData)).resolves.toEqual({
      body: "  ",
      error: "Write something first.",
    });
    expect(api.createNote).not.toHaveBeenCalled();
  });
});
