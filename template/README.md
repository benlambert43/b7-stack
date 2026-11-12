# B7 Stack

A new B7 Stack project.

# Stack

- Frontend: Next.js
- API: Node.js + Express
- ORM: Drizzle
- Database: PostgreSQL
- Desktop: Electron, in `b7-stack-desktop`

# Development

Requires Node.js 26 (see `.nvmrc`), Docker, and [ShellCheck](https://www.shellcheck.net/) (`brew install shellcheck`).

1. A `.env` beside each `.env.template` was written with local defaults when the project was generated. On a fresh clone, copy each `.env.template` to `.env` beside it and fill in the values; the `POSTGRES_*` lines in the server file match the root file, so paste them across. `POSTGRES_PORT` is the port PostgreSQL listens on from your machine. Git ignores every `.env*` file except the templates.
2. `npm install` installs every workspace and sets up the Husky pre-commit hook.
3. `npm run db:start` starts PostgreSQL, waits until it accepts connections, and applies the migrations in `b7-stack-server/drizzle`.
4. `npm run dev` starts the web app; `npm run dev:server` starts the API.

Nothing is compiled during development. Node.js 26 runs the server's TypeScript directly, and the two shared packages are imported straight from their sources: `@b7-stack/shared` from `b7-stack-shared/src` and `@b7-stack/ui` from `b7-stack-ui/src`. Between the API and the web app, only the web app has a build step.

| Command                 | What it does                                                                                                                                                                         |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `npm run dev`           | Starts the Next.js dev server                                                                                                                                                        |
| `npm run dev:server`    | Starts the API with `node --watch`, restarting on changes to the server or shared sources                                                                                            |
| `npm run dev:desktop`   | Starts the desktop app in `b7-stack-desktop`: the window hot-reloads, and pressing `r` in the terminal restarts the main process                                                     |
| `npm run db:start`      | Starts PostgreSQL in Docker, waits until it is healthy, and applies pending migrations                                                                                               |
| `npm run db:stop`       | Stops PostgreSQL                                                                                                                                                                     |
| `npm run db:generate`   | Generates a SQL migration in `b7-stack-server/drizzle` from the Drizzle schema in `b7-stack-server/src/schema.ts`                                                                    |
| `npm run db:migrate`    | Applies pending migrations to a running database; `db:start` runs it for you                                                                                                         |
| `npm run db:studio`     | Opens Drizzle Studio to browse the database                                                                                                                                          |
| `npm run preflight`     | Everything CI runs: format check, typecheck, lint, ShellCheck, the editor-settings check, tests, and a web build; `preflight:no-build` skips the build                               |
| `npm run format`        | Formats the whole repository with Prettier; `format:check` only reports                                                                                                              |
| `npm run lint`          | Runs ESLint over the whole repository, including the React, accessibility, and Tailwind class rules and the deprecated-API check; `lint:fix` applies fixes                           |
| `npm run lint:shell`    | Runs ShellCheck over the shell scripts and the pre-commit hook with the settings in `.shellcheckrc`, which the ShellCheck editor extension reads too                                 |
| `npm run lint:editor`   | Fails on `.vscode/settings.json` keys that the installed VS Code or its extensions mark as deprecated; skipped where VS Code is absent, as in CI                                     |
| `npm run typecheck`     | Type-checks the root config files and scripts, then every workspace; the web one generates the Next.js route types first                                                             |
| `npm test`              | Runs Vitest across every workspace; `test:watch` watches, `test:coverage` reports coverage, and `test:shared`, `test:ui`, `test:server`, and `test:web` run one workspace            |
| `npm run build`         | Builds the web app                                                                                                                                                                   |
| `npm run build:desktop` | Packages the desktop app for this machine into `b7-stack-desktop/out`                                                                                                                |
| `npm run make:desktop`  | Packages the desktop app and zips it into `b7-stack-desktop/out/make`, ready to hand out                                                                                             |
| `npm run clean`         | Removes ignored files, dependencies, and the dev database. Refuses while uncommitted files exist; `clean:force` deletes them too and `clean:dry-run` previews. `.env` files are kept |
| `npm run reset`         | Rebuilds the development environment: cleans, reinstalls, and starts the database with its migrations                                                                                |

The pre-commit hook runs lint-staged on the staged files: every workspace is type-checked, ESLint and Prettier fix what they can, the tests that cover the staged files run, and staged shell scripts go through ShellCheck. CI runs the same checks as `npm run preflight`, split into parallel jobs.

## Shared components

`b7-stack-ui` holds the components that look and behave the same wherever they are shown, so that an app only has to decide what data they get and what happens when they are used.

- Components take their data and their actions as props. They never fetch, read the environment, or import a framework, and ESLint refuses `next` and `node:` imports in the package. `NoteList` is given `notes`; `NoteForm` and `NoteItem` are given the functions to call, typed as `CreateNoteAction`, `UpdateNoteAction`, and `DeleteNoteAction` in `b7-stack-shared/src/noteActions.ts`.
- What the note forms do and how the API is called live in `b7-stack-shared`, beside the schemas, so that no app writes them a second time. `src/noteActions.ts` has `submitNewNote`, `submitNoteEdit`, and `submitNoteDelete`, which parse the input with the shared schemas, call the API, and return failures as values. `src/apiClient.ts` has `createApiClient`, which each app gives its API address. That package runs in Node.js and in browser windows alike, so ESLint refuses the globals that only a browser has there. An app adds only what is its own, such as the web app's server actions refreshing the page after a change.
- The web app supplies those from the server. `app/_components/Notes.tsx` loads the notes in a server component and passes the server actions in `app/_actions/notes.ts`. That is what the Next.js server is for: caching and what search engines see. The rules for a note stay in the API.
- The desktop app supplies them from the window. `b7-stack-desktop/src/renderer/Notes.tsx` fetches the notes itself and passes functions that call the API directly.
- Components with state or event handlers start with `"use client"`, which lets the App Router render them from server components. The others have no directive, so they can render on the server as well.
- `src/theme.css` is the one place for colors and fonts, and it tells Tailwind to scan the package for class names. Each app's `globals.css` imports it after `tailwindcss`, and each app provides the fonts behind `--font-geist-sans` and `--font-geist-mono` in its own way.
- The package has no build step. The apps compile it from source, as they do `@b7-stack/shared`, so an edit hot-reloads in every app that is running.
- A shared component's tests sit beside it and run in jsdom with Testing Library; `npm run test:ui` runs them alone.

A component belongs in `b7-stack-ui` when more than one app shows it, or could. Create it in `src`, export it from `src/index.ts`, and import it from `@b7-stack/ui`. Pages and the components that load data stay in the app they belong to.

## Search engines and link previews

The web app describes itself to search engines and to the apps that show a preview when a link is pasted into them. All of it is prerendered when the app is built.

- `app/_lib/site.ts` holds the name and the description, which the layout, the home page, and the preview image all read, and `siteUrl()`, the public address from `SITE_URL` in `b7-stack-web/.env`. That address is compiled into the pages, so a production build needs the real one in its environment and fails without any. CI builds with a local address, only to prove that the app builds.
- `app/layout.tsx` sets what every page shares: the base address, the title and its template, the description, and the Open Graph and Twitter card settings. A page that exports `metadata` with a `title` of `About` is titled `About | B7 Stack`.
- Each page states its own address. `app/page.tsx` sets `alternates.canonical` and `openGraph.url`, and spreads `siteOpenGraph` into the latter because a page's `openGraph` replaces the layout's instead of merging with it. Do the same in every new page.
- `app/opengraph-image.tsx` draws the 1200 by 630 preview image from the name and the description, and Next.js attaches it to every page for both Open Graph and Twitter. An `opengraph-image.tsx` in a route's folder gives that route its own.
- `app/robots.ts` lets crawlers in and points them at the sitemap from `app/sitemap.ts`, which lists the pages. Add each new public page to that list.

## Tooling notes

- Two TypeScript versions are installed on purpose. The workspaces type-check with TypeScript 7, the native compiler, which `next build` also uses. The root keeps TypeScript 6 because typescript-eslint's type-aware rules still need the JavaScript compiler API, and VS Code uses that copy too (`typescript.tsdk` in `.vscode/settings.json`) because the TypeScript 7 package ships no language server. Dependabot leaves TypeScript alone for the same reason; bump it by hand.
- ESLint, Prettier, and lint-staged are configured once at the repository root and cover every workspace; run them from the root, where they also honor `.gitignore`. Vitest's root config lists the workspace projects, each of which keeps its own `vitest.config.ts`. Every config file is TypeScript: Node 26 loads them directly, and ESLint reads `eslint.config.ts` through `jiti`.
- A passing `npm run preflight` should leave nothing underlined in VS Code. ESLint fails on deprecated APIs through `@typescript-eslint/no-deprecated` and lints Tailwind classes with `eslint-plugin-better-tailwindcss`, which implements the same checks as the Tailwind CSS IntelliSense extension (canonical classes, conflicting classes, variant order); `.vscode/settings.json` turns off the three IntelliSense lints that ESLint now reports. Prettier wraps long class lists, so the plugin's line-wrapping rule is the one rule switched off: the two cannot both be satisfied. The web app gets its React and accessibility rules from `eslint-config-next`; React code outside it is held to the React, hooks, and accessibility rule sets of the same plugins, and may not use Node.js globals. ShellCheck reads `.shellcheckrc`, so a script checked on its own in the editor follows `scripts/lib.sh` just as `lint:shell` does. `lint:editor` reads the settings schemas of the installed VS Code and its extensions, so a key in `.vscode/settings.json` that VS Code marks as deprecated fails preflight instead of only showing a warning in the editor.
- The `overrides` entry in `package.json` points every `eslint` peer dependency at the root ESLint 10. Some plugins bundled with `eslint-config-next` still declare ESLint 9 as their peer, although Next.js supports ESLint 10 with them. The other entry is for `@esbuild-kit/core-utils`, a deprecated package that `drizzle-kit` still lists but never loads: it lets that package share the esbuild already installed instead of adding an old release with a known advisory.
- `allowScripts` in `package.json` is npm's install-script policy and names the packages whose install scripts may run. When `npm install` reports an unreviewed package, look at what its script does and run `npm install-scripts approve <package>`. `npm install-scripts prune` drops the entries that an update has made unnecessary.
- `.vscode/launch.json` starts the API or an app under the VS Code debugger from Run and Debug. Breakpoints in the TypeScript sources bind in the Node.js processes, such as the API and the Next.js server; code that runs in a browser window is debugged with the window's developer tools.

<!-- desktop:start -->

## Desktop app

`b7-stack-desktop` is an Electron app that shows the same page as the web app, built from the same components. Its window is a React app compiled by Vite that calls the API directly: the server that sits between the web app and the API is there for caching and search engines, which a desktop app has no use for. The main process owns the window and its security rules, and answers the window over a small typed bridge.

```text
window (React, sandboxed) → API
window → window.bridge → preload script → IPC → main process
```

Run `npm run dev:server` beside `npm run dev:desktop` to see data. `npm run test:desktop` runs its tests. `npm run preflight` packages the app after the web build, and CI packages it in a job of its own.

| File                                         | What it holds                                                                                                                    |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `src/renderer/api.ts`                        | The shared API client, pointed at `VITE_API_BASE_URL`                                                                            |
| `src/renderer/Notes.tsx`, `StatusChecks.tsx` | Load the data and hand it to the shared components                                                                               |
| `src/env.ts`                                 | The environment, parsed with Zod when the app starts                                                                             |
| `src/bridge.ts`                              | The `Bridge` interface, which lists every call the window can make to the main process; the two files below are typed against it |
| `src/preload/index.ts`                       | Exposes one function per `Bridge` method as `window.bridge`, and nothing else                                                    |
| `src/main/handlers.ts`                       | Implements each method                                                                                                           |
| `src/main/index.ts`                          | The window, and the security rules listed below                                                                                  |

The bridge is for what only the main process can do, such as the app version it reports today. To add a call, add it to `Bridge`. TypeScript then fails until the preload script exposes it and `handlers.ts` implements it.

`VITE_API_BASE_URL` in `b7-stack-desktop/.env` is compiled into the app, so a release build needs the production address in the environment or in `.env.production`; packaging fails without a valid one. CI packages with a local address, only to prove that the app builds. The API answers the window only when it knows where the window is served from, which is what `EXTRA_ALLOWED_ORIGINS` in `b7-stack-server/.env` lists: `http://localhost:5173` for the dev server and `app://renderer` for the packaged app. The server reduces each entry to the origin a browser sends, so a trailing slash or capital letters do no harm. `npm run build:desktop` produces an unsigned app with the default icon. Signing, notarization, installers, an icon, a bundle identifier of your own, and updates are all [Electron Forge](https://www.electronforge.io) configuration, to add in `forge.config.ts` when the app ships.

- Electron Forge runs development, packaging, and distribution, with its Vite plugin doing the bundling from the three config files that Forge documents: `vite.main.config.ts`, `vite.preload.config.ts`, and `vite.renderer.config.ts`. Forge emits the first two as CommonJS: a sandboxed preload script cannot load ES modules.
- In development the window hot-reloads, including after an edit to `b7-stack-shared` or `b7-stack-ui`, and a change to the preload script reloads it. A change to the main process is rebuilt at once but takes effect when the app restarts: press `r` in the terminal that runs `npm run dev:desktop`, a key that Forge lists at the bottom of its screen. Where that screen cannot draw, such as in a terminal that is not interactive, type `rs` and Enter instead. Forge's Vite plugin has a `hotRestart` option meant to do that by itself, which does not restart the app as of Forge 8.0.1; turn it on in `forge.config.ts` once it does. Stack traces from the main process point at the TypeScript source. The dev server is fixed to port 5173, because that address is on the API's list.
- Imports inside the app start from `src` with `@/`, as they start from the app folder in the web app.
- The window has no access to Node.js or Electron. Every renderer is sandboxed and context-isolated, and the preload script exposes named functions instead of `ipcRenderer`. The main process accepts calls only from the app's own page. ESLint keeps `electron`, `node:` modules, Node.js globals, and the main process's own files out of `src/renderer`. TypeScript draws the same line: `src/renderer/tsconfig.json` checks the window's code without the Node.js types, and `tsconfig.json` checks everything else without the DOM types.
- A packaged app loads its window from `app://renderer`, a protocol the main process serves from the app's own files, since `file://` pages have no origin to build rules on. The page gets a `Content-Security-Policy` that lets it load its own files, connect to the API's address, and show `data:` images, with no plugins, `<base>` element, or form posts, and with inline scripts and styles allowed only for Vite's dev server. `src/contentSecurityPolicy.ts` builds it, Vite's dev server sends it in development, and the `app://` handler sends it with every file of a packaged app. Navigation away from the app and new windows are refused, and `https` addresses, whether from a link or `window.open`, open in the default browser. Permissions are refused too, both when the page asks for one and when Chromium only checks it, except writing to the clipboard and going fullscreen; add to `grantedPermissions` in `src/main/index.ts` as the app needs more.
- The shared Zod schemas work in the window as they do in the browser. `src/renderer/zod.ts` runs first and switches Zod to interpreting its schemas, because the compiled parsers it prefers need `eval`, which the Content-Security-Policy forbids. The main process has no such policy and keeps the compiled parsers.
- Only one copy of the app runs. A second launch brings the first one's window forward instead. The app started by `npm run dev:desktop` keeps its own data folder, with `(development)` after the name, so it runs beside an installed copy.
- The fuses in `forge.config.ts` are flipped when the app is packaged. They stop the binary from running as plain Node.js or taking debugger and `NODE_OPTIONS` flags, and make it load code only from `app.asar`. On macOS and Windows it also verifies that archive before loading it; Electron has no such check on Linux.
- Startup does as little as possible. Each process loads one bundled file, compiled for the Chromium and Node.js that Electron ships rather than for older browsers. Geist is bundled with the app instead of fetched, `app://` is registered so that V8 keeps the window's compiled script from the first launch on, and the window opens at once in the page's background color.
- `@types/node` is held at 24 here because Electron 45 embeds Node.js 24, whatever runs the rest of the repository. Dependabot is told to leave major versions of `@types/node` alone for that reason, so raise each one by hand when its runtime moves: this one when an Electron upgrade brings a newer Node.js.
- `npm install` does not download Electron. The `electron` package fetches its binary the first time the app is started or packaged, and caches it for later installs.
- The default application menu stays, because on macOS it is what makes copy, paste, and undo work in text fields. Replace it with your own rather than removing it.

<!-- desktop:end -->
