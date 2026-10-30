#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import readline from "node:readline/promises";
import { parseArgs, styleText } from "node:util";

const templateDir = path.join(import.meta.dirname, "..", "template");

const placeholders = {
  description: "A new B7 Stack project.",
  name: "B7 Stack",
  slug: "b7-stack",
};

const renamedFiles = new Map([
  ["_gitignore", ".gitignore"],
  ["_npmrc", ".npmrc"],
]);

const skippedFiles = new Set([
  "node_modules",
  ".next",
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

const usage = `Usage: npx github:benlambert43/b7-stack [name | .] [--description <text>] [--db-port <port>]

  name           Display name of the new project. The folder and package names
                 are derived from it: "SunnyRadish" becomes sunnyradish.
  .              Scaffold into the current directory instead. It must be empty
                 apart from .git and the files GitHub adds to a new repository.
  --description  One sentence for the README, package.json, and the home page.
  --db-port      Host port for the PostgreSQL container (default 5432). Give
                 each project its own to run their databases side by side.

Whatever is not given is asked for.`;

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

async function ask(question: string, defaultValue = "") {
  if (!process.stdin.isTTY) {
    if (defaultValue) {
      return defaultValue;
    }
    fail(
      `${question} is required when there is no terminal to ask in.\n\n${usage}`,
    );
  }
  const prompt = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  try {
    let answer = "";
    while (!answer) {
      const hint = defaultValue ? ` (${defaultValue})` : "";
      answer =
        (await prompt.question(`${question}${hint}: `)).trim() || defaultValue;
    }
    return answer;
  } finally {
    prompt.close();
  }
}

function parseArguments() {
  try {
    return parseArgs({
      allowPositionals: true,
      options: {
        description: { type: "string", short: "d" },
        "db-port": { type: "string", default: "5432" },
        help: { type: "boolean", short: "h" },
      },
    });
  } catch (error) {
    fail(
      `${error instanceof Error ? error.message : String(error)}\n\n${usage}`,
    );
  }
}

const { values, positionals } = parseArguments();

if (values.help) {
  console.log(usage);
  process.exit(0);
}
if (positionals.length > 1) {
  fail(`Expected one name, got ${positionals.length}.\n\n${usage}`);
}

const nodeMajor = Number.parseInt(process.versions.node, 10);
if (nodeMajor < 26) {
  fail(`Node.js 26 or newer is required; this is ${process.version}.`);
}

const dbPort = values["db-port"];
if (!/^\d+$/.test(dbPort) || Number(dbPort) < 1 || Number(dbPort) > 65535) {
  fail(`--db-port must be a port number from 1 to 65535, got "${dbPort}".`);
}

const inPlace = positionals[0] === ".";
const name = inPlace
  ? await ask("Project name", path.basename(process.cwd()))
  : (positionals[0] ?? (await ask("Project name")));
const slug = slugify(name);
if (!slug) {
  fail(`"${name}" has no letters or digits to name the packages after.`);
}
const description =
  (values.description ?? "").trim() || (await ask("Description"));
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

function copyTemplate(sourceDir: string, destinationDir: string) {
  fs.mkdirSync(destinationDir, { recursive: true });
  for (const entry of fs.readdirSync(sourceDir, { withFileTypes: true })) {
    if (skippedFiles.has(entry.name)) {
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
      content.includes(0) ? content : fill(content.toString("utf8")),
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
  `  copied the template and wrote ${envCount} .env files with local defaults`,
);

if (!fs.existsSync(path.join(targetDir, ".git"))) {
  run("git", ["init", "--quiet", "--initial-branch=main"]);
}
run("npm", ["install"]);
run("npm", ["run", "format", "--silent", "--", "--log-level", "warn"]);

console.log(`
${styleText("green", "✔")} ${styleText("bold", name)} is ready. Next:
${inPlace ? "" : `\n  cd ${slug}`}
  npm run db:start      PostgreSQL in Docker on port ${dbPort}, migrations applied
  npm run dev           web app on http://localhost:3000
  npm run dev:server    API on http://localhost:4000
`);
