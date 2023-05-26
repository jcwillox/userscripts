import path from "path";
import metablock from "rollup-plugin-userscript-metablock";
import pkg from "../package.json";

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
