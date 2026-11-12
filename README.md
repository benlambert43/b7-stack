# b7-stack

A one-command starting point for new projects. Every project gets the same stack, so it only asks for a name, a description, a database port, and whether to add a desktop app.

| Part               | What you get                                                                                                                                                                                                                                  |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Web                | Next.js (App Router, Cache Components, React Compiler), Tailwind CSS, Testing Library                                                                                                                                                         |
| API                | Express 5 on Node.js 26, running TypeScript directly with no build step                                                                                                                                                                       |
| Data               | PostgreSQL in Docker, Drizzle ORM with SQL migrations                                                                                                                                                                                         |
| Shared             | Zod schemas and types, used by the API and the web app                                                                                                                                                                                        |
| Desktop (optional) | Electron with Electron Forge and Vite, calling the API directly. Adding it also adds a UI package, which holds the React components and the Tailwind theme for both apps, and moves the API client and the form logic into the shared package |
| Tooling            | npm workspaces, TypeScript 7, ESLint, Prettier, Vitest, Husky with lint-staged, ShellCheck, Dependabot, GitHub Actions CI                                                                                                                     |

A generated project ships a notes CRUD as a worked example of the whole path, from PostgreSQL through Drizzle, Express, Zod, and Next.js server actions to React components. Its own README lists every script.

## Quick start

Requires Node.js 26 or newer, Git, and Docker for the database. SunnyRadish is the example name used throughout; put your own in its place.

```sh
npx --allow-git=all github:benlambert43/b7-stack
```

npm 12 and newer refuse packages fetched from Git with `npm error code EALLOWGIT` unless `--allow-git=all` is given. Older versions of npm do not need the flag.

npx asks to install the package, and the CLI then asks its questions one by one. When it finishes, the project runs straight away:

```sh
cd sunnyradish
npm run db:start      # PostgreSQL in Docker, migrations applied
npm run dev           # web app on http://localhost:3000
npm run dev:server    # API on http://localhost:4000
npm run dev:desktop   # desktop app, if you added one
```

## Questions

The command takes no arguments. Everything is asked for, in this order:

| Question                                          | Default | What the answer sets                                                                                                                                                                    |
| ------------------------------------------------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Project name, or . to use the current directory` | none    | The display name of the project. The folder and package names are derived from it                                                                                                       |
| `Description`                                     | none    | One sentence for the README, `package.json`, and the home page                                                                                                                          |
| `Database port`                                   | `5432`  | The host port for the PostgreSQL container, from 1 to 65535. Give each project its own to run their databases side by side                                                              |
| `Add an Electron desktop app?`                    | `yes`   | `yes` or `y` adds `sunnyradish-desktop`, an Electron app that shows the same notes page as the web app, and `sunnyradish-ui`, the components the two share; `no` or `n` leaves both out |

A default is shown in parentheses after the question and is used when the answer is left blank. A question without a default is asked again until it is answered.

### Examples

Take the defaults by pressing Enter at the last two questions, which adds the desktop app:

```text
Project name, or . to use the current directory: SunnyRadish
Description: Notes for gardeners.
Database port (5432):
Add an Electron desktop app? (yes):
```

Leave the desktop app out, and publish PostgreSQL on a port other than 5432:

```text
Project name, or . to use the current directory: SunnyRadish
Description: Notes for gardeners.
Database port (5432): 5433
Add an Electron desktop app? (yes): no
```

Scaffold into the current directory, such as a freshly cloned empty repository. Answering `.` brings up the name again, with the folder's name as its default:

```text
Project name, or . to use the current directory: .
Project name (sunnyradish):
Description: Notes for gardeners.
Database port (5432):
Add an Electron desktop app? (yes):
```

In a script or in CI, give the answers on standard input, one line each and in the same order. An empty line takes the default, and `--yes` stops npx from asking to install the package. This one keeps port 5432 and leaves the desktop app out:

```sh
printf '%s\n' "SunnyRadish" "Notes for gardeners." "" "no" | npx --yes --allow-git=all github:benlambert43/b7-stack
```

### Rules

- **Names.** The name is lowercased and each run of characters other than letters and digits becomes a hyphen. `SunnyRadish` gives `sunnyradish`, `@sunnyradish/shared`, `sunnyradish-server`, and `sunnyradish-web`, and with the desktop app `sunnyradish-desktop` and `@sunnyradish/ui` as well; `Demo App` gives `demo-app`.
- **Characters.** The name and the description may not contain `"`, `\`, or control characters, which would break the files they are written into. With the desktop app the name may not contain `* / : < > ? |` either, which Windows does not allow in file names.
- **Target folder.** It must be new, or hold nothing but what GitHub adds to a new repository: `.git`, `.gitignore`, `.gitattributes`, `LICENSE`, and `README.md`. The template's `.gitignore`, `.gitattributes`, and `README.md` replace the ones already there.
- **Invalid answers.** An answer that breaks one of these rules, a port out of range, or anything but `yes`, `y`, `no`, or `n` for the desktop app stops the command before any file is written. So does input that ends before every question has an answer.

### What the command does

1. Copies the template into `sunnyradish/` and swaps the name and the description in.
2. Writes a `.env` beside each `.env.template` with local defaults: the slug as the database user and name, a random password, and the database port that was chosen.
3. Runs `git init` with `main` as the branch, unless `.git` already exists.
4. Runs `npm install`, then formats the project with its own Prettier.

If a step fails, the files stay in the folder and the error says where they are.

## Working on this repository

| Path                        | What it holds                                                                                                           |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `bin/create.ts`             | The CLI. `npm install` compiles it into `dist/create.js`, which is what npx runs                                        |
| `template/`                 | A complete, working project named "B7 Stack", which the CLI copies                                                      |
| `template/b7-stack-desktop` | The desktop app, always present in the template and left out when declined                                              |
| `template/b7-stack-ui`      | The components the web and desktop apps share, left out with the desktop app                                            |
| `template-web-only/`        | The files that differ in a project without the desktop app, which keeps its components and API calls inside the web app |
| `.github/workflows/ci.yml`  | Scaffolds a project with and without the desktop app and runs each one's preflight                                      |

### Setup

```sh
npm install                  # builds the CLI and installs the git hooks
cd template && npm install   # the template works in place; then follow template/README.md
```

The repository's `.vscode` settings mirror the template's and point VS Code at the TypeScript copy inside `template/node_modules`, so editing the template from this checkout behaves like editing a generated project.

### Commands

| Command                 | What it does                                                                                                 |
| ----------------------- | ------------------------------------------------------------------------------------------------------------ |
| `npm run preflight`     | Every check below, in order                                                                                  |
| `npm run format:check`  | Checks formatting with Prettier; `npm run format` rewrites the files                                         |
| `npm run typecheck`     | Type-checks the CLI and the root config files                                                                |
| `npm run lint`          | Runs ESLint with the typed rules and the deprecated-API check; `npm run lint:fix` applies fixes              |
| `npm run lint:shell`    | Runs ShellCheck on the pre-commit hook                                                                       |
| `npm run lint:editor`   | Fails on `.vscode/settings.json` keys that the installed VS Code marks as deprecated                         |
| `npm run lint:variants` | Fails when a template file has changed and the web-only variant that mirrors it has not been brought in line |

These cover the root only; ESLint and Prettier ignore `template/` and `template-web-only/` here. Run the template's own checks from `template/`. On commit, Husky runs lint-staged, and staged files inside `template/` go through the template's lint-staged config.

### Trying the CLI

The CLI runs from source and asks the same questions as it does through npx. It creates the project in the directory it is run from, so run it from somewhere outside the checkout, with the path to yours in place of `/path/to`:

```sh
node /path/to/b7-stack/bin/create.ts
```

Pipe the answers in to skip the typing. This one sets the database port to 5433 and adds the desktop app:

```sh
printf '%s\n' "Demo App" "Trying things out." "5433" "yes" | node /path/to/b7-stack/bin/create.ts
```

To see what npx would install, list the package's files:

```sh
npm pack --dry-run
```

### Editing the template

The CLI copies `template/` file for file and replaces three strings everywhere, in file contents and in folder names:

| In the template           | In a generated project                  |
| ------------------------- | --------------------------------------- |
| `B7 Stack`                | the name as typed                       |
| `b7-stack`                | the slug derived from it, `sunnyradish` |
| `A new B7 Stack project.` | the description                         |

- Keep those three strings exact, and do not write `b7-stack` anywhere else in the template.
- `template/_gitignore` and `template/_npmrc` become `.gitignore` and `.npmrc` on copy, because npm drops files with those names when it packages the template for npx.
- `.env` files, `node_modules`, and build output inside `template/` are never copied. The `files` list in the root `package.json` leaves the same paths out of the package, so `npm pack` works in a checkout where the template has been installed or built.
- The dependencies in each `package.json` are sorted again once the names are in, because `@sunnyradish/shared` does not sort where `@b7-stack/shared` did, and npm would otherwise reorder them on its next install.
- A `|` in the name or the description is written as `\|` in a Markdown table row, where it would start a new cell.
- The generated project is formatted afterwards because the slug's length moves table columns and line breaks around.
- Skip `npm run clean` inside `template/`. Run from there, its `git clean` exclusions no longer cover the `.env` files of the workspaces.

### The desktop app in the template

The template is the project with the desktop app. In it the web and desktop apps share their components through `b7-stack-ui`, and the API client and the form logic through `b7-stack-shared`. A project without the desktop app has one app, so it keeps all of that inside `b7-stack-web`, as it would if the desktop app did not exist.

When the desktop app is declined, the CLI leaves out `template/b7-stack-desktop`, `template/b7-stack-ui`, `.vscode/launch.json`, and `apiClient.ts` and `noteActions.ts` in `b7-stack-shared/src`. The `desktopOnlyPaths` list in `bin/create.ts` names them. What a file contains then depends on four things, listed from the one to prefer to the one to avoid.

**Entries that remove themselves.** The CLI removes each reference to `b7-stack-desktop` or `b7-stack-ui` that is a whole entry on its own:

- the workspaces and the scripts for them in the root `package.json`;
- a line that is a quoted string in a list with one entry per line, a path in an ignore file, or a Markdown list item or table row;
- a quoted string later in a list written on one line, together with the comma before it.

**Markers.** Everything between a line containing `desktop:start` and the next line containing `desktop:end` is removed. Everything between `web-only:start` and `web-only:end` is kept instead, and removed when the desktop app is added. Write a web-only block inside a comment, so that it does nothing in the template:

```md
<!-- desktop:start -->

Shown with the desktop app.

<!-- desktop:end -->
<!-- web-only:start

Shown without it.

web-only:end -->
```

The marker lines themselves never reach a project. `template/README.md` pairs the two kinds of block wherever the projects differ, and `theme.css` in `b7-stack-ui` does the same in a CSS comment.

**Moved files.** `webOnlyMoves` in `bin/create.ts` lists files of `b7-stack-ui` that the project without the desktop app gets inside its web app: `StatusRow.tsx` goes to `app/_components`, and `theme.css` becomes `app/globals.css`.

**Variants.** A file in `template-web-only/` takes the place of the template's file at the same path, or is added where the template has none. These are the files that are wired differently, such as the components that import the server actions instead of taking them as props. A JSON file there is merged into the template's file instead, so that the versions in a `package.json` stay in one place: a key set to `null` is removed, an object is merged key by key, and any other value replaces the one in the template.

A variant is a second copy, so `template-web-only/variants.json` lists the template files that each one mirrors, with a hash of each. `npm run lint:variants` fails when one of those files has changed, and names the variant to look at. Make the same change there where it applies, then record the new hashes:

```sh
npm run lint:variants -- --update
```

A new variant needs an entry in `variants.json` with the template files it mirrors; give each an empty string and run the same command. JSON files are not listed. Prettier and ESLint do not run on `template-web-only/` in this repository, so scaffold a project without the desktop app and run its `npm run preflight` to check a change there, as CI does.

Any other line that names one of the two workspaces or `@b7-stack/ui`, and any unbalanced marker, makes the CLI stop with an error naming the file. CI also fails if the project without the desktop app contains the word "desktop" at all.

`package-lock.json` is copied whole, and the `npm install` that follows prunes it. Electron's binary is not part of that install: the `electron` package downloads it the first time the desktop app is started or packaged.

### Tooling notes

- Nothing in the repository is JavaScript. Config files are TypeScript that Node.js 26 loads directly, except that ESLint needs `jiti` to read `eslint.config.ts`.
- Node.js refuses to strip types from files under `node_modules`, where npx installs the package. The `prepare` script therefore compiles the CLI into `dist/`, which is gitignored and rebuilt on every install, including the one npx performs.
- The root and the template root keep TypeScript 6 because typescript-eslint cannot use TypeScript 7 yet.

### CI and Dependabot

CI runs the root preflight, installs the commit under test with npx exactly as a user would, scaffolds a project with and without the desktop app by piping the answers in, checks that no placeholder or marker survived, and runs each project's `npm run preflight`. The root preflight includes `lint:variants`. A broken template or CLI fails here first.

Dependabot updates the npm packages at the root and in the template, the Postgres image in the template, and the actions in this repository's workflow. Three things are left to do by hand:

- Bump the `uses:` versions in `template/.github/workflows/ci.yml`, which Dependabot cannot see.
- Raise the major version of `@types/node` when its runtime moves: Node.js for most of the repository, and the Node.js inside Electron for the desktop app. Raise TypeScript's major and minor versions by hand as well.
- Run `npm dedupe` in `template/` after updating by hand. npm can otherwise install a second copy of a package that one already present would satisfy, as it does with Rolldown after a fresh resolution.
