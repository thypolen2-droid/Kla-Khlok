import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const requiredFiles = ["README.md", "KLA_KHLOK_GDD.md", "tasks.md", "docs/PLAN.md", "docs/TASKS.md"];

for (const relativePath of requiredFiles) {
  await access(resolve(root, relativePath));
}

const readme = await readFile(resolve(root, "README.md"), "utf8");
const tasks = await readFile(resolve(root, "tasks.md"), "utf8");
const plan = await readFile(resolve(root, "docs/PLAN.md"), "utf8");

for (const [label, content, needles] of [
  ["README", readme, ["KLA_KHLOK_GDD.md", "tasks.md", "npm run"]],
  ["tasks", tasks, ["JOB-001", "JOB-041", "Functional test"]],
  ["PLAN", plan, ["P0", "P5", "JOB-008"]],
]) {
  for (const needle of needles) {
    if (!content.includes(needle)) {
      throw new Error(`${label} is missing required text: ${needle}`);
    }
  }
}

console.log(`Documentation check passed for ${requiredFiles.length} files.`);
