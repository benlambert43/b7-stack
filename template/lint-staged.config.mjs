export default {
  "*.{ts,tsx,mts,cts,js,mjs,cjs}": [
    () => "npm run typecheck",
    "eslint --max-warnings 0 --fix --no-warn-ignored",
    "prettier --write",
    "vitest related --run",
  ],
  "!(*.ts|*.tsx|*.mts|*.cts|*.js|*.mjs|*.cjs)":
    "prettier --write --ignore-unknown",
  "*.sh": "shellcheck --shell=sh",
};
