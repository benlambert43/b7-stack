# b7-stack

A one-command starting point for new projects. Every project gets the same stack, so the only inputs are a name, a description, and whether to add a desktop app.

- **Web**: Next.js (App Router, Cache Components, React Compiler), Tailwind CSS, Testing Library
- **API**: Express 5 on Node.js 26, running TypeScript directly with no build step
- **Data**: PostgreSQL in Docker, Drizzle ORM with SQL migrations
- **Shared**: Zod schemas and types used by the API and the apps
- **UI**: React components and the Tailwind theme, in a package the apps share
- **Desktop**, with `--desktop`: Electron with Electron Forge and Vite, built from the same components as the web app and calling the API directly
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

npx asks to install the package (the first run on a machine also installs the tooling that compiles the CLI), then the CLI asks for a one-sentence description and whether to add a desktop app. The command then creates `sunnyradish/`, swaps the name and description in, writes `.env` files with local defaults, runs `git init`, installs dependencies, and formats the result with the project's own Prettier. The result runs straight away:

```sh
cd sunnyradish
npm run db:start
npm run dev          # web app on http://localhost:3000
npm run dev:server   # API on http://localhost:4000
```

- The folder and package names come from the name, lowercased and with each run of characters other than letters and digits replaced by a hyphen: `"SunnyRadish"` gives `sunnyradish`, `@sunnyradish/shared`, `@sunnyradish/ui`, `sunnyradish-server`, and `sunnyradish-web`.
- Pass `.` instead of a name to scaffold into the current directory, such as a freshly cloned empty repository. The folder name is offered as the project name, and `git init` is skipped when `.git` already exists.
- The name may not contain `" * / : < > ? \ |`, which Windows does not allow in file names and which would break the files the name is written into.
- Pass `--description "..."` to skip the prompt, for example in scripts.
- Pass `--db-port 5433` (or any free port) to publish the PostgreSQL container on a port other than 5432
- Pass `--desktop` to add `sunnyradish-desktop`, an Electron app that shows the same notes page as the web app, built from the same components, and calls the API directly. `npm run dev:desktop` starts it, and the project's README explains how it is put together. Pass `--no-desktop` to leave it out without being asked
- For example:

```sh
npx --allow-git=all github:benlambert43/b7-stack "SunnyRadish" --db-port 5487 --desktop
```

- Node.js 26 or newer is required.

The generated project ships a notes CRUD as a worked example of the whole path from PostgreSQL through Drizzle, Express, Zod, and Next.js server actions to React components that every app shares. Its README lists every script.

## Working on the template

`template/` is a complete project named "B7 Stack" and works in place: `cd template && npm install`, then follow its README. The repository has its own `.vscode` settings, mirroring those of the template and pointing VS Code at the TypeScript copy inside `template/node_modules`, so editing the template from this checkout behaves like editing a generated project. The CLI copies it file for file and replaces three strings everywhere, in file contents and in folder names:

| In the template           | In a generated project                  |
| ------------------------- | --------------------------------------- |
| `B7 Stack`                | the name as typed                       |
| `b7-stack`                | the slug derived from it, `sunnyradish` |
| `A new B7 Stack project.` | the description                         |

Keep those three strings exact when editing the template, and do not write `b7-stack` anywhere else in it. `template/_gitignore` and `template/_npmrc` become `.gitignore` and `.npmrc` on copy, because npm drops files with those names when it packages the template for `npx`. `.env` files, `node_modules`, and build output inside `template/` are never copied. The generated project is formatted afterwards because the slug's length moves table columns and line breaks around. Skip `npm run clean` inside `template/`: run from there, its `git clean` exclusions no longer cover the `.env` files of the workspaces.

`template/b7-stack-desktop` is the desktop app, and the template always contains it so that it can be developed in place like the rest. Without `--desktop` the CLI leaves the folder out and removes what refers to it elsewhere: everything between a line containing `desktop:start` and the next containing `desktop:end`, the workspace and scripts for it in the root `package.json`, and the lines that name `b7-stack-desktop` and are whole entries on their own: a quoted string in a list with one entry per line, a path in an ignore file, or a Markdown list item or table row. With `--desktop` it removes only the two marker lines. So whatever the desktop app needs outside its own folder must be one of those lines, as the ignore files, the Vitest project list and the README's command table are, or sit between markers, as the ESLint block and the CI job do. Any other line that names the folder, and any unbalanced marker, makes the CLI stop with an error naming the file, so CI's project without the desktop app catches it. `package-lock.json` is copied whole, and the `npm install` that follows prunes it. Electron's own binary is not part of that install: the `electron` package downloads it the first time the desktop app is started or packaged.

Nothing in the repository is JavaScript. Config files in the template are TypeScript that Node 26 loads directly, except that ESLint still needs `jiti` to read `eslint.config.ts`, which is why that package is a devDependency. The CLI is `bin/create.ts`. Node refuses to strip types from files under `node_modules`, where npx installs the package, so the `prepare` script compiles it into `dist/create.js`, which is gitignored and rebuilt on every install, including the one npx performs. The root holds itself to the gates a generated project gets: `npm install` builds the CLI and installs the git hooks, `npm run preflight` runs the format check, typecheck, lint with the same typed rules and deprecated-API check, ShellCheck on the hook, and the editor-settings check, and Husky runs lint-staged on commit. Staged files inside `template/` are handled by the template's own lint-staged config, run from `template/`, so a change to the template gets the template's checks. The root keeps TypeScript 6 for the same reason the template root does: typescript-eslint cannot use TypeScript 7 yet.

Try the CLI from a checkout with `node bin/create.ts "Demo App" --description "Trying things out."`. CI runs the root preflight, installs the commit under test with `npx` exactly as a user would, scaffolds a project with and without `--desktop`, and runs each one's `npm run preflight`, so a broken template or CLI fails here first. It also checks that the project without the desktop app does not mention one. Dependabot updates the npm packages at the root and in the template, the Postgres image in the template, and the actions in this repository's own workflow. It cannot see `template/.github/workflows/ci.yml`, so bump the `uses:` versions there by hand. It also leaves major versions of `@types/node` alone, because they follow a runtime: Node.js for most of the repository, and the Node.js inside Electron for the desktop app. After updating by hand, run `npm dedupe` in `template/`: npm can otherwise install a second copy of a package that one already present would satisfy, as it does with Rolldown after a fresh resolution.
