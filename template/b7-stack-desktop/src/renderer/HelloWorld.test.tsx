import { StatusRow } from "@b7-stack/ui";
import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";

it("renders Hello World", () => {
  render(<StatusRow label="Hello World" state="ok" />);
  expect(screen.getByText("Hello World")).toBeInTheDocument();
});
