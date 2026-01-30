// ==UserScript==
// @name        Node Alias (npm)
// @namespace   https://github.com/jcwillox/userscripts
// @version     0.1.0
// @description Uses node-alias for the package install command
// @author      jcwillox
// @license     MIT
// @match       *://*.npmjs.com/package/*
// @icon        https://www.google.com/s2/favicons?domain=npmjs.com
// @run-at      document-start
// @grant       GM_addStyle
// @grant       GM_setClipboard
// @grant       GM_registerMenuCommand
// @grant       GM_unregisterMenuCommand
// @grant       window.onurlchange
// ==/UserScript==

console.info(
  `%c ${GM_info.script.name.toUpperCase()} %c ${GM_info.script.version} `,
  "color: white; background: #039BE5; font-weight: 700;",
  "color: #039BE5; background: white; font-weight: 700;"
);

function getChangedNodes(mutations, type) {
  const nodes = [];
  for (const mutation of mutations) {
    if (type === "added" && mutation.addedNodes.length !== 0)
      nodes.push(mutation.addedNodes);
    if (type === "removed" && mutation.removedNodes.length !== 0)
      nodes.push(mutation.removedNodes);
    if (type === "all") {
      if (mutation.addedNodes.length !== 0) nodes.push(mutation.addedNodes);
      if (mutation.removedNodes.length !== 0) nodes.push(mutation.removedNodes);
    }
  }
  return nodes;
}
// watch for nodes to be added or removed from the root
function useMutation(callback, options = {}) {
  const opts = {
    root: options.root || document.body,
    event: options.event || "added",
  };
  const observer = new MutationObserver((mutations) => {
    const nodeList = getChangedNodes(mutations, opts.event);
    if (nodeList.length === 0) return;
    callback(nodeList);
  });
  observer.observe(opts.root, { childList: true, subtree: true });
  return observer;
}

function coerceArray(value) {
  if (value === void 0) return [];
  return Array.isArray(value) ? value : [value];
}
function isTruthy(v) {
  return !!v;
}
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
function isElementNode(node) {
  return node.nodeType === Node.ELEMENT_NODE;
}

function createElement(tag, { style, ...options }) {
  const el = document.createElement(tag);
  const { children, ...attributes } = options;
  Object.assign(el, attributes);
  if (style) el.style.cssText = style;
  children && el.append(...coerceArray(children));
  return el;
}

const hasChildNode = (root, target) => {
  if (root === target) return true;
  for (const child of root.children) {
    if (hasChildNode(child, target)) return true;
  }
  return false;
};
// watch for a node to be added or removed
function useSelectorNode(target, callback, options = {}) {
  const opts = {
    root: options.root || document.body,
    event: options.event || "added",
    once: options.once || false,
  };
  const observer = useMutation((nodeList) => {
    for (const nodes of nodeList) {
      for (const node of nodes) {
        if (node === target) {
          callback(target);
          if (opts.once) observer.disconnect();
          return;
        }
      }
    }
  }, opts);
  return observer;
}
// watch selector for changes, fires callback every time the element is added
function useSelector(selector, callback, options = {}) {
  const opts = {
    root: options.root ?? document.body,
    event: options.event ?? "added",
    once: options.once ?? false,
    subtree: options.subtree ?? true,
  };
  if (opts.event === "added") {
    for (const el of opts.root.querySelectorAll(selector)) {
      callback(el);
      if (opts.once) return;
    }
  }
  const observer = useMutation((nodeList) => {
    const seen = /* @__PURE__ */ new Set();
    const matches = opts.root.querySelectorAll(selector);
    if (matches.length === 0) return;
    for (const nodes of nodeList) {
      for (const node of nodes) {
        if (!isElementNode(node)) continue;
        for (const match of matches) {
          if (opts.subtree) {
            if (seen.has(match)) continue;
            if (hasChildNode(node, match)) {
              seen.add(match);
              callback(match);
              if (opts.once) {
                observer.disconnect();
                return;
              }
            }
          } else {
            if (node === match) {
              callback(match);
              if (opts.once) observer.disconnect();
              return;
            }
          }
        }
      }
    }
  }, opts);
  return observer;
}

function useWaitElement(selector, options = {}) {
  return new Promise((resolve, reject) => {
    const observer = useSelector(
      selector,
      (element) => {
        resolve(element);
      },
      { root: options.root, subtree: options.subtree, once: true }
    );
    if (options.timeout === void 0 || options.timeout > 0) {
      setTimeout(() => {
        observer?.disconnect();
        reject(new Error(`Timeout waiting for element: '${selector}'`));
      }, options.timeout || 5e3);
    }
  });
}

const createInput = (name, value) =>
  createElement("input", { type: "hidden", name, value });
const createPackageJson = (pkg) => JSON.stringify(pkg, null, 2);
function createProjectForm({
  template,
  title,
  description,
  dependencies,
  files,
  settings,
}) {
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
function openNewProject(project, options) {
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
  form.target = "_blank";
  document.body.appendChild(form);
  form.submit();
  document.body.removeChild(form);
}
const openPkgInStackBlitz = (pkg, version) =>
  openNewProject(
    {
      title: pkg,
      template: "node",
      files: {
        "main.ts": `import * as pkg from "${pkg}";

console.log("Hello World", pkg);`,
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

GM_addStyle(`/* layer: preflights */
*,::before,::after{--un-rotate:0;--un-rotate-x:0;--un-rotate-y:0;--un-rotate-z:0;--un-scale-x:1;--un-scale-y:1;--un-scale-z:1;--un-skew-x:0;--un-skew-y:0;--un-translate-x:0;--un-translate-y:0;--un-translate-z:0;--un-pan-x: ;--un-pan-y: ;--un-pinch-zoom: ;--un-scroll-snap-strictness:proximity;--un-ordinal: ;--un-slashed-zero: ;--un-numeric-figure: ;--un-numeric-spacing: ;--un-numeric-fraction: ;--un-border-spacing-x:0;--un-border-spacing-y:0;--un-ring-offset-shadow:0 0 rgb(0 0 0 / 0);--un-ring-shadow:0 0 rgb(0 0 0 / 0);--un-shadow-inset: ;--un-shadow:0 0 rgb(0 0 0 / 0);--un-ring-inset: ;--un-ring-offset-width:0px;--un-ring-offset-color:#fff;--un-ring-width:0px;--un-ring-color:rgb(147 197 253 / 0.5);--un-blur: ;--un-brightness: ;--un-contrast: ;--un-drop-shadow: ;--un-grayscale: ;--un-hue-rotate: ;--un-invert: ;--un-saturate: ;--un-sepia: ;--un-backdrop-blur: ;--un-backdrop-brightness: ;--un-backdrop-contrast: ;--un-backdrop-grayscale: ;--un-backdrop-hue-rotate: ;--un-backdrop-invert: ;--un-backdrop-opacity: ;--un-backdrop-saturate: ;--un-backdrop-sepia: ;}::backdrop{--un-rotate:0;--un-rotate-x:0;--un-rotate-y:0;--un-rotate-z:0;--un-scale-x:1;--un-scale-y:1;--un-scale-z:1;--un-skew-x:0;--un-skew-y:0;--un-translate-x:0;--un-translate-y:0;--un-translate-z:0;--un-pan-x: ;--un-pan-y: ;--un-pinch-zoom: ;--un-scroll-snap-strictness:proximity;--un-ordinal: ;--un-slashed-zero: ;--un-numeric-figure: ;--un-numeric-spacing: ;--un-numeric-fraction: ;--un-border-spacing-x:0;--un-border-spacing-y:0;--un-ring-offset-shadow:0 0 rgb(0 0 0 / 0);--un-ring-shadow:0 0 rgb(0 0 0 / 0);--un-shadow-inset: ;--un-shadow:0 0 rgb(0 0 0 / 0);--un-ring-inset: ;--un-ring-offset-width:0px;--un-ring-offset-color:#fff;--un-ring-width:0px;--un-ring-color:rgb(147 197 253 / 0.5);--un-blur: ;--un-brightness: ;--un-contrast: ;--un-drop-shadow: ;--un-grayscale: ;--un-hue-rotate: ;--un-invert: ;--un-saturate: ;--un-sepia: ;--un-backdrop-blur: ;--un-backdrop-brightness: ;--un-backdrop-contrast: ;--un-backdrop-grayscale: ;--un-backdrop-hue-rotate: ;--un-backdrop-invert: ;--un-backdrop-opacity: ;--un-backdrop-saturate: ;--un-backdrop-sepia: ;}
/* layer: shortcuts */
.uno-1eahsp{--un-icon:url("data:image/svg+xml;utf8,%3Csvg viewBox='0 0 24 24' width='1em' height='1em' xmlns='http://www.w3.org/2000/svg' %3E%3Cpath fill='currentColor' d='M19 21H8V7h11m0-2H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2m-3-4H4a2 2 0 0 0-2 2v14h2V3h12z'/%3E%3C/svg%3E");-webkit-mask:var(--un-icon) no-repeat;mask:var(--un-icon) no-repeat;-webkit-mask-size:100% 100%;mask-size:100% 100%;background-color:currentColor;color:inherit;width:1em;height:1em;margin-right:0.5rem;width:18px;height:18px;flex-shrink:0;--un-text-opacity:1;color:rgb(115 115 115 / var(--un-text-opacity)) /* #737373 */;}
.uno-j3hsa1{--un-icon:url("data:image/svg+xml;utf8,%3Csvg viewBox='0 0 24 24' width='1em' height='1em' xmlns='http://www.w3.org/2000/svg' %3E%3Cpath fill='currentColor' d='M8.59 16.58L13.17 12L8.59 7.41L10 6l6 6l-6 6z'/%3E%3C/svg%3E");-webkit-mask:var(--un-icon) no-repeat;mask:var(--un-icon) no-repeat;-webkit-mask-size:100% 100%;mask-size:100% 100%;background-color:currentColor;color:inherit;width:1em;height:1em;margin-right:0.5rem;width:18px;height:18px;flex-shrink:0;}
.uno-ds8bb3{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));column-gap:0.25rem;}
.uno-693hup{margin-top:1rem;display:flex;flex-direction:column;gap:1rem;}
.uno-6vndvt{display:none;}
.uno-2oz0p5{width:100%;display:flex;cursor:pointer;align-items:center;justify-content:space-between;border-width:1px;--un-border-opacity:1;border-color:rgb(229 229 229 / var(--un-border-opacity));border-radius:0.375rem;border-style:solid;--un-bg-opacity:1;background-color:rgb(250 250 250 / var(--un-bg-opacity)) /* #fafafa */;padding-left:0.5rem;padding-right:0.5rem;padding-top:0.5rem;padding-bottom:0.5rem;text-align:left;}
.uno-9xep0c{flex-grow:1;}
.uno-ds8bb3 > *:nth-child(odd){justify-self:end;}
.uno-2oz0p5:hover{--un-bg-opacity:1;background-color:rgb(245 245 245 / var(--un-bg-opacity)) /* #f5f5f5 */;}
.uno-ewh6pt{font-size:14px;line-height:1.125rem;font-family:"Fira Code", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;}
`);
const CMD_SELECTOR = "#top > aside > div";
let menuIds = [];
const getPackage = (pathname) => {
  if (!pathname.startsWith("/package/")) return null;
  const parts = pathname.slice(9).split("/");
  const isScoped = parts[0]?.startsWith("@");
  const pkg = parts.splice(0, isScoped ? 2 : 1).join("/");
  const version = parts[0] === "v" ? parts[1] : void 0;
  return { pkg, version, fullPkg: [pkg, version].filter(isTruthy).join("@") };
};
// replace command block with our blocks
const apply = () => {
  const pkgInfo = getPackage(location.pathname);
  if (!pkgInfo) return;
  const { pkg, fullPkg, version } = pkgInfo;
  const blockToReplace = document.querySelector(CMD_SELECTOR);
  if (!blockToReplace) return;
  const isTypes = pkg.startsWith("@types/");
  const hasTypes = !!document.querySelector("h1 a[href*='@types/'] > img");
  const markerEl = createElement("div", { className: "uno-6vndvt" });
  const containerEl = createElement("div", {
    id: "a8c751d8",
    className: "uno-693hup",
  });
  const cmds = [
    `${fullPkg}`,
    !isTypes && `n a ${fullPkg}`,
    `n a -D ${fullPkg}`,
    !isTypes && `n g ${fullPkg}`,
    hasTypes && `n a -D @types/${pkg}`,
    hasTypes && `n a ${fullPkg} && n a -D @types/${pkg}`,
  ].filter(isTruthy);
  containerEl.replaceChildren(
    markerEl,
    ...cmds.map((cmd) => {
      const codeEl = createElement("code", {
        className: "uno-ewh6pt",
        innerText: cmd,
      });
      return createElement("div", {
        className: "uno-2oz0p5",
        onclick: async () => {
          GM_setClipboard(cmd);
          codeEl.innerText = "Copied!";
          await sleep(500);
          codeEl.innerText = cmd;
        },
        children: [
          createElement("span", {
            className: "uno-j3hsa1",
          }),
          createElement("span", {
            className: "uno-9xep0c",
            children: codeEl,
          }),
          createElement("span", {
            className: "uno-1eahsp",
          }),
        ],
      });
    }),
    createElement("div", {
      className: "uno-ds8bb3",
      children: [
        createElement("a", {
          href: `https://bundlephobia.com/package/${fullPkg}`,
          children: createElement("img", {
            src: `https://img.shields.io/bundlephobia/min/${fullPkg}`,
          }),
        }),
        createElement("a", {
          href: `https://bundlephobia.com/package/${fullPkg}`,
          children: createElement("img", {
            src: `https://img.shields.io/bundlephobia/minzip/${fullPkg}`,
          }),
        }),
        createElement("a", {
          href: `https://packagephobia.com/result?p=${fullPkg}`,
          children: createElement("img", {
            src: `https://badgen.net/packagephobia/publish/${fullPkg}`,
          }),
        }),
        createElement("a", {
          href: `https://packagephobia.com/result?p=${fullPkg}`,
          children: createElement("img", {
            src: `https://badgen.net/packagephobia/install/${fullPkg}`,
          }),
        }),
        createElement("a", {
          href: `https://pkg-size.dev/${fullPkg}`,
          children: createElement("img", {
            src: "https://img.shields.io/badge/pkg-size-ff7251",
          }),
        }),
        createElement("a", {
          href: "#",
          onclick: () => openPkgInStackBlitz(pkg, version),
          children: createElement("img", {
            src: "https://img.shields.io/badge/stack-blitz-1574ef",
          }),
        }),
      ],
    })
  );
  blockToReplace.replaceWith(containerEl);
  // register menu commands
  for (const menuId of menuIds) {
    GM_unregisterMenuCommand(menuId);
  }
  menuIds = [
    ...cmds.map((cmd) =>
      GM_registerMenuCommand(cmd, () => GM_setClipboard(cmd))
    ),
    GM_registerMenuCommand("pkg-size.dev", () =>
      window.open(`https://pkg-size.dev/${fullPkg}`, "_blank")
    ),
    GM_registerMenuCommand("bundlephobia.com", () =>
      window.open(`https://bundlephobia.com/package/${fullPkg}`, "_blank")
    ),
    GM_registerMenuCommand("packagephobia.com", () =>
      window.open(`https://packagephobia.com/result?p=${fullPkg}`, "_blank")
    ),
    GM_registerMenuCommand("stackblitz.com", () =>
      openPkgInStackBlitz(pkg, version)
    ),
  ];
  return markerEl;
};
// reapply on navigation
window.addEventListener("urlchange", () => apply());
// reapply when our element is removed due to hydration mismatches
useWaitElement(CMD_SELECTOR).then((blockEl) => {
  const containerEl = apply();
  if (!containerEl) return;
  useSelectorNode(containerEl, () => apply(), {
    event: "removed",
    root: blockEl.parentElement,
    once: true,
  });
});
