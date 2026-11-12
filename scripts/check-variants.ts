import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { styleText } from "node:util";

const root = path.join(import.meta.dirname, "..");
const templateDir = path.join(root, "template");
const variantsDir = path.join(root, "template-web-only");
const manifestFile = path.join(variantsDir, "variants.json");
const update = process.argv.includes("--update");

type Manifest = Record<string, Record<string, string>>;

function hash(source: string) {
  const text = fs.readFileSync(path.join(templateDir, source), "utf8");
  return createHash("sha256")
    .update(text.replaceAll("\r\n", "\n"))
    .digest("hex");
}

const manifest = JSON.parse(fs.readFileSync(manifestFile, "utf8")) as Manifest;
const variants = fs
  .readdirSync(variantsDir, { encoding: "utf8", recursive: true })
  .filter(
    (file) =>
      path.extname(file) !== ".json" &&
      fs.statSync(path.join(variantsDir, file)).isFile(),
  )
  .map((file) => file.split(path.sep).join("/"));

const problems: string[] = [];

for (const variant of variants) {
  if (!(variant in manifest)) {
    problems.push(
      `template-web-only/${variant} is not in variants.json. List it there with the template files it mirrors.`,
    );
  }
}

for (const [variant, sources] of Object.entries(manifest)) {
  if (!variants.includes(variant)) {
    problems.push(
      `variants.json lists ${variant}, which is not in template-web-only.`,
    );
    continue;
  }
  for (const [source, recorded] of Object.entries(sources)) {
    if (!fs.existsSync(path.join(templateDir, source))) {
      problems.push(
        `variants.json says ${variant} mirrors template/${source}, which does not exist.`,
      );
      continue;
    }
    const current = hash(source);
    if (update) {
      sources[source] = current;
    } else if (current !== recorded) {
      problems.push(
        `template/${source} has changed since template-web-only/${variant} was last brought in line with it.`,
      );
    }
  }
}

if (problems.length > 0) {
  console.error(
    styleText("red", problems.join("\n"), { stream: process.stderr }),
  );
  if (!update) {
    console.error(
      "\nMake the same change in each variant named above where it applies, then record the template files as they are now:\n\n  npm run lint:variants -- --update",
    );
  }
  process.exit(1);
}

if (update) {
  fs.writeFileSync(manifestFile, `${JSON.stringify(manifest, null, 2)}\n`);
}
console.log(
  update
    ? `Recorded the template files that ${String(variants.length)} web-only variants mirror.`
    : `${String(variants.length)} web-only variants are in line with the template files they mirror.`,
);
