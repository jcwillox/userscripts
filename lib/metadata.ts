import { existsSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import metablock from "rollup-plugin-userscript-metablock";
import { normalizePath } from "vite";
import pkg from "../package.json";

const CACHE_PATH = "node_modules/.cache/last-project";

function isValidProject(project: string) {
  return existsSync(path.join(project, "main.ts"));
}

function getLastProject() {
  if (existsSync(CACHE_PATH)) {
    const project = readFileSync(CACHE_PATH).toString();
    if (isValidProject(project)) return project;
  }
  throw new Error("No valid project found");
}

function setLastProject(project: string) {
  writeFileSync(CACHE_PATH, project);
}

export function loadProject() {
  let projectPath = normalizePath(
    process.env.PROJECT || process.argv.at(-1) || ""
  );
  if (!isValidProject(projectPath)) {
    projectPath = getLastProject();
  } else {
    setLastProject(projectPath);
  }
  return [path.basename(projectPath), projectPath] as const;
}

export function loadMetadata(project: string) {
  return metablock({
    file: path.join("src", project, "meta.yaml"),
    override: {
      author: pkg.author,
      license: pkg.license,
      namespace: pkg.repository.url,
    },
    manager: "tampermonkey",
    order: [
      "name",
      "namespace",
      "version",
      "description",
      "author",
      "license",
      "match",
      "include",
      "exclude",
      "icon",
      "run-at",
      "grant",
      "require",
      "resource",
      "noframes",
    ],
  }).meta;
}
