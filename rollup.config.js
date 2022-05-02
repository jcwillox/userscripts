import bundleSize from "rollup-plugin-bundle-size";
import commonjs from "@rollup/plugin-commonjs";
import metablock from "rollup-plugin-userscript-metablock";
import nodeResolve from "@rollup/plugin-node-resolve";
import path from "path";
import pkg from "./package.json";
import prettier from "rollup-plugin-prettier";
import typescript from "@rollup/plugin-typescript";
import { defineConfig } from "rollup";
import { glob } from "glob";
import { string } from "rollup-plugin-string";
import { readFileSync } from "fs";

// collect projects to build
const projects = process.env.PROJECT
  ? [process.env.PROJECT]
  : glob.sync("src/*/meta.yaml").map(value => path.dirname(value));

export default defineConfig(
  projects.map(project => {
    project = project.replaceAll("\\", "/");
    const name = path.basename(project);
    const isTesting = project.includes("testing/");
    const extension = (isTesting ? ".test" : "") + ".user.js";
    return defineConfig({
      input: path.posix.join(project, "main.ts"),
      output: {
        file: path.posix.join("dist", name + extension),
        format: "es",
        banner: readFileSync("lib/log-version.ts").toString()
      },
      plugins: [
        nodeResolve(),
        typescript(),
        commonjs(),
        string({
          include: "**/*.css"
        }),
        prettier({ parser: "babel" }),
        metablock({
          file: path.posix.join(project, "meta.yaml"),
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
        }),
        bundleSize()
      ]
    });
  })
);
