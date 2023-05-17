import path from "path";
import open, { apps } from "open";
import { normalizePath } from "vite";

const PROJECT_ARG = process.env.PROJECT || process.argv.at(-1) || "";
const PROJECT_PATH = normalizePath(PROJECT_ARG);
const PROJECT_NAME = path.basename(PROJECT_PATH);

const IS_TESTING = PROJECT_PATH.startsWith("testing/");
const SCRIPT_NAME = `${PROJECT_NAME}.${IS_TESTING ? "test." : ""}user.js`;
const SCRIPT_PATH = path.resolve(__dirname, "../dist", SCRIPT_NAME);

open(SCRIPT_PATH, { app: { name: apps.chrome } });
