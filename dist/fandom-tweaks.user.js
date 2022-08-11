// ==UserScript==
// @name        Fandom Tweaks
// @namespace   https://github.com/jcwillox/userscripts
// @version     0.1.0
// @description Useful tweaks for fandom based sites.
// @author      jcwillox
// @license     MIT
// @match       *://*.fandom.com/*
// @icon        https://www.google.com/s2/favicons?domain=fandom.com
// @run-at      document-body
// @grant       GM_addStyle
// ==/UserScript==

console.info(
  `%c ${GM_info.script.name.toUpperCase()} %c ${GM_info.script.version} `,
  `color: white; background: #039BE5; font-weight: 700;`,
  `color: #039BE5; background: white; font-weight: 700;`
);

function useSystemTheme({ onDark, onLight }) {
  if (window.matchMedia) {
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      onDark === null || onDark === void 0 ? void 0 : onDark();
    } else {
      onLight === null || onLight === void 0 ? void 0 : onLight();
    }
    window
      .matchMedia("(prefers-color-scheme: dark)")
      .addEventListener("change", e => {
        if (e.matches) {
          onDark === null || onDark === void 0 ? void 0 : onDark();
        } else {
          onLight === null || onLight === void 0 ? void 0 : onLight();
        }
      });
  }
}

// watch selector for changes, fires callback every time the element is added
// call observer.disconnect() to stop watching
function useSelector(selector, callback, root = document.body) {
  for (const el of document.querySelectorAll(selector)) {
    callback(el);
  }
  const observer = new MutationObserver(mutations => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const el = node;
          if (el.matches(selector)) {
            callback(el);
          }
        }
      }
    }
  });
  observer.observe(root, { childList: true, subtree: true });
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
      element => {
        observer.disconnect();
        resolve(element);
      },
      options.root
    );
    if (options.timeout === undefined || options.timeout > 0) {
      setTimeout(() => {
        observer.disconnect();
        reject(new Error(`Timeout waiting for element: '${selector}'`));
      }, options.timeout || 5000);
    }
  });
}

// language=css
GM_addStyle(`
  /* hide fandom sidebar */
  .global-navigation {
    display: none !important;
  }
  /* fix position after hiding sidebar */
  .main-container {
    margin-left: initial !important;
    width: initial !important;
  }
  .fandom-sticky-header {
    left: 0 !important;
  }
  /* prevent temporary pop-in of right panel before its moved */
  div.page.has-right-rail > aside {
    display: none !important
  }
  /* hide floating bar in bottom-right */
  #WikiaBar {
    display: none !important;
  }
`);
// moves right panel to the bottom of the page
useWaitElement("div.page.has-right-rail").then(element => {
  element.classList.remove("has-right-rail");
});
// toggle dark-mode based on system-preference
useSystemTheme({
  onDark: () => {
    if (document.cookie.indexOf("theme=dark") == -1) {
      console.log("Changing to dark theme");
      document.cookie =
        "theme=dark; Domain=.fandom.com; Path=/; Max-Age=2592000";
      location.reload();
    }
  },
  onLight: () => {
    if (document.cookie.indexOf("theme=dark") > -1) {
      console.log("Changing to light theme");
      document.cookie =
        "theme=light; Domain=.fandom.com; Path=/; Max-Age=2592000";
      location.reload();
    }
  }
});
// TODO: hotkey to open search
