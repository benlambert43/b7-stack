# b7-stack

A one-command starting point for new projects. Every project gets the same stack, so the only inputs are a name and a description.

- **Web**: Next.js (App Router, Cache Components, React Compiler), Tailwind CSS, Testing Library
- **API**: Express 5 on Node.js 26, running TypeScript directly with no build step
- **Data**: PostgreSQL in Docker, Drizzle ORM with SQL migrations
- **Shared**: Zod schemas and types used by both the API and the web app
- **Tooling**: npm workspaces, TypeScript 7, ESLint, Prettier, Vitest, Husky with lint-staged, ShellCheck, Dependabot, GitHub Actions CI

## Usage

SunnyRadish is the example project name used throughout this README. Put your own name in its place.

```sh
npx github:benlambert43/b7-stack "SunnyRadish"
```

Starting with npm v12+, you may get this error when trying to run this command:

```
npm error code EALLOWGIT
npm error Fetching packages of type "git" have been disabled
```

You can bypass this with --allow-git=all.

```sh
npx --allow-git=all github:benlambert43/b7-stack "SunnyRadish"
```

npx asks to install the package (the first run on a machine also installs the tooling that compiles the CLI), then the CLI asks for a one-sentence description. The command then creates `sunnyradish/`, swaps the name and description in, writes `.env` files with local defaults, runs `git init`, installs dependencies, and formats the result with the project's own Prettier. The result runs straight away:

```sh
cd sunnyradish
npm run db:start
npm run dev          # web app on http://localhost:3000
npm run dev:server   # API on http://localhost:4000
```

- The folder and package names come from the name, lowercased and with each run of characters other than letters and digits replaced by a hyphen: `"SunnyRadish"` gives `sunnyradish`, `@sunnyradish/shared`, `sunnyradish-server`, and `sunnyradish-web`.
- Pass `.` instead of a name to scaffold into the current directory, such as a freshly cloned empty repository. The folder name is offered as the project name, and `git init` is skipped when `.git` already exists.
- Pass `--description "..."` to skip the prompt, for example in scripts.
- Node.js 26 or newer is required.

The generated project ships a notes CRUD as a worked example of the whole path from PostgreSQL through Drizzle, Express, Zod, and Next.js server actions to React. Its README lists every script.

## Working on the template

`template/` is a complete project named "B7 Stack" and works in place: `cd template && npm install`, then follow its README. The repository has its own `.vscode` settings, mirroring those of the template and pointing VS Code at the TypeScript copy inside `template/node_modules`, so editing the template from this checkout behaves like editing a generated project. The CLI copies it file for file and replaces three strings everywhere, in file contents and in folder names:

| In the template           | In a generated project                  |
| ------------------------- | --------------------------------------- |
| `B7 Stack`                | the name as typed                       |
| `b7-stack`                | the slug derived from it, `sunnyradish` |
| `A new B7 Stack project.` | the description                         |

Keep those three strings exact when editing the template, and do not write `b7-stack` anywhere else in it. `template/_gitignore` and `template/_npmrc` become `.gitignore` and `.npmrc` on copy, because npm drops files with those names when it packages the template for `npx`. `.env` files, `node_modules`, and build output inside `template/` are never copied. The generated project is formatted afterwards because the slug's length moves table columns and line breaks around. Skip `npm run clean` inside `template/`: run from there, its `git clean` exclusions no longer cover `b7-stack-server/.env` and `b7-stack-web/.env`.

Nothing in the repository is JavaScript. Config files in the template are TypeScript that Node 26 loads directly, except that ESLint still needs `jiti` to read `eslint.config.ts`, which is why that package is a devDependency. The CLI is `bin/create.ts`. Node refuses to strip types from files under `node_modules`, where npx installs the package, so the `prepare` script compiles it into `dist/create.js`, which is gitignored and rebuilt on every install, including the one npx performs. The root holds itself to the gates a generated project gets: `npm install` builds the CLI and installs the git hooks, `npm run preflight` runs the format check, typecheck, lint with the same typed rules and deprecated-API check, ShellCheck on the hook, and the editor-settings check, and Husky runs lint-staged on commit. Staged files inside `template/` are handled by the template's own lint-staged config, run from `template/`, so a change to the template gets the template's checks. The root keeps TypeScript 6 for the same reason the template root does: typescript-eslint cannot use TypeScript 7 yet.

Try the CLI from a checkout with `node bin/create.ts "Demo App" --description "Trying things out."`. CI runs the root preflight, installs the commit under test with `npx` exactly as a user would, scaffolds a project, and runs its `npm run preflight`, so a broken template or CLI fails here first. Dependabot updates the npm packages at the root and in the template, the Postgres image in the template, and the actions in this repository's own workflow. It cannot see `template/.github/workflows/ci.yml`, so bump the `uses:` versions there by hand.
