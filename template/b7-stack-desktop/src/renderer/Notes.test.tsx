import { act, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { Notes } from "@/renderer/Notes.tsx";

vi.mock("@/renderer/api.ts", () => ({
  getNotes: vi.fn().mockResolvedValue([
    {
      id: "0b3b2f6e-6f0a-4c56-9d0a-2f6f0a4c569d",
      body: "Fetched from the API",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    },
  ]),
}));

describe("Notes", () => {
  it("shows the notes the API returns", async () => {
    // Notes suspends while it loads, and React only finishes a suspended
    // render in a test when the act around it is awaited.
    await act(() => Promise.resolve(render(<Notes />)));
    expect(screen.getByText("Fetched from the API")).toBeInTheDocument();
  });
});
