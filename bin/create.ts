#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
import { styleText } from "node:util";

const templateDir = path.join(import.meta.dirname, "..", "template");
const webOnlyDir = path.join(import.meta.dirname, "..", "template-web-only");

const placeholders = {
  description: "A new B7 Stack project.",
  name: "B7 Stack",
  slug: "b7-stack",
};

const desktopWorkspaces = [
  `${placeholders.slug}-desktop`,
  `${placeholders.slug}-ui`,
];
const desktopNames = [...desktopWorkspaces, `@${placeholders.slug}/ui`];
const desktopOnlyPaths = new Set([
  ...desktopWorkspaces,
  path.join(".vscode", "launch.json"),
  path.join(`${placeholders.slug}-shared`, "src", "apiClient.ts"),
  path.join(`${placeholders.slug}-shared`, "src", "noteActions.ts"),
]);
const webOnlyMoves = new Map([
  [
    path.join(`${placeholders.slug}-ui`, "src", "StatusRow.tsx"),
    path.join(
      `${placeholders.slug}-web`,
      "app",
      "_components",
      "StatusRow.tsx",
    ),
  ],
  [
    path.join(`${placeholders.slug}-ui`, "src", "theme.css"),
    path.join(`${placeholders.slug}-web`, "app", "globals.css"),
  ],
]);
const webOnlyMoveTargets = new Set(webOnlyMoves.values());
const variantManifest = "variants.json";
const desktopWorkspacePattern = `(?:${desktopWorkspaces.join("|")})`;
const lineEnd = String.raw`(?:\r?\n|(?![\s\S]))`;
const blockOf = (name: string) =>
  new RegExp(
    String.raw`^.*${name}:start.*\r?\n[\s\S]*?^.*${name}:end.*` + lineEnd,
    "gm",
  );
const markerOf = (name: string) =>
  new RegExp(String.raw`^.*${name}:(?:start|end).*` + lineEnd, "gm");
const desktopBlock = blockOf("desktop");
const desktopMarker = markerOf("desktop");
const webOnlyBlock = blockOf("web-only");
const webOnlyMarker = markerOf("web-only");
const removableDesktopLine = new RegExp(
  String.raw`^(?:[ \t]*["'][^"'\n]*${desktopWorkspacePattern}[^"'\n]*["'],?[ \t]*|[^\s]*${desktopWorkspacePattern}[^\s]*|[ \t]*(?:[-*|]|\d+\.)[ \t].*${desktopWorkspacePattern}.*)` +
    lineEnd,
  "gm",
);
const removableDesktopEntry = new RegExp(
  String.raw`,[ \t]*(["'])[^"'\n]*${desktopWorkspacePattern}[^"'\n]*\1`,
  "g",
);
const unsupportedCharacters = /["\\\p{Cc}]/u;
const unsupportedDesktopNameCharacters = /[*/:<>?|]/;

const renamedFiles = new Map([
  ["_gitignore", ".gitignore"],
  ["_npmrc", ".npmrc"],
]);

const skippedFiles = new Set([
  "node_modules",
  ".next",
  ".vite",
  "out",
  "coverage",
  ".env",
  ".DS_Store",
  "next-env.d.ts",
  "tsconfig.tsbuildinfo",
]);

const starterFiles = new Set([
  ".git",
  ".gitattributes",
  ".gitignore",
  ".DS_Store",
  "LICENSE",
  "README.md",
]);

function fail(message: string): never {
  console.error(styleText("red", message, { stream: process.stderr }));
  process.exit(1);
}

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

if (process.argv.length > 2) {
  fail(
    "This command takes no arguments. Run it without any and answer its questions.",
  );
}

const nodeMajor = Number.parseInt(process.versions.node, 10);
if (nodeMajor < 26) {
  fail(`Node.js 26 or newer is required; this is ${process.version}.`);
}

const terminal = process.stdin.isTTY ? process.stdout.isTTY : false;
const prompt = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal,
});
const answers = prompt[Symbol.asyncIterator]();

async function ask(question: string, defaultValue = "") {
  const hint = defaultValue ? ` (${defaultValue})` : "";
  const text = `${question}${hint}: `;
  for (;;) {
    if (terminal) {
      prompt.setPrompt(text);
      prompt.prompt();
    } else {
      process.stdout.write(text);
    }
    const line = await answers.next();
    if (line.done) {
      fail(`\nThe input ended before "${question}" was answered.`);
    }
    const answer = line.value.trim() || defaultValue;
    if (!process.stdin.isTTY) {
      console.log(answer);
    }
    if (answer) {
      return answer;
    }
  }
}

const nameAnswer = await ask("Project name, or . to use the current directory");
const inPlace = nameAnswer === ".";
const name = inPlace
  ? await ask("Project name", path.basename(process.cwd()))
  : nameAnswer;
if (unsupportedCharacters.test(name)) {
  fail(
    `"${name}" contains a character that cannot be used in the project name: " \\ or a control character`,
  );
}
const slug = slugify(name);
if (!slug) {
  fail(`"${name}" has no letters or digits to name the packages after.`);
}
const description = await ask("Description");
if (unsupportedCharacters.test(description)) {
  fail(
    `The description contains a character that cannot be used in it: " \\ or a control character`,
  );
}
const dbPort = await ask("Database port", "5432");
if (!/^\d+$/.test(dbPort) || Number(dbPort) < 1 || Number(dbPort) > 65535) {
  fail(`The database port must be a number from 1 to 65535, got "${dbPort}".`);
}
const desktopAnswer = await ask("Add an Electron desktop app?", "yes");
if (!/^(?:y|yes|n|no)$/i.test(desktopAnswer)) {
  fail(`Answer yes or no to the desktop app, got "${desktopAnswer}".`);
}
const desktop = /^y/i.test(desktopAnswer);
prompt.close();
if (desktop && unsupportedDesktopNameCharacters.test(name)) {
  fail(
    `"${name}" contains a character that cannot be used in the name of a project with a desktop app: * / : < > ? |`,
  );
}
const targetDir = inPlace ? process.cwd() : path.resolve(slug);

if (fs.existsSync(targetDir)) {
  if (!fs.statSync(targetDir).isDirectory()) {
    fail(`${targetDir} is a file.`);
  }
  const occupants = fs
    .readdirSync(targetDir)
    .filter((entry) => !starterFiles.has(entry));
  if (occupants.length > 0) {
    fail(`${targetDir} already contains: ${occupants.join(", ")}`);
  }
}

const replacements = new Map([
  [placeholders.description, description],
  [placeholders.name, name],
  [placeholders.slug, slug],
]);
const escapeRegExp = (text: string) =>
  text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const placeholderPattern = new RegExp(
  [...replacements.keys()].map(escapeRegExp).join("|"),
  "g",
);
const fill = (text: string) =>
  text.replace(placeholderPattern, (match) => replacements.get(match) ?? match);

type Json = null | boolean | number | string | Json[] | { [key: string]: Json };

function isJsonObject(value: Json): value is Record<string, Json> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function mergePatch(target: Json, patch: Json): Json {
  if (!isJsonObject(patch)) {
    return patch;
  }
  const merged = new Map(Object.entries(isJsonObject(target) ? target : {}));
  for (const [key, value] of Object.entries(patch)) {
    if (value === null) {
      merged.delete(key);
    } else {
      merged.set(key, mergePatch(merged.get(key) ?? null, value));
    }
  }
  return Object.fromEntries(merged);
}

function applyWebOnly(relative: string, text: string) {
  const variant = path.join(webOnlyDir, relative);
  if (!fs.existsSync(variant)) {
    return text;
  }
  const variantText = fs.readFileSync(variant, "utf8");
  if (path.extname(relative) !== ".json") {
    return variantText;
  }
  const merged = mergePatch(
    JSON.parse(text) as Json,
    JSON.parse(variantText) as Json,
  );
  return `${JSON.stringify(merged, null, 2)}\n`;
}

function checkMarkers(relative: string, text: string) {
  for (const name of ["desktop", "web-only"]) {
    const markers = [
      ...text.matchAll(new RegExp(`${name}:(start|end)`, "g")),
    ].map(([, kind]) => kind);
    if (markers.some((kind, index) => kind !== (index % 2 ? "end" : "start"))) {
      fail(`${relative} has unbalanced ${name}:start and ${name}:end markers.`);
    }
  }
}

function selectVariant(relative: string, text: string) {
  if (path.basename(relative) === "package-lock.json") {
    return text;
  }
  checkMarkers(relative, text);
  return desktop
    ? text.replace(webOnlyBlock, "").replace(desktopMarker, "")
    : removeDesktop(relative, text);
}

function removeDesktop(relative: string, text: string) {
  if (relative === "package.json") {
    const manifest = JSON.parse(text) as {
      workspaces: string[];
      scripts: Record<string, string>;
    };
    manifest.workspaces = manifest.workspaces.filter(
      (workspace) => !desktopWorkspaces.includes(workspace),
    );
    manifest.scripts = Object.fromEntries(
      Object.entries(manifest.scripts).filter(
        ([, command]) =>
          !desktopWorkspaces.some((workspace) => command.includes(workspace)),
      ),
    );
    return `${JSON.stringify(manifest, null, 2)}\n`;
  }
  const stripped = text
    .replace(desktopBlock, "")
    .replace(webOnlyMarker, "")
    .replace(removableDesktopLine, "")
    .replace(removableDesktopEntry, "");
  const leftover = stripped
    .split("\n")
    .find((line) => desktopNames.some((name) => line.includes(name)));
  if (leftover !== undefined) {
    fail(
      `${relative}: "${leftover.trim()}" names a workspace that only a project with the desktop app has, but is not a list entry, an ignore path, or a Markdown list item or table row. Put it between desktop:start and desktop:end markers, or give the file a variant in template-web-only.`,
    );
  }
  return stripped;
}

function copyTemplate(
  sourceDir: string,
  destinationDir: string,
  rootDir = sourceDir,
) {
  fs.mkdirSync(destinationDir, { recursive: true });
  for (const entry of fs.readdirSync(sourceDir, { withFileTypes: true })) {
    const source = path.join(sourceDir, entry.name);
    const relative = path.relative(rootDir, source);
    const fromTemplate = rootDir === templateDir;
    if (
      skippedFiles.has(entry.name) ||
      (!desktop && desktopOnlyPaths.has(relative)) ||
      (!desktop && fromTemplate && webOnlyMoveTargets.has(relative)) ||
      (!fromTemplate && relative === variantManifest)
    ) {
      continue;
    }
    const destination = path.join(
      destinationDir,
      renamedFiles.get(entry.name) ?? fill(entry.name),
    );
    if (entry.isDirectory()) {
      copyTemplate(source, destination, rootDir);
      continue;
    }
    if (!fromTemplate && fs.existsSync(path.join(templateDir, relative))) {
      continue;
    }
    const content = fs.readFileSync(source);
    if (content.includes(0)) {
      fs.writeFileSync(destination, content, {
        mode: fs.statSync(source).mode,
      });
      continue;
    }
    const text = content.toString("utf8");
    const selected = selectVariant(
      relative,
      !desktop && fromTemplate ? applyWebOnly(relative, text) : text,
    );
    fs.writeFileSync(destination, fill(selected), {
      mode: fs.statSync(source).mode,
    });
  }
}

function writeEnvFiles(projectDir: string) {
  const envValues = new Map([
    ["<username>", slug],
    ["<password>", randomBytes(16).toString("hex")],
    ["<database_name>", slug],
  ]);
  const envTemplates = fs
    .readdirSync(projectDir, { encoding: "utf8", recursive: true })
    .filter((file) => path.basename(file) === ".env.template");
  for (const file of envTemplates) {
    const envFile = file.replace(/\.template$/, "");
    const env = fs
      .readFileSync(path.join(projectDir, file), "utf8")
      .replace(/<[a-z_]+>/g, (match) => envValues.get(match) ?? match)
      .replace(/^POSTGRES_PORT=.*$/m, `POSTGRES_PORT=${dbPort}`);
    fs.writeFileSync(path.join(projectDir, envFile), env);
    const unfilled = env.match(/<[a-z_]+>/g);
    if (unfilled) {
      console.log(
        styleText("yellow", `  ${envFile} still needs: ${unfilled.join(", ")}`),
      );
    }
  }
  return envTemplates.length;
}

function run(command: string, commandArgs: string[]) {
  console.log(styleText("bold", `\n▶ ${command} ${commandArgs.join(" ")}`));
  try {
    execFileSync(command, commandArgs, {
      cwd: targetDir,
      stdio: "inherit",
      shell: process.platform === "win32",
    });
  } catch {
    fail(`\n${command} failed. The project files are in ${targetDir}.`);
  }
}

console.log(styleText("bold", `\n▶ Creating ${name} in ${targetDir}`));
copyTemplate(templateDir, targetDir);
if (!desktop) {
  copyTemplate(webOnlyDir, targetDir);
  for (const [from, to] of webOnlyMoves) {
    const text = fs.readFileSync(path.join(templateDir, from), "utf8");
    fs.writeFileSync(
      path.join(targetDir, fill(to)),
      fill(selectVariant(to, text)),
    );
  }
}
const envCount = writeEnvFiles(targetDir);
console.log(
  `  copied the template and wrote ${String(envCount)} .env files with local defaults`,
);

if (!fs.existsSync(path.join(targetDir, ".git"))) {
  run("git", ["init", "--quiet", "--initial-branch=main"]);
}
run("npm", ["install"]);
run("npm", ["run", "format", "--silent", "--", "--log-level", "warn"]);

const desktopStep = desktop
  ? "\n  npm run dev:desktop   desktop app, which calls the API"
  : "";

console.log(`
${styleText("green", "✔")} ${styleText("bold", name)} is ready. Next:
${inPlace ? "" : `\n  cd ${slug}`}
  npm run db:start      PostgreSQL in Docker on port ${dbPort}, migrations applied
  npm run dev           web app on http://localhost:3000
  npm run dev:server    API on http://localhost:4000${desktopStep}
`);
