# B7 Stack

A new B7 Stack project.

# Stack

- Frontend: Next.js
- API: Node.js + Express
- ORM: Drizzle
- Database: PostgreSQL

# Development

Requires Node.js 26 (see `.nvmrc`), Docker, and [ShellCheck](https://www.shellcheck.net/) (`brew install shellcheck`).

1. `.env`, `b7-stack-server/.env`, and `b7-stack-web/.env` were written with local defaults when the project was generated. On a fresh clone, copy each `.env.template` to `.env` beside it and fill in the values; the `POSTGRES_*` lines in the server file match the root file, so paste them across. Git ignores every `.env*` file except the templates.
2. `npm install` installs every workspace and sets up the Husky pre-commit hook.
3. `npm run db:start` starts PostgreSQL and returns once it accepts connections.
4. `npm run db:migrate` applies the migrations in `b7-stack-server/drizzle`.
5. `npm run dev` starts the web app; `npm run dev:server` starts the API.

Nothing is compiled during development. Node.js 26 runs the server's TypeScript directly, and `@b7-stack/shared` is imported straight from `b7-stack-shared/src` by the server, the web app, and the tests. Only the web app has a build step.

| Command               | What it does                                                                                                                                                                         |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `npm run dev`         | Starts the Next.js dev server                                                                                                                                                        |
| `npm run dev:server`  | Starts the API with `node --watch`, restarting on changes to the server or shared sources                                                                                            |
| `npm run db:start`    | Starts PostgreSQL in Docker and waits until it is healthy                                                                                                                            |
| `npm run db:stop`     | Stops PostgreSQL                                                                                                                                                                     |
| `npm run db:generate` | Generates a SQL migration in `b7-stack-server/drizzle` from the Drizzle schema in `b7-stack-server/src/schema.ts`                                                                    |
| `npm run db:migrate`  | Applies pending migrations to the database                                                                                                                                           |
| `npm run db:studio`   | Opens Drizzle Studio to browse the database                                                                                                                                          |
| `npm run preflight`   | Everything CI runs: format check, typecheck, lint, ShellCheck, tests, and a web build; `preflight:no-build` skips the build                                                          |
| `npm run format`      | Formats the whole repository with Prettier; `format:check` only reports                                                                                                              |
| `npm run lint`        | Runs ESLint over the whole repository, including the Tailwind class rules and the deprecated-API check; `lint:fix` applies fixes                                                     |
| `npm run lint:shell`  | Runs ShellCheck over the shell scripts and the pre-commit hook with the settings in `.shellcheckrc`, which the ShellCheck editor extension reads too                                 |
| `npm run typecheck`   | Type-checks every workspace; the web one generates the Next.js route types first                                                                                                     |
| `npm test`            | Runs Vitest across every workspace; `test:watch` watches, `test:coverage` reports coverage, and `test:shared`, `test:server`, and `test:web` run one workspace                       |
| `npm run build`       | Builds the web app                                                                                                                                                                   |
| `npm run clean`       | Removes ignored files, dependencies, and the dev database. Refuses while uncommitted files exist; `clean:force` deletes them too and `clean:dry-run` previews. `.env` files are kept |
| `npm run reset`       | Rebuilds the development environment: cleans, reinstalls, starts the database again, and applies the migrations                                                                      |

The pre-commit hook runs lint-staged on the staged files: every workspace is type-checked, ESLint and Prettier fix what they can, the tests that cover the staged files run, and staged shell scripts go through ShellCheck. CI runs the same checks as `npm run preflight`, split into parallel lint, test, and build jobs.

## Tooling notes

- Two TypeScript versions are installed on purpose. The workspaces type-check with TypeScript 7, the native compiler, which `next build` also uses. The root keeps TypeScript 6 because typescript-eslint's type-aware rules still need the JavaScript compiler API, and VS Code uses that copy too (`typescript.tsdk` in `.vscode/settings.json`) because the TypeScript 7 package ships no language server. Dependabot leaves TypeScript alone for the same reason; bump it by hand.
- ESLint, Prettier, and lint-staged are configured once at the repository root and cover every workspace; run them from the root, where they also honor `.gitignore`. Vitest's root config lists the three workspace projects, each of which keeps its own `vitest.config.ts`. Every config file is TypeScript: Node 26 loads them directly, and ESLint reads `eslint.config.ts` through `jiti`.
- A passing `npm run preflight` should leave nothing underlined in VS Code. ESLint fails on deprecated APIs through `@typescript-eslint/no-deprecated` and lints Tailwind classes in the web app with `eslint-plugin-better-tailwindcss`, which implements the same checks as the Tailwind CSS IntelliSense extension (canonical classes, conflicting classes, variant order); `.vscode/settings.json` turns off the three IntelliSense lints that ESLint now reports. Prettier owns class order and line wrapping, so those two plugin rules stay off. ShellCheck reads `.shellcheckrc`, so a script checked on its own in the editor follows `scripts/lib.sh` just as `lint:shell` does.
- The `overrides` entry in `package.json` points every `eslint` peer dependency at the root ESLint 10. Some plugins bundled with `eslint-config-next` still declare ESLint 9 as their peer, although Next.js supports ESLint 10 with them.
- `allowScripts` in `package.json` is npm's install-script policy and names the packages whose install scripts may run. When `npm install` reports an unreviewed package, look at what its script does and run `npm install-scripts approve <package>`.
