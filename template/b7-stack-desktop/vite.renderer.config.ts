import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

import { contentSecurityPolicy } from "./src/contentSecurityPolicy.ts";
import { envSchema } from "./src/envSchema.ts";

// The environment is compiled into the app, so a missing or invalid value fails
// the build here instead of the app when it starts on someone's machine.
function loadAppEnv(mode: string) {
  const parsed = envSchema.safeParse(
    loadEnv(mode, import.meta.dirname, "VITE_"),
  );
  if (!parsed.success) {
    throw new Error(
      `Set VITE_API_BASE_URL in .env (see .env.template) or in the environment: ${parsed.error.message}`,
    );
  }
  return parsed.data;
}

export default defineConfig(({ mode }) => {
  const env = loadAppEnv(mode);
  return {
    build: { target: "esnext" },
    server: {
      // The API allows requests from this dev server by its address, so it has
      // to fail when the port is taken instead of quietly moving to the next one.
      port: 5173,
      strictPort: true,
      headers: {
        "Content-Security-Policy": contentSecurityPolicy(
          env.VITE_API_BASE_URL,
          { devServer: true },
        ),
      },
    },
    resolve: {
      tsconfigPaths: true,
      // Follows the workspace links to the shared packages, so that they are
      // source to watch and hot-reload instead of dependencies to cache.
      preserveSymlinks: false,
    },
    plugins: [
      react(),
      babel({ presets: [reactCompilerPreset()] }),
      tailwindcss(),
    ],
  };
});
