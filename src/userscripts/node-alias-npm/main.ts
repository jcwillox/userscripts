import { useSelectorNode, useWaitElement } from "@/hooks";
import { createElement, createMiddleware, isTruthy } from "@/utils";

// language=CSS
GM_addStyle("p:has(> div#a8c751d8) { margin: 0; }");
GM_addStyle(`@unocss-placeholder
`);

const PKG_REGEX = /^\/package\/(?<pkg>.+?)(?:\/v\/(?<version>[\d.]+))?$/;
const CMD_SELECTOR = "#top > div > div:first-of-type";

const containerEl = document.createElement("div");
containerEl.id = "a8c751d8";

let blockElCache: Node | undefined = undefined;

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
      .filter((x): x is string => !!x)
      .map((cmd) => {
        const newBlockEl = blockElCache?.cloneNode(
          true
        ) as HTMLParagraphElement;
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
      className: ":uno: un-(flex flex-wrap justify-center space-x-1)",
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

//! reapply on navigate
history.pushState = createMiddleware(history.pushState, (args, next) => {
  next(...args);
  apply();
});

//! reapply when our element is removed due to hydration mismatches
useWaitElement(CMD_SELECTOR).then((blockEl) => {
  const containerEl = apply();
  if (!containerEl) return;

  useSelectorNode(containerEl, () => apply(), {
    event: "removed",
    root: blockEl,
    once: true,
  });
});
