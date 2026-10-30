import { describe, expect, it } from "vitest";

import { healthResponseSchema } from "./health.ts";

describe("healthResponseSchema", () => {
  it("parses a healthy response", () => {
    const body = { status: "ok", database: "ok" };
    expect(healthResponseSchema.parse(body)).toEqual(body);
  });
});
