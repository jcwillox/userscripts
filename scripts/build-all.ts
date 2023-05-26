import path from "path";
import concurrently from "concurrently";
import { globSync } from "glob";

const IS_WATCH = process.argv.includes("--watch");
const COMMAND = IS_WATCH ? "vite build --watch" : "vite build";

concurrently(
  globSync("./src/*/meta.yaml")
    .map((value) => path.dirname(value))
    .map((value) => ({
      command: `${COMMAND} -- ${value}`,
      name: path.basename(value),
    })),
  { prefixColors: ["auto"], group: !IS_WATCH }
);
