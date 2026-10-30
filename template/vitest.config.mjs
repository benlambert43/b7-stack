import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: ["b7-stack-shared", "b7-stack-server", "b7-stack-web"],
    passWithNoTests: true,
    coverage: {
      reporter: ["text", "html"],
      include: [
        "b7-stack-shared/src/**",
        "b7-stack-server/src/**",
        "b7-stack-web/app/**",
      ],
    },
  },
});
