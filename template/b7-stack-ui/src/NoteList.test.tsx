import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { NoteList } from "./NoteList.tsx";

const actions = { updateAction: vi.fn(), deleteAction: vi.fn() };

describe("NoteList", () => {
  it("lists the notes with their controls", () => {
    const note = {
      id: "0b3b2f6e-6f0a-4c56-9d0a-2f6f0a4c569d",
      body: "Water the plants",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    };
    render(<NoteList notes={[note]} {...actions} />);
    expect(screen.getByText("Water the plants")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Edit note" })).toBeEnabled();
  });

  it("says so when the notes could not be loaded", () => {
    render(<NoteList notes={null} {...actions} />);
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Could not load notes.",
    );
  });
});
