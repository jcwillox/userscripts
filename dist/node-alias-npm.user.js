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

function createMiddleware(fn, ...middlewares) {
  if (!middlewares.length) return fn.bind(this);
  return function (...args) {
    const next = createMiddleware.bind(this)(fn, ...middlewares.slice(1));
    return middlewares[0].call(this, args, next);
  };
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
    root: options.root || document.body,
    event: options.event || "added",
    once: options.once || false,
    subtree: options.subtree || false,
  };
  if (opts.event === "added") {
    for (const el of opts.root.querySelectorAll(selector)) {
      callback(el);
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
    // check if element already exists
    const el = document.querySelector(selector);
    if (el) return resolve(el);
    // wait for element to be added
    const observer = useSelector(
      selector,
      (element) => {
        resolve(element);
      },
      { root: options.root, subtree: options.subtree, once: true }
    );
    if (options.timeout === void 0 || options.timeout > 0) {
      setTimeout(() => {
        observer.disconnect();
        reject(new Error(`Timeout waiting for element: '${selector}'`));
      }, options.timeout || 5e3);
    }
  });
}

GM_addStyle("p:has(> div#a8c751d8) { margin: 0; }");
GM_addStyle(`/* layer: preflights */
*,::before,::after{--un-rotate:0;--un-rotate-x:0;--un-rotate-y:0;--un-rotate-z:0;--un-scale-x:1;--un-scale-y:1;--un-scale-z:1;--un-skew-x:0;--un-skew-y:0;--un-translate-x:0;--un-translate-y:0;--un-translate-z:0;--un-pan-x: ;--un-pan-y: ;--un-pinch-zoom: ;--un-scroll-snap-strictness:proximity;--un-ordinal: ;--un-slashed-zero: ;--un-numeric-figure: ;--un-numeric-spacing: ;--un-numeric-fraction: ;--un-border-spacing-x:0;--un-border-spacing-y:0;--un-ring-offset-shadow:0 0 rgb(0 0 0 / 0);--un-ring-shadow:0 0 rgb(0 0 0 / 0);--un-shadow-inset: ;--un-shadow:0 0 rgb(0 0 0 / 0);--un-ring-inset: ;--un-ring-offset-width:0px;--un-ring-offset-color:#fff;--un-ring-width:0px;--un-ring-color:rgb(147 197 253 / 0.5);--un-blur: ;--un-brightness: ;--un-contrast: ;--un-drop-shadow: ;--un-grayscale: ;--un-hue-rotate: ;--un-invert: ;--un-saturate: ;--un-sepia: ;--un-backdrop-blur: ;--un-backdrop-brightness: ;--un-backdrop-contrast: ;--un-backdrop-grayscale: ;--un-backdrop-hue-rotate: ;--un-backdrop-invert: ;--un-backdrop-opacity: ;--un-backdrop-saturate: ;--un-backdrop-sepia: ;}::backdrop{--un-rotate:0;--un-rotate-x:0;--un-rotate-y:0;--un-rotate-z:0;--un-scale-x:1;--un-scale-y:1;--un-scale-z:1;--un-skew-x:0;--un-skew-y:0;--un-translate-x:0;--un-translate-y:0;--un-translate-z:0;--un-pan-x: ;--un-pan-y: ;--un-pinch-zoom: ;--un-scroll-snap-strictness:proximity;--un-ordinal: ;--un-slashed-zero: ;--un-numeric-figure: ;--un-numeric-spacing: ;--un-numeric-fraction: ;--un-border-spacing-x:0;--un-border-spacing-y:0;--un-ring-offset-shadow:0 0 rgb(0 0 0 / 0);--un-ring-shadow:0 0 rgb(0 0 0 / 0);--un-shadow-inset: ;--un-shadow:0 0 rgb(0 0 0 / 0);--un-ring-inset: ;--un-ring-offset-width:0px;--un-ring-offset-color:#fff;--un-ring-width:0px;--un-ring-color:rgb(147 197 253 / 0.5);--un-blur: ;--un-brightness: ;--un-contrast: ;--un-drop-shadow: ;--un-grayscale: ;--un-hue-rotate: ;--un-invert: ;--un-saturate: ;--un-sepia: ;--un-backdrop-blur: ;--un-backdrop-brightness: ;--un-backdrop-contrast: ;--un-backdrop-grayscale: ;--un-backdrop-hue-rotate: ;--un-backdrop-invert: ;--un-backdrop-opacity: ;--un-backdrop-saturate: ;--un-backdrop-sepia: ;}
/* layer: shortcuts */
.uno-z9q3ld{display:flex;flex-wrap:wrap;justify-content:center;}
.uno-z9q3ld>:not([hidden])~:not([hidden]){--un-space-x-reverse:0;margin-left:calc(0.25rem * calc(1 - var(--un-space-x-reverse)));margin-right:calc(0.25rem * var(--un-space-x-reverse));}
`);
const PKG_REGEX = /^\/package\/(?<pkg>.+?)(?:\/v\/(?<version>[\d.]+))?$/;
const CMD_SELECTOR = "#top > div > div:first-of-type";
const containerEl = document.createElement("div");
containerEl.id = "a8c751d8";
let blockElCache = void 0;
function apply() {
  const { pkg, version } = PKG_REGEX.exec(location.pathname)?.groups || {};
  const fullPkg = [pkg, version].filter(isTruthy).join("@");
  if (!pkg) return;
  const isTypes = pkg.startsWith("@types/");
  const hasTypes = !!document.querySelector("h1 a[href*='@types/'] > img");
  const blockEl = document.querySelector(CMD_SELECTOR);
  if (!blockEl) return;
  if (!blockElCache) blockElCache = blockEl.cloneNode(true);
  containerEl.replaceChildren(
    ...[
      `${fullPkg}`,
      !isTypes && `n a ${fullPkg}`,
      `n a -D ${fullPkg}`,
      !isTypes && `n g ${fullPkg}`,
      hasTypes && `n a -D @types/${pkg}`,
      hasTypes && `n a ${fullPkg} && n a -D @types/${pkg}`,
    ]
      .filter((x) => !!x)
      .map((cmd) => {
        const newBlockEl = blockElCache?.cloneNode(true);
        const spanEl = newBlockEl.querySelector("p > code");
        if (!spanEl) return newBlockEl;
        spanEl.innerText = cmd;
        spanEl.onclick = () => {
          GM_setClipboard(cmd);
          spanEl.innerText = "Copied!";
          setTimeout(() => {
            spanEl.innerText = cmd;
          }, 500);
        };
        return newBlockEl;
      }),
    createElement("div", {
      className: "uno-z9q3ld",
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
          href: `https://npm.runkit.com/${fullPkg}`,
          children: createElement("img", {
            src: "https://img.shields.io/badge/runkit-npm-f25ca4",
          }),
        }),
      ],
    })
  );
  blockEl.className = "";
  blockEl.replaceChildren(containerEl);
  return containerEl;
}
// reapply on navigate
history.pushState = createMiddleware(history.pushState, (args, next) => {
  next(...args);
  apply();
});
// reapply when our element is removed due to hydration mismatches
useWaitElement(CMD_SELECTOR).then((blockEl) => {
  const containerEl2 = apply();
  if (!containerEl2) return;
  useSelectorNode(containerEl2, () => apply(), {
    event: "removed",
    root: blockEl,
    once: true,
  });
});
