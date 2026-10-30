import { describe, expect, it, vi } from "vitest";

import { checkDatabase } from "./health.ts";

vi.mock("./db.ts", () => ({ db: { execute: vi.fn().mockResolvedValue({}) } }));

describe("checkDatabase", () => {
  it("reports ok when the database responds", async () => {
    await expect(checkDatabase()).resolves.toBe("ok");
  });
});
