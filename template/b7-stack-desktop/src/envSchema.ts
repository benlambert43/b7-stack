import { z } from "zod";

// The window's environment. Vite compiles these values into the app, so
// vite.renderer.config.ts checks them when the app is built as well as when it
// starts.
export const envSchema = z.object({
  VITE_API_BASE_URL: z.url({ protocol: /^https?$/ }),
});

export type Env = z.infer<typeof envSchema>;
