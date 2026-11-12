# b7-stack

A one-command starting point for new projects. Every project gets the same stack, so the only inputs are a name, a description, and whether to add a desktop app.

| Part               | What you get                                                                                                              |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| Web                | Next.js (App Router, Cache Components, React Compiler), Tailwind CSS, Testing Library                                     |
| API                | Express 5 on Node.js 26, running TypeScript directly with no build step                                                   |
| Data               | PostgreSQL in Docker, Drizzle ORM with SQL migrations                                                                     |
| Shared             | Zod schemas, types, and the API client, used by the API and every app                                                     |
| UI                 | React components and the Tailwind theme, in a package the apps share                                                      |
| Desktop (optional) | Electron with Electron Forge and Vite, built from the same components as the web app and calling the API directly         |
| Tooling            | npm workspaces, TypeScript 7, ESLint, Prettier, Vitest, Husky with lint-staged, ShellCheck, Dependabot, GitHub Actions CI |

A generated project ships a notes CRUD as a worked example of the whole path, from PostgreSQL through Drizzle, Express, Zod, and Next.js server actions to React components that every app shares. Its own README lists every script.

## Quick start

Requires Node.js 26 or newer, Git, and Docker for the database. SunnyRadish is the example name used throughout; put your own in its place.

```sh
npx --allow-git=all github:benlambert43/b7-stack "SunnyRadish"
```

npm 12 and newer refuse packages fetched from Git with `npm error code EALLOWGIT` unless `--allow-git=all` is given. Older versions of npm do not need the flag.

npx asks to install the package, and the CLI then asks for whatever was not given: a one-sentence description and whether to add a desktop app. When it finishes, the project runs straight away:

```sh
cd sunnyradish
npm run db:start      # PostgreSQL in Docker, migrations applied
npm run dev           # web app on http://localhost:3000
npm run dev:server    # API on http://localhost:4000
npm run dev:desktop   # desktop app, in a project created with --desktop
```

## Options

```text
npx github:benlambert43/b7-stack [name | .] [--description <text>] [--db-port <port>] [--desktop | --no-desktop]
```

| Argument                     | What it does                                                                                                                                         |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `name`                       | Display name of the project. The folder and package names are derived from it. Asked for when left out                                               |
| `.`                          | Scaffolds into the current directory instead of a new folder, and offers the folder's name as the project name                                       |
| `--description <text>`, `-d` | One sentence for the README, `package.json`, and the home page. Asked for when left out                                                              |
| `--db-port <port>`           | Host port for the PostgreSQL container, from 1 to 65535. Defaults to 5432. Give each project its own to run their databases side by side             |
| `--desktop`                  | Adds `sunnyradish-desktop`, an Electron app that shows the same notes page as the web app. Asked about when neither this nor `--no-desktop` is given |
| `--no-desktop`               | Leaves the desktop app out without asking                                                                                                            |
| `--help`, `-h`               | Prints the usage and exits                                                                                                                           |

### Examples

Answer the prompts for the description and the desktop app:

```sh
npx --allow-git=all github:benlambert43/b7-stack "SunnyRadish"
```

Give everything up front, so that nothing is asked:

```sh
npx --allow-git=all github:benlambert43/b7-stack "SunnyRadish" --description "Notes for gardeners." --no-desktop
```

Add the desktop app, and publish PostgreSQL on a port other than 5432:

```sh
npx --allow-git=all github:benlambert43/b7-stack "SunnyRadish" -d "Notes for gardeners." --desktop --db-port 5433
```

Scaffold into the current directory, such as a freshly cloned empty repository:

```sh
npx --allow-git=all github:benlambert43/b7-stack . --description "Notes for gardeners." --no-desktop
```

Print the usage:

```sh
npx --allow-git=all github:benlambert43/b7-stack --help
```

### Rules

- **Names.** The name is lowercased and each run of characters other than letters and digits becomes a hyphen. `"SunnyRadish"` gives `sunnyradish`, `@sunnyradish/shared`, `@sunnyradish/ui`, `sunnyradish-server`, and `sunnyradish-web`; `"Demo App"` gives `demo-app`.
- **Characters.** The name and the description may not contain `"`, `\`, or control characters, which would break the files they are written into. With `--desktop` the name may not contain `* / : < > ? |` either, which Windows does not allow in file names.
- **Target folder.** It must be new, or hold nothing but what GitHub adds to a new repository: `.git`, `.gitignore`, `.gitattributes`, `LICENSE`, and `README.md`. The template's `.gitignore`, `.gitattributes`, and `README.md` replace the ones already there.
- **Without a terminal**, as in a script or CI, nothing can be asked. Pass the name and `--description`; the desktop app is left out unless `--desktop` is given.

### What the command does

1. Copies the template into `sunnyradish/` and swaps the name and the description in.
2. Writes a `.env` beside each `.env.template` with local defaults: the slug as the database user and name, a random password, and the port from `--db-port`.
3. Runs `git init` with `main` as the branch, unless `.git` already exists.
4. Runs `npm install`, then formats the project with its own Prettier.

If a step fails, the files stay in the folder and the error says where they are.

## Working on this repository

| Path                        | What it holds                                                                      |
| --------------------------- | ---------------------------------------------------------------------------------- |
| `bin/create.ts`             | The CLI. `npm install` compiles it into `dist/create.js`, which is what npx runs   |
| `template/`                 | A complete, working project named "B7 Stack", which the CLI copies                 |
| `template/b7-stack-desktop` | The desktop app, always present in the template and copied only with `--desktop`   |
| `.github/workflows/ci.yml`  | Scaffolds a project with and without the desktop app and runs each one's preflight |

### Setup

```sh
npm install                  # builds the CLI and installs the git hooks
cd template && npm install   # the template works in place; then follow template/README.md
```

The repository's `.vscode` settings mirror the template's and point VS Code at the TypeScript copy inside `template/node_modules`, so editing the template from this checkout behaves like editing a generated project.

### Commands

| Command                | What it does                                                                                    |
| ---------------------- | ----------------------------------------------------------------------------------------------- |
| `npm run preflight`    | Every check below, in order                                                                     |
| `npm run format:check` | Checks formatting with Prettier; `npm run format` rewrites the files                            |
| `npm run typecheck`    | Type-checks the CLI and the root config files                                                   |
| `npm run lint`         | Runs ESLint with the typed rules and the deprecated-API check; `npm run lint:fix` applies fixes |
| `npm run lint:shell`   | Runs ShellCheck on the pre-commit hook                                                          |
| `npm run lint:editor`  | Fails on `.vscode/settings.json` keys that the installed VS Code marks as deprecated            |

These cover the root only; ESLint and Prettier ignore `template/` here. Run the template's own checks from `template/`. On commit, Husky runs lint-staged, and staged files inside `template/` go through the template's lint-staged config.

### Trying the CLI

The CLI runs from source and takes the same arguments as it does through npx. It creates the project in the directory it is run from, so run it from somewhere outside the checkout, with the path to yours in place of `/path/to`:

```sh
node /path/to/b7-stack/bin/create.ts "Demo App" --description "Trying things out." --no-desktop
node /path/to/b7-stack/bin/create.ts "Demo App" --description "Trying things out." --desktop --db-port 5433
node /path/to/b7-stack/bin/create.ts --help
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
- The generated project is formatted afterwards because the slug's length moves table columns and line breaks around.
- Skip `npm run clean` inside `template/`. Run from there, its `git clean` exclusions no longer cover the `.env` files of the workspaces.

### The desktop app in the template

Without `--desktop` the CLI leaves `template/b7-stack-desktop` out and removes what refers to it elsewhere:

- everything between a line containing `desktop:start` and the next line containing `desktop:end`;
- the workspace and the scripts for it in the root `package.json`;
- each line that names `b7-stack-desktop` and is a whole entry on its own: a quoted string in a list with one entry per line, a path in an ignore file, or a Markdown list item or table row.

With `--desktop` it removes only the marker lines. So whatever the desktop app needs outside its own folder must be one of those lines, as the ignore files, the Vitest project list, and the README's tables are, or sit between markers, as the ESLint block and the CI job do.

Any other line that names the folder, and any unbalanced marker, makes the CLI stop with an error naming the file. CI also fails if the project without the desktop app contains the word "desktop" at all.

`package-lock.json` is copied whole, and the `npm install` that follows prunes it. Electron's binary is not part of that install: the `electron` package downloads it the first time the desktop app is started or packaged.

### Tooling notes

- Nothing in the repository is JavaScript. Config files are TypeScript that Node.js 26 loads directly, except that ESLint needs `jiti` to read `eslint.config.ts`.
- Node.js refuses to strip types from files under `node_modules`, where npx installs the package. The `prepare` script therefore compiles the CLI into `dist/`, which is gitignored and rebuilt on every install, including the one npx performs.
- The root and the template root keep TypeScript 6 because typescript-eslint cannot use TypeScript 7 yet.

### CI and Dependabot

CI runs the root preflight, installs the commit under test with npx exactly as a user would, scaffolds a project with and without `--desktop`, checks that no placeholder or marker survived, and runs each project's `npm run preflight`. A broken template or CLI fails here first.

Dependabot updates the npm packages at the root and in the template, the Postgres image in the template, and the actions in this repository's workflow. Three things are left to do by hand:

- Bump the `uses:` versions in `template/.github/workflows/ci.yml`, which Dependabot cannot see.
- Raise the major version of `@types/node` when its runtime moves: Node.js for most of the repository, and the Node.js inside Electron for the desktop app. Raise TypeScript's major and minor versions by hand as well.
- Run `npm dedupe` in `template/` after updating by hand. npm can otherwise install a second copy of a package that one already present would satisfy, as it does with Rolldown after a fresh resolution.
