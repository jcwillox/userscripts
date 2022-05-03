import { glob } from "glob";
import path from "path";
import yaml from "js-yaml";
import { readFileSync, writeFileSync } from "fs";
import { execSync } from "child_process";

interface Metadata {
  name: string;
  description?: string;
}

const regexTable = /(?<=<!-- table -->\n)[\s\S]+(?=\n<!-- table-end -->)/;
const projects = glob.sync("src/*/meta.yaml");
const tracked = execSync("git ls-files");
const readme = readFileSync("README.md").toString();

const table =
  "| UserScript | Install |\n|------------|---------|\n" +
  projects
    .filter(value => tracked.includes(value))
    .map(project => {
      const directory = path.posix.dirname(project);
      const slug = path.posix.basename(directory);
      const info = yaml.load(readFileSync(project).toString()) as Metadata;
      const desc = info.description ? `<br>${info.description}` : "";

      return `| **${info.name}**${desc} | [Install](../../raw/main/dist/${slug}.user.js) |`;
    })
    .join("\n");

const match = regexTable.exec(readme);
if (!match) process.exit(1);

console.log(readme.split(match[0]).join(table));
writeFileSync("README.md", readme.split(match[0]).join(table));
