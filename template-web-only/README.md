# B7 Stack

A new B7 Stack project.

| Workspace         | What it is                                              |
| ----------------- | ------------------------------------------------------- |
| `b7-stack-web`    | Next.js web app                                         |
| `b7-stack-server` | Express API on Node.js, with Drizzle ORM and PostgreSQL |
| `b7-stack-shared` | Zod schemas and types, imported as `@b7-stack/shared`   |

## Getting started

Requires Node.js 26 (see `.nvmrc`), Docker, and [ShellCheck](https://www.shellcheck.net/) (`brew install shellcheck`).

```sh
npm install          # installs every workspace and the Husky pre-commit hook
npm run db:start     # starts PostgreSQL, waits for it, and applies the migrations
npm run dev          # web app on http://localhost:3000
npm run dev:server   # API on http://localhost:4000, in a second terminal
```

### Environment

A `.env` beside each `.env.template` was written with local defaults when the project was generated. On a fresh clone, copy each template and fill in `<username>`, `<password>`, and `<database_name>`:

```sh
for file in .env.template */.env.template; do cp "$file" "${file%.template}"; done
```

| File                   | Variables                                                                                                                                             |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `.env`                 | `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, and `POSTGRES_PORT`, the port PostgreSQL listens on from your machine. Docker Compose reads them |
| `b7-stack-server/.env` | The same four, which must match the root file, and `POSTGRES_HOST`, `API_PORT`, and `BASE_FRONTEND_URL`, the web app's address                        |
| `b7-stack-web/.env`    | `API_BASE_URL`, where the web app finds the API, and `SITE_URL`, the web app's public address                                                         |

Git ignores every `.env*` file except the templates.

## Commands

Run everything from the repository root.

### Develop and build

| Command              | What it does                                                                              |
| -------------------- | ----------------------------------------------------------------------------------------- |
| `npm run dev`        | Starts the Next.js dev server                                                             |
| `npm run dev:server` | Starts the API with `node --watch`, restarting on changes to the server or shared sources |
| `npm run build`      | Builds the web app                                                                        |

Nothing is compiled during development. Node.js runs the server's TypeScript directly, and `@b7-stack/shared` is imported straight from its sources. Only the web app has a build step.

```sh
npm run dev --workspace b7-stack-web -- --port 3001   # dev server on another port
npm run start --workspace b7-stack-web                # serves the output of npm run build
npm run start --workspace b7-stack-server             # API without --watch
```

Scripts such as `dev`, `build`, and `db:generate` hand over to a workspace's script of the same name. To give the tool behind one an argument, call the workspace's script as above: `npm run <script> --workspace <workspace> -- <arguments>`. Scripts that run a tool themselves, such as `lint` and `test`, take arguments straight after `--`.

### Database

| Command               | What it does                                                                                                      |
| --------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `npm run db:start`    | Starts PostgreSQL in Docker, waits until it is healthy, and applies pending migrations                            |
| `npm run db:stop`     | Stops PostgreSQL and keeps its data                                                                               |
| `npm run db:generate` | Generates a SQL migration in `b7-stack-server/drizzle` from the Drizzle schema in `b7-stack-server/src/schema.ts` |
| `npm run db:migrate`  | Applies pending migrations to a running database; `db:start` runs it for you                                      |
| `npm run db:studio`   | Opens Drizzle Studio to browse the database                                                                       |

To change the schema, edit `schema.ts`, then run `db:generate` and `db:migrate`.

```sh
npm run db:generate --workspace b7-stack-server -- --name add_tags              # names the migration file
npm run db:generate --workspace b7-stack-server -- --custom --name seed_notes   # empty migration for SQL of your own
npm run db:studio --workspace b7-stack-server -- --port 5000                    # Drizzle Studio on another port
```

### Checks

| Command               | What it does                                                                                                                                         |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run preflight`   | Everything CI runs: format check, typecheck, lint, ShellCheck, the editor-settings check, tests, and the build. `preflight:no-build` skips the build |
| `npm run format`      | Formats the whole repository with Prettier; `format:check` only reports                                                                              |
| `npm run lint`        | Runs ESLint over the whole repository, including the Tailwind class rules and the deprecated-API check; `lint:fix` applies fixes                     |
| `npm run lint:shell`  | Runs ShellCheck over the shell scripts and the pre-commit hook                                                                                       |
| `npm run lint:editor` | Fails on `.vscode/settings.json` keys that the installed VS Code or its extensions mark as deprecated; skipped where VS Code is absent, as in CI     |
| `npm run typecheck`   | Type-checks the root config files and scripts, then every workspace; the web one generates the Next.js route types first                             |

```sh
npm run preflight:no-build                         # every check, without the build
npm run lint -- b7-stack-web                       # one folder
npm run lint:fix -- b7-stack-web/app/page.tsx      # one file
npx prettier --write README.md                     # formats one file
npm run typecheck --workspace b7-stack-server      # one workspace
```

The pre-commit hook runs lint-staged on the staged files: every workspace is type-checked, ESLint and Prettier fix what they can, the tests that cover the staged files run, and staged shell scripts go through ShellCheck. CI runs the same checks as `npm run preflight`, split into parallel jobs.

### Tests

| Command                 | What it does                                                            |
| ----------------------- | ----------------------------------------------------------------------- |
| `npm test`              | Runs Vitest once across every workspace                                 |
| `npm run test:watch`    | Reruns tests as files change                                            |
| `npm run test:coverage` | Reports coverage in the terminal and as HTML in `coverage/`             |
| `npm run test:shared`   | Runs one workspace; `test:server` and `test:web` do the same for theirs |

```sh
npm test -- b7-stack-shared/src/notes.test.ts   # one file
npm test -- -t "Hello World"                    # tests whose name matches
npm run test:watch -- --project b7-stack-web    # watches one workspace
```

### Cleaning up

| Command                 | What it does                                                                                                                                                                              |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run clean:dry-run` | Lists what `clean` would remove and deletes nothing                                                                                                                                       |
| `npm run clean`         | Removes dependencies, ignored files such as build output, and the dev database with its data. `.env` files are kept. Refuses while untracked files exist, because Git has no copy of them |
| `npm run clean:force`   | Does the same and deletes the untracked files too                                                                                                                                         |
| `npm run reset`         | Rebuilds the development environment: `clean`, `npm install`, then `db:start`                                                                                                             |

```sh
npm run clean:dry-run -- --force   # lists what clean:force would remove
```

## API

`b7-stack-server` serves JSON on `http://localhost:4000`. Every route but the health check reads or writes the `notes` table.

| Route                      | What it does                                                                                                                |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `GET /api/v1/health`       | Reports whether the API reaches the database; answers 503 when it does not                                                  |
| `GET /api/v1/notes`        | Lists the notes, newest first                                                                                               |
| `POST /api/v1/notes`       | Creates a note from `{"body": "..."}` and answers 201 with it, or 400 when the body is empty or longer than 1000 characters |
| `PATCH /api/v1/notes/:id`  | Replaces a note's body, under the same rules; 404 for an unknown id                                                         |
| `DELETE /api/v1/notes/:id` | Deletes a note and answers 204; 404 for an unknown id                                                                       |

```sh
curl http://localhost:4000/api/v1/health
curl http://localhost:4000/api/v1/notes
curl -X POST http://localhost:4000/api/v1/notes -H 'content-type: application/json' -d '{"body":"Hello World"}'
```

## Where the code lives

The notes page is a worked example of the whole path, from the database to the components.

| Layer                | Where                                                                                           |
| -------------------- | ----------------------------------------------------------------------------------------------- |
| Table and migrations | `b7-stack-server/src/schema.ts` and `b7-stack-server/drizzle`                                   |
| Routes               | `b7-stack-server/src/notes.ts`, mounted in `src/index.ts`                                       |
| Server environment   | `b7-stack-server/src/serverEnv.ts`, parsed with Zod when the API starts                         |
| Schemas and types    | `b7-stack-shared/src/notes.ts` and `src/health.ts`                                              |
| API calls            | `b7-stack-web/app/_lib/notesApi.ts` and `app/_lib/apiHealth.ts`, which only the server runs     |
| Server actions       | `b7-stack-web/app/_actions/notes.ts`, which check the input, call the API, and refresh the page |
| Page and components  | `b7-stack-web/app/page.tsx` and `app/_components`                                               |

## Search engines and link previews

The web app describes itself to search engines and to the apps that show a preview when a link is pasted into them. All of it is prerendered when the app is built. The files are in `b7-stack-web`.

| File                      | What it does                                                                                                                                                                                                                    |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `app/_lib/site.ts`        | Holds the name and the description, which the layout, the home page, and the preview image all read, and `siteUrl()`, the public address from `SITE_URL`                                                                        |
| `app/layout.tsx`          | Sets what every page shares: the base address, the title and its template, the description, and the Open Graph and Twitter card settings. A page whose `metadata` has a `title` of `About` is titled "About \| B7 Stack"        |
| `app/page.tsx`            | States its own address in `alternates.canonical` and `openGraph.url`, and spreads `siteOpenGraph` into the latter, because a page's `openGraph` replaces the layout's instead of merging with it. Do the same in every new page |
| `app/opengraph-image.tsx` | Draws the 1200 by 630 preview image, which Next.js attaches to every page for Open Graph and Twitter. An `opengraph-image.tsx` in a route's folder gives that route its own                                                     |
| `app/robots.ts`           | Lets crawlers in and points them at the sitemap                                                                                                                                                                                 |
| `app/sitemap.ts`          | Lists the pages. Add each new public page to it                                                                                                                                                                                 |

`SITE_URL` is compiled into the pages, so a production build needs the real address and fails without any. CI builds with a local address, only to prove that the app builds.

```sh
SITE_URL=https://example.com npm run build
```

## Tooling notes

- **Two TypeScript versions, on purpose.** The workspaces type-check with TypeScript 7, the native compiler, which `next build` also uses. The root keeps TypeScript 6 because typescript-eslint's type-aware rules still need the JavaScript compiler API. VS Code uses that copy too (`js/ts.tsdk.path` in `.vscode/settings.json`), because the TypeScript 7 package ships no language server. Dependabot leaves TypeScript's major and minor versions alone for the same reason; bump them by hand.
- **One config for the repository.** ESLint, Prettier, and lint-staged are configured at the root and cover every workspace, so run them from the root. Vitest's root config lists the workspace projects, each of which keeps its own `vitest.config.ts`. Every config file is TypeScript: Node.js 26 loads them directly, and ESLint reads `eslint.config.ts` through `jiti`.
- **The editor agrees with preflight.** A passing `npm run preflight` should leave nothing underlined in VS Code. ESLint fails on deprecated APIs and lints Tailwind classes with `eslint-plugin-better-tailwindcss`, which makes the same checks as the Tailwind CSS IntelliSense extension, so `.vscode/settings.json` turns those three IntelliSense lints off. Prettier wraps long class lists, so the plugin's line-wrapping rule is the one rule switched off.
- **ShellCheck reads `.shellcheckrc`**, so a script checked on its own in the editor follows `scripts/lib.sh` just as `lint:shell` does.
- **`overrides` in `package.json`.** One entry points every `eslint` peer dependency at the root ESLint 10, because some plugins bundled with `eslint-config-next` still declare ESLint 9. The other lets `@esbuild-kit/core-utils`, a deprecated package that `drizzle-kit` lists but never loads, share the esbuild already installed instead of adding an old release with a known advisory.
- **`allowScripts` in `package.json`** is npm's install-script policy and names the packages whose install scripts may run. When `npm install` reports an unreviewed package, look at what its script does and approve it. `prune` drops the entries that an update has made unnecessary.

  ```sh
  npm install-scripts approve <package>
  npm install-scripts prune
  ```

- **`.npmrc` sets `engine-strict`**, so `npm install` stops on a Node.js older than 26.
