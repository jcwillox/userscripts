import path from "path";
import open from "open";

let project: string | undefined;
if (process.env.PROJECT) {
  project = process.env.PROJECT;
} else if (process.argv.length === 3) {
  project = process.argv[2];
} else {
  process.exit(1);
}

project = project.replaceAll("\\", "/");
const name = path.basename(project);
const isTesting = project.includes("testing/");
const extension = (isTesting ? ".test" : "") + ".user.js";

open(path.resolve(path.posix.join("dist", name + extension))).then();
