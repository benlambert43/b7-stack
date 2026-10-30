import "server-only";

import { type HealthResponse, healthResponseSchema } from "@b7-stack/shared";

import { apiUrl } from "@/app/_lib/api.ts";

export async function getApiHealth(): Promise<HealthResponse | null> {
  try {
    const response = await fetch(apiUrl("/api/v1/health"), {
      signal: AbortSignal.timeout(3000),
    });
    const parsed = healthResponseSchema.safeParse(await response.json());
    return parsed.success ? parsed.data : null;
  } catch (error) {
    console.error("API health check failed", error);
    return null;
  }
}
