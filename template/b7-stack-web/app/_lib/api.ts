import "server-only";

import { createApiClient } from "@b7-stack/shared";

function apiUrl(path: string): URL {
  const apiBaseUrl = process.env.API_BASE_URL;
  if (!apiBaseUrl) {
    throw new Error("API_BASE_URL is not set");
  }
  return new URL(path, apiBaseUrl);
}

export const api = createApiClient(apiUrl);
