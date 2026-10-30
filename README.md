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

npx asks to install the package, then the CLI asks for a one-sentence description. The command then creates `sunnyradish/`, swaps the name and description in, writes `.env` files with local defaults, runs `git init`, installs dependencies, and formats the result with the project's own Prettier. The result runs straight away:

```sh
cd sunnyradish
npm run db:start && npm run db:migrate
npm run dev          # web app on http://localhost:3000
npm run dev:server   # API on http://localhost:4000
```

- The folder and package names come from the name, lowercased and with each run of characters other than letters and digits replaced by a hyphen: `"SunnyRadish"` gives `sunnyradish`, `@sunnyradish/shared`, `sunnyradish-server`, and `sunnyradish-web`.
- Pass `.` instead of a name to scaffold into the current directory, such as a freshly cloned empty repository. The folder name is offered as the project name, and `git init` is skipped when `.git` already exists.
- Pass `--description "..."` to skip the prompt, for example in scripts.
- Node.js 26 or newer is required.

The generated project ships a notes CRUD as a worked example of the whole path from PostgreSQL through Drizzle, Express, Zod, and Next.js server actions to React. Its README lists every script.

## Working on the template

`template/` is a complete project named "B7 Stack" and works in place: `cd template && npm install`, then follow its README. The CLI copies it file for file and replaces three strings everywhere, in file contents and in folder names:

| In the template           | In a generated project                  |
| ------------------------- | --------------------------------------- |
| `B7 Stack`                | the name as typed                       |
| `b7-stack`                | the slug derived from it, `sunnyradish` |
| `A new B7 Stack project.` | the description                         |

Keep those three strings exact when editing the template, and do not write `b7-stack` anywhere else in it. `template/_gitignore` and `template/_npmrc` become `.gitignore` and `.npmrc` on copy, because npm drops files with those names when it packages the template for `npx`. `.env` files, `node_modules`, and build output inside `template/` are never copied. The generated project is formatted afterwards because the slug's length moves table columns and line breaks around. Skip `npm run clean` inside `template/`: run from there, its `git clean` exclusions no longer cover `b7-stack-server/.env` and `b7-stack-web/.env`.

Try the CLI from a checkout with `node bin/create.js "Demo App" --description "Trying things out."`. CI does exactly that and then runs the generated project's `npm run preflight`, so a broken template fails here first. Dependabot updates the template's npm packages and Postgres image, and the actions in this repository's own workflow. It cannot see `template/.github/workflows/ci.yml`, so bump the `uses:` versions there by hand.
