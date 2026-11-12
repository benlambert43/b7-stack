import { defineConfig } from "vite";

export default defineConfig(({ mode }) => ({
  build: {
    // Electron pins the runtime, so nothing needs compiling down to older syntax.
    target: "esnext",
    // Lets a stack trace from the running app point at the TypeScript source.
    sourcemap: mode === "development",
  },
  resolve: { tsconfigPaths: true },
}));
