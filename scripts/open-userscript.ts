import path from "path";
import open, { apps } from "open";
import { loadProject } from "@/metadata";

const [PROJECT_NAME, PROJECT_PATH] = loadProject();
const IS_TESTING = PROJECT_PATH.startsWith("testing/");
const SCRIPT_NAME = `${PROJECT_NAME}.${IS_TESTING ? "test." : ""}user.js`;
const SCRIPT_PATH = path.resolve(import.meta.dirname, "../dist", SCRIPT_NAME);

await open(SCRIPT_PATH, { app: { name: apps.chrome } });
