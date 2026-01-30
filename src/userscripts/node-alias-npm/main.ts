import { useSelectorNode, useWaitElement } from "@/hooks";
import { createElement, isTruthy, sleep } from "@/utils";
import { openPkgInStackBlitz } from "./open-in-stackblitz";

GM_addStyle(`@unocss-placeholder
`);

const CMD_SELECTOR = "#top > aside > div";
let menuIds: number[] = [];

const getPackage = (pathname: string) => {
  if (!pathname.startsWith("/package/")) return null;
  const parts = pathname.slice(9).split("/");
  const isScoped = parts[0]?.startsWith("@");
  const pkg = parts.splice(0, isScoped ? 2 : 1).join("/");
  const version = parts[0] === "v" ? parts[1] : undefined;
  return { pkg, version, fullPkg: [pkg, version].filter(isTruthy).join("@") };
};

//! replace command block with our blocks
const apply = () => {
  const pkgInfo = getPackage(location.pathname);
  if (!pkgInfo) return;
  const { pkg, fullPkg, version } = pkgInfo;

  const blockToReplace = document.querySelector(CMD_SELECTOR);
  if (!blockToReplace) return;

  const isTypes = pkg.startsWith("@types/");
  const hasTypes = !!document.querySelector("h1 a[href*='@types/'] > img");

  const markerEl = createElement("div", { className: ":uno: un-(hidden)" });
  const containerEl = createElement("div", {
    id: "a8c751d8",
    className: ":uno: un-(flex flex-col gap-4 mt-4)",
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
        className: ":uno: un-(font-code text-14px lh-4.5)",
        innerText: cmd,
      });
      return createElement("div", {
        className:
          ":uno: un-(w-full flex justify-between items-center px-2 py-2 bg-neutral-50 b b-solid b-neutral-200 rd-md text-left cursor-pointer) hover:un-(bg-neutral-100)",
        onclick: async () => {
          GM_setClipboard(cmd);
          codeEl.innerText = "Copied!";
          await sleep(500);
          codeEl.innerText = cmd;
        },
        children: [
          createElement("span", {
            className:
              ":uno: i-mdi-chevron-right un-(size-[18px] shrink-0 mr-2)",
          }),
          createElement("span", {
            className: ":uno: un-grow-1",
            children: codeEl,
          }),
          createElement("span", {
            className:
              ":uno: i-mdi-content-copy un-(size-[18px] c-neutral-500 shrink-0 mr-2)",
          }),
        ],
      });
    }),
    createElement("div", {
      className:
        ":uno: un-(grid grid-cols-2 gap-x-1) *:odd:un-(justify-self-end)",
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

  //! register menu commands
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

//! reapply on navigation
window.addEventListener("urlchange", () => apply());

//! reapply when our element is removed due to hydration mismatches
useWaitElement(CMD_SELECTOR).then((blockEl) => {
  const containerEl = apply();
  if (!containerEl) return;

  useSelectorNode(containerEl, () => apply(), {
    event: "removed",
    root: blockEl.parentElement,
    once: true,
  });
});
