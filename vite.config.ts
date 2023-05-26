import { readFileSync } from "fs";
import path, { resolve } from "path";
import UnoCSS from "unocss/vite";
import { defineConfig, normalizePath } from "vite";
import { loadMetadata } from "./lib/metadata";

const BOUNDARY_REGEX = /^\/\/! module-boundary/gm;
const COMMENT_REGEX = /\/\/!/gm;

const PROJECT_ARG = process.env.PROJECT || process.argv.at(-1) || "";
const PROJECT_PATH = normalizePath(PROJECT_ARG);
const PROJECT_NAME = path.basename(PROJECT_PATH);

export default defineConfig({
  build: {
    lib: {
      entry: path.posix.join(PROJECT_PATH, "main.ts"),
      fileName: () => `${PROJECT_NAME}.user.js`,
      formats: ["es"],
    },
    minify: false,
    cssMinify: true,
    emptyOutDir: false,
    rollupOptions: {
      output: {
        banner: readFileSync("lib/log-version.ts").toString(),
      },
    },
  },
  esbuild: {
    banner: "//! module-boundary",
  },
  plugins: [
    UnoCSS({ mode: "shadow-dom" }),
    {
      name: "clean-bundle",
      generateBundle: (options, bundle) => {
        for (const [fileName, chunk] of Object.entries(bundle)) {
          if (chunk.type === "chunk" && fileName.endsWith(".user.js")) {
            const project = path.basename(fileName).replace(".user.js", "");
            chunk.code = loadMetadata(project) + chunk.code;
            chunk.code = chunk.code.replace(BOUNDARY_REGEX, "");
            chunk.code = chunk.code.replace(COMMENT_REGEX, "//");
          }
        }
      },
    },
  ],
  resolve: {
    alias: {
      "@": resolve(__dirname, "."),
    },
  },
});
