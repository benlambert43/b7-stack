import type { ServiceStatus } from "@b7-stack/shared";
import { sql } from "drizzle-orm";

import { db } from "./db.ts";

export async function checkDatabase(): Promise<ServiceStatus> {
  try {
    await db.execute(sql`select 1`);
    return "ok";
  } catch (error) {
    console.error("Database health check failed", error);
    return "error";
  }
}
