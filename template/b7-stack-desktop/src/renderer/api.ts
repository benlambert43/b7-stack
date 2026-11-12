import { createApiClient } from "@b7-stack/shared";

import { env } from "@/env.ts";

export const api = createApiClient(
  (path) => new URL(path, env.VITE_API_BASE_URL),
);
