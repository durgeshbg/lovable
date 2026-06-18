import { cp, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const projectPath = path.join(root, "project");
const templatePath = path.join(root, "project-template");

await rm(projectPath, { recursive: true, force: true });
await cp(templatePath, projectPath, { recursive: true });

console.log("Reset project/ from project-template/.");
