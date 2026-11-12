import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";

import { StatusRow } from "@/app/_components/StatusRow.tsx";

it("renders Hello World", () => {
  render(<StatusRow label="Hello World" state="ok" />);
  expect(screen.getByText("Hello World")).toBeInTheDocument();
});
