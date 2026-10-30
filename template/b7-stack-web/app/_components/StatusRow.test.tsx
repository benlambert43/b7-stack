import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { StatusRow } from "@/app/_components/StatusRow.tsx";

describe("StatusRow", () => {
  it("shows the label and state", () => {
    render(<StatusRow label="API" state="ok" />);
    expect(screen.getByText("API")).toBeInTheDocument();
    expect(screen.getByText("Online")).toBeInTheDocument();
  });
});
