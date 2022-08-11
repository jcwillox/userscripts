// ==UserScript==
// @name        GitHub Copy Fix
// @namespace   https://github.com/jcwillox/userscripts
// @version     0.1.0
// @description Strips leading '$' when copying code from GitHub
// @author      jcwillox
// @license     MIT
// @match       https://github.com/*/*
// @icon        https://github.githubassets.com/favicons/favicon-dark.png
// ==/UserScript==

console.info(
  `%c ${GM_info.script.name.toUpperCase()} %c ${GM_info.script.version} `,
  `color: white; background: #039BE5; font-weight: 700;`,
  `color: #039BE5; background: white; font-weight: 700;`
);

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

// this can be tested with https://github.com/FiloSottile/mkcert
useSelector("clipboard-copy", element => {
  if (element.value.startsWith("$ ")) {
    element.value = element.value.slice(2);
  }
});
