import { readFileSync } from "fs";
import path, { resolve } from "path";
import metablock from "rollup-plugin-userscript-metablock";
import { defineConfig, normalizePath } from "vite";
import pkg from "./package.json";

const PROJECT_ARG = process.env.PROJECT || process.argv.at(-1) || "";
const PROJECT_PATH = normalizePath(PROJECT_ARG);
const PROJECT_NAME = path.basename(PROJECT_PATH);
const METADATA = metablock({
  file: path.posix.join(PROJECT_PATH, "meta.yaml"),
  override: {
    author: pkg.author,
    license: pkg.license,
    namespace: pkg.repository.url
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
    "noframes"
  ]
}).meta;

export default defineConfig({
  build: {
    lib: {
      entry: path.posix.join(PROJECT_PATH, "main.ts"),
      fileName: () => `${PROJECT_NAME}.user.js`,
      formats: ["es"]
    },
    minify: false,
    emptyOutDir: false,
    rollupOptions: {
      output: {
        banner: readFileSync("lib/log-version.ts").toString()
      }
    }
  },
  esbuild: {
    banner: METADATA
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, ".")
    }
  }
});
