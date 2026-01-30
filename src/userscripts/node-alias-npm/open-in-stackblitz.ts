import { PackageJson } from "type-fest";
import { createElement } from "@/utils";

export interface Project {
  title: string;
  description?: string;
  template: string;
  files: Record<string, string>;
  dependencies?: Record<string, string>;
  settings?: {
    compile?: {
      trigger?: "auto" | "keystroke" | "save" | string;
      action?: "hmr" | "refresh" | string;
      clearConsole?: boolean;
    };
  };
}

export interface ProjectOptions {
  clickToLoad?: boolean;
  devToolsHeight?: number;
  hideDevTools?: boolean;
  hideExplorer?: boolean;
  openFile?: string | string[];
  origin?: string;
  organization?: {
    provider: "github";
    name: string;
  };
  showSidebar?: boolean;
  sidebarView?: string;
  startScript?: string;
  terminalHeight?: number;
  theme?: string;
  view?: string;
  newWindow?: boolean;
  zenMode?: boolean;
}

const createInput = (name: string, value: string) =>
  createElement("input", { type: "hidden", name, value });

export const createPackageJson = (pkg: PackageJson) =>
  JSON.stringify(pkg, null, 2);

function createProjectForm({
  template,
  title,
  description,
  dependencies,
  files,
  settings,
}: Project) {
  const form = createElement("form", { style: "display:none!important;" });
  form.method = "POST";
  form.append(
    createInput("project[title]", title),
    createInput("project[template]", template),
    ...(description ? [createInput("project[description]", description)] : []),
    ...(dependencies && template !== "node"
      ? [createInput("project[dependencies]", JSON.stringify(dependencies))]
      : []),
    ...(settings
      ? [createInput("project[settings]", JSON.stringify(settings))]
      : []),
    ...Object.entries(files).map(([path, contents]) =>
      createInput(`project[files][${path}]`, contents)
    )
  );
  return form;
}

export function openNewProject(project: Project, options: ProjectOptions) {
  const form = createProjectForm(project);
  const params = new URLSearchParams(
    Object.fromEntries(
      Object.entries(options).map(([key, value]) =>
        Array.isArray(value) ? [key, value.join(",")] : [key, String(value)]
      )
    )
  );
  const url = new URL(`https://stackblitz.com/run?${params.toString()}`);
  form.action = url.href;
  form.target = options.newWindow ? "_blank" : "_self";
  document.body.appendChild(form);
  form.submit();
  document.body.removeChild(form);
}

export const openPkgInStackBlitz = (pkg: string, version?: string) =>
  openNewProject(
    {
      title: pkg,
      template: "node",
      files: {
        "main.ts": `import * as pkg from "${pkg}";\n\nconsole.log("Hello World", pkg);`,
        "package.json": createPackageJson({
          name: "playground",
          version: "0.0.0",
          type: "module",
          scripts: {
            start: "node --watch --import tsx main.ts",
          },
          dependencies: {
            [pkg]: version ?? "latest",
            tsx: "latest",
          },
          stackblitz: {
            installDependencies: false,
            startCommand: "pnpm install && node --watch --import tsx main.ts",
          },
        }),
      },
      settings: {
        compile: {
          trigger: "save",
        },
      },
    },
    {
      newWindow: true,
      terminalHeight: 50,
      openFile: "main.ts",
      view: "editor",
    }
  );
