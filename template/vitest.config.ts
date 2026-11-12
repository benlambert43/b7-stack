import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: [
      "b7-stack-shared",
      "b7-stack-ui",
      "b7-stack-server",
      "b7-stack-web",
      "b7-stack-desktop",
    ],
    coverage: {
      reporter: ["text", "html"],
      include: [
        "b7-stack-shared/src/**",
        "b7-stack-ui/src/**",
        "b7-stack-server/src/**",
        "b7-stack-web/app/**",
        "b7-stack-desktop/src/**",
      ],
    },
  },
});
