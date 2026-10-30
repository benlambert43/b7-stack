import { z } from "zod";

const serverEnvSchema = z.object({
  API_PORT: z.coerce.number().int().positive().default(4000),
  BASE_FRONTEND_URL: z
    .url({ protocol: /^https?$/ })
    .transform((value) => new URL(value).origin),
  POSTGRES_USER: z.string().min(1),
  POSTGRES_PASSWORD: z.string().min(1),
  POSTGRES_DB: z.string().min(1),
  POSTGRES_HOST: z.string().min(1).default("localhost"),
  POSTGRES_PORT: z.coerce.number().int().positive().default(5432),
});

export const serverEnv = serverEnvSchema.parse(process.env);
