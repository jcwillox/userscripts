// ==UserScript==
// @name        Open in YouTube
// @namespace   https://github.com/jcwillox/userscripts
// @version     0.2.0
// @description Adds a button to YouTube Music and Shorts to open the video in YouTube
// @author      jcwillox
// @license     MIT
// @match       https://music.youtube.com/watch?v=*
// @match       https://www.youtube.com/shorts/*
// @icon        https://www.google.com/s2/favicons?domain=youtube.com
// @run-at      document-end
// @grant       GM_openInTab
// @grant       GM_addStyle
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

GM_addStyle(`/* layer: preflights */
*,::before,::after{--un-rotate:0;--un-rotate-x:0;--un-rotate-y:0;--un-rotate-z:0;--un-scale-x:1;--un-scale-y:1;--un-scale-z:1;--un-skew-x:0;--un-skew-y:0;--un-translate-x:0;--un-translate-y:0;--un-translate-z:0;--un-pan-x: ;--un-pan-y: ;--un-pinch-zoom: ;--un-scroll-snap-strictness:proximity;--un-ordinal: ;--un-slashed-zero: ;--un-numeric-figure: ;--un-numeric-spacing: ;--un-numeric-fraction: ;--un-border-spacing-x:0;--un-border-spacing-y:0;--un-ring-offset-shadow:0 0 rgb(0 0 0 / 0);--un-ring-shadow:0 0 rgb(0 0 0 / 0);--un-shadow-inset: ;--un-shadow:0 0 rgb(0 0 0 / 0);--un-ring-inset: ;--un-ring-offset-width:0px;--un-ring-offset-color:#fff;--un-ring-width:0px;--un-ring-color:rgb(147 197 253 / 0.5);--un-blur: ;--un-brightness: ;--un-contrast: ;--un-drop-shadow: ;--un-grayscale: ;--un-hue-rotate: ;--un-invert: ;--un-saturate: ;--un-sepia: ;--un-backdrop-blur: ;--un-backdrop-brightness: ;--un-backdrop-contrast: ;--un-backdrop-grayscale: ;--un-backdrop-hue-rotate: ;--un-backdrop-invert: ;--un-backdrop-opacity: ;--un-backdrop-saturate: ;--un-backdrop-sepia: ;}::backdrop{--un-rotate:0;--un-rotate-x:0;--un-rotate-y:0;--un-rotate-z:0;--un-scale-x:1;--un-scale-y:1;--un-scale-z:1;--un-skew-x:0;--un-skew-y:0;--un-translate-x:0;--un-translate-y:0;--un-translate-z:0;--un-pan-x: ;--un-pan-y: ;--un-pinch-zoom: ;--un-scroll-snap-strictness:proximity;--un-ordinal: ;--un-slashed-zero: ;--un-numeric-figure: ;--un-numeric-spacing: ;--un-numeric-fraction: ;--un-border-spacing-x:0;--un-border-spacing-y:0;--un-ring-offset-shadow:0 0 rgb(0 0 0 / 0);--un-ring-shadow:0 0 rgb(0 0 0 / 0);--un-shadow-inset: ;--un-shadow:0 0 rgb(0 0 0 / 0);--un-ring-inset: ;--un-ring-offset-width:0px;--un-ring-offset-color:#fff;--un-ring-width:0px;--un-ring-color:rgb(147 197 253 / 0.5);--un-blur: ;--un-brightness: ;--un-contrast: ;--un-drop-shadow: ;--un-grayscale: ;--un-hue-rotate: ;--un-invert: ;--un-saturate: ;--un-sepia: ;--un-backdrop-blur: ;--un-backdrop-brightness: ;--un-backdrop-contrast: ;--un-backdrop-grayscale: ;--un-backdrop-hue-rotate: ;--un-backdrop-invert: ;--un-backdrop-opacity: ;--un-backdrop-saturate: ;--un-backdrop-sepia: ;}
/* layer: shortcuts */
.uno-bder80{--un-icon:url("data:image/svg+xml;utf8,%3Csvg viewBox='0 0 24 24' width='1em' height='1em' xmlns='http://www.w3.org/2000/svg' %3E%3Cpath fill='currentColor' d='m10 15l5.19-3L10 9zm11.56-7.83c.13.47.22 1.1.28 1.9c.07.8.1 1.49.1 2.09L22 12c0 2.19-.16 3.8-.44 4.83c-.25.9-.83 1.48-1.73 1.73c-.47.13-1.33.22-2.65.28c-1.3.07-2.49.1-3.59.1L12 19c-4.19 0-6.8-.16-7.83-.44c-.9-.25-1.48-.83-1.73-1.73c-.13-.47-.22-1.1-.28-1.9c-.07-.8-.1-1.49-.1-2.09L2 12c0-2.19.16-3.8.44-4.83c.25-.9.83-1.48 1.73-1.73c.47-.13 1.33-.22 2.65-.28c1.3-.07 2.49-.1 3.59-.1L12 5c4.19 0 6.8.16 7.83.44c.9.25 1.48.83 1.73 1.73'/%3E%3C/svg%3E");-webkit-mask:var(--un-icon) no-repeat;mask:var(--un-icon) no-repeat;-webkit-mask-size:100% 100%;mask-size:100% 100%;background-color:currentColor;color:inherit;width:1em;height:1em;margin-right:12px;width:24px;height:24px;}
.uno-f2u96r{--un-icon:url("data:image/svg+xml;utf8,%3Csvg viewBox='0 0 24 24' width='1em' height='1em' xmlns='http://www.w3.org/2000/svg' %3E%3Cpath fill='currentColor' d='m10 15l5.19-3L10 9zm11.56-7.83c.13.47.22 1.1.28 1.9c.07.8.1 1.49.1 2.09L22 12c0 2.19-.16 3.8-.44 4.83c-.25.9-.83 1.48-1.73 1.73c-.47.13-1.33.22-2.65.28c-1.3.07-2.49.1-3.59.1L12 19c-4.19 0-6.8-.16-7.83-.44c-.9-.25-1.48-.83-1.73-1.73c-.13-.47-.22-1.1-.28-1.9c-.07-.8-.1-1.49-.1-2.09L2 12c0-2.19.16-3.8.44-4.83c.25-.9.83-1.48 1.73-1.73c.47-.13 1.33-.22 2.65-.28c1.3-.07 2.49-.1 3.59-.1L12 5c4.19 0 6.8.16 7.83.44c.9.25 1.48.83 1.73 1.73'/%3E%3C/svg%3E");-webkit-mask:var(--un-icon) no-repeat;mask:var(--un-icon) no-repeat;-webkit-mask-size:100% 100%;mask-size:100% 100%;background-color:currentColor;color:inherit;width:1em;height:1em;margin:0.5rem;width:24px;height:24px;}
.uno-1pc8lc::before{pointer-events:none;position:absolute;inset:0;background-color:currentColor /* currentColor */;opacity:0;transition-property:opacity;transition-timing-function:cubic-bezier(0.4, 0, 0.2, 1);transition-duration:150ms;content:'';}
.uno-mtw9vz::before{pointer-events:none;position:absolute;inset:0;background-color:currentColor /* currentColor */;opacity:0;transition-property:opacity;transition-timing-function:cubic-bezier(0.4, 0, 0.2, 1);transition-duration:150ms;content:'';}
.uno-1pc8lc{position:relative;margin:0;height:36px;display:flex;cursor:pointer;align-items:center;overflow:hidden;border-radius:8px;border-style:none;background-color:transparent /* transparent */;padding:0;padding-left:16px;color:inherit;}
.uno-mtw9vz{position:relative;margin:0;width:40px;height:40px;display:inline-flex;cursor:pointer;align-items:center;justify-content:center;overflow:hidden;border-radius:9999px;border-style:none;background-color:transparent /* transparent */;padding:0;color:inherit;}
.uno-tojmek{font-size:14px;}
.uno-1pc8lc:hover::before{opacity:0.1;}
.uno-mtw9vz:hover::before{opacity:0.1;}
`);
if (location.hostname === "music.youtube.com") {
  const el = document.querySelector(
    "#player div.ytmusic-player.top-row-buttons"
  );
  if (el) {
    const url = location.href.replace("music.", "www.");
    el.prepend(
      createElement("button", {
        className: "uno-mtw9vz",
        title: "Open in YouTube",
        onclick: (e) => {
          if (e.button !== 0) return;
          e.preventDefault();
          e.stopPropagation();
          location.href = url;
        },
        onauxclick: (e) => {
          if (e.button !== 1) return;
          e.preventDefault();
          e.stopPropagation();
          GM_openInTab(url);
        },
        children: createElement("span", {
          className: "uno-f2u96r",
        }),
      })
    );
  }
} else if (location.pathname.startsWith("/shorts/")) {
  useWaitElement("tp-yt-paper-listbox#items", { timeout: 0 }).then(
    (element) => {
      const videoId = location.pathname.split("/").pop();
      if (!videoId) return;
      const url = `https://www.youtube.com/watch?v=${videoId}`;
      const itemEl = createElement("div", {
        className: "uno-1pc8lc",
        children: [
          createElement("span", {
            className: "uno-bder80",
          }),
          createElement("span", {
            className: "uno-tojmek",
            innerText: "Open in YouTube",
          }),
        ],
        onclick: (e) => {
          if (e.button !== 0) return;
          e.preventDefault();
          e.stopPropagation();
          location.href = url;
        },
        onauxclick: (e) => {
          if (e.button !== 1) return;
          e.preventDefault();
          e.stopPropagation();
          GM_openInTab(url);
        },
      });
      element.append(itemEl);
      useSelectorNode(itemEl, () => element.append(itemEl), {
        event: "removed",
        root: element.parentElement,
      });
    }
  );
}
