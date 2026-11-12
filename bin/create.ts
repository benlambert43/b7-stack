#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
import { styleText } from "node:util";

const templateDir = path.join(import.meta.dirname, "..", "template");

const placeholders = {
  description: "A new B7 Stack project.",
  name: "B7 Stack",
  slug: "b7-stack",
};

const desktopWorkspace = `${placeholders.slug}-desktop`;
const lineEnd = String.raw`(?:\r?\n|(?![\s\S]))`;
const desktopBlock = new RegExp(
  String.raw`^.*desktop:start.*\r?\n[\s\S]*?^.*desktop:end.*` + lineEnd,
  "gm",
);
const desktopMarker = new RegExp(
  String.raw`^.*desktop:(?:start|end).*` + lineEnd,
  "gm",
);
const removableDesktopLine = new RegExp(
  String.raw`^(?:[ \t]*["'][^"'\n]*${desktopWorkspace}[^"'\n]*["'],?[ \t]*|[^\s]*${desktopWorkspace}[^\s]*|[ \t]*(?:[-*|]|\d+\.)[ \t].*${desktopWorkspace}.*)` +
    lineEnd,
  "gm",
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

function selectDesktop(source: string, text: string) {
  if (desktop) {
    return text.replace(desktopMarker, "");
  }
  if (source === path.join(templateDir, "package.json")) {
    const manifest = JSON.parse(text) as {
      workspaces: string[];
      scripts: Record<string, string>;
    };
    manifest.workspaces = manifest.workspaces.filter(
      (workspace) => workspace !== desktopWorkspace,
    );
    manifest.scripts = Object.fromEntries(
      Object.entries(manifest.scripts).filter(
        ([, command]) => !command.includes(desktopWorkspace),
      ),
    );
    return `${JSON.stringify(manifest, null, 2)}\n`;
  }
  if (path.basename(source) === "package-lock.json") {
    return text;
  }
  const relative = path.relative(templateDir, source);
  const markers = [...text.matchAll(/desktop:(start|end)/g)].map(
    ([, kind]) => kind,
  );
  if (markers.some((kind, index) => kind !== (index % 2 ? "end" : "start"))) {
    fail(`${relative} has unbalanced desktop:start and desktop:end markers.`);
  }
  const stripped = text
    .replace(desktopBlock, "")
    .replace(removableDesktopLine, "");
  const leftover = stripped
    .split("\n")
    .findIndex((line) => line.includes(desktopWorkspace));
  if (leftover !== -1) {
    fail(
      `${relative}: "${stripped.split("\n")[leftover]?.trim() ?? ""}" names ${desktopWorkspace} but is not a list entry, an ignore path, or a Markdown list item or table row. Put it between desktop:start and desktop:end markers.`,
    );
  }
  return stripped;
}

function copyTemplate(sourceDir: string, destinationDir: string) {
  fs.mkdirSync(destinationDir, { recursive: true });
  for (const entry of fs.readdirSync(sourceDir, { withFileTypes: true })) {
    if (
      skippedFiles.has(entry.name) ||
      (!desktop && entry.name === desktopWorkspace)
    ) {
      continue;
    }
    const source = path.join(sourceDir, entry.name);
    const destination = path.join(
      destinationDir,
      renamedFiles.get(entry.name) ?? fill(entry.name),
    );
    if (entry.isDirectory()) {
      copyTemplate(source, destination);
      continue;
    }
    const content = fs.readFileSync(source);
    fs.writeFileSync(
      destination,
      content.includes(0)
        ? content
        : fill(selectDesktop(source, content.toString("utf8"))),
      { mode: fs.statSync(source).mode },
    );
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
