// ==UserScript==
// @name        Open in YouTube
// @namespace   https://github.com/jcwillox/userscripts
// @version     0.1.0
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
  `color: white; background: #039BE5; font-weight: 700;`,
  `color: #039BE5; background: white; font-weight: 700;`
);

function svgIcon(path, size = 24) {
  return `<svg style="width:${size}px;height:${size}px" viewBox="0 0 ${size} ${size}">
    <path fill="currentColor" d="${path}" />
  </svg>`;
}

// language=CSS
GM_addStyle(`
    #gm-actions {
        font-family: "Segoe UI Emoji", sans-serif;
        position: fixed;
        right: 18px;
        top: 18px;
        opacity: 10%;
        display: inline-flex;
        align-items: center;
    }

    #gm-actions > span {
        margin-left: 8px;
    }

    .gm-button {
      cursor: pointer;
      user-select: none;
    }
`);
function createButton$1(content, action) {
  const buttonEl = document.createElement("span");
  buttonEl.innerHTML = content;
  buttonEl.addEventListener("mouseup", action);
  buttonEl.classList.add("gm-button");
  return buttonEl;
}
function createIconButton(svgPath, action, size) {
  return createButton$1(svgIcon(svgPath, size), action);
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

// Material Design Icons v7.0.96
var mdiYoutube =
  "M10,15L15.19,12L10,9V15M21.56,7.17C21.69,7.64 21.78,8.27 21.84,9.07C21.91,9.87 21.94,10.56 21.94,11.16L22,12C22,14.19 21.84,15.8 21.56,16.83C21.31,17.73 20.73,18.31 19.83,18.56C19.36,18.69 18.5,18.78 17.18,18.84C15.88,18.91 14.69,18.94 13.59,18.94L12,19C7.81,19 5.2,18.84 4.17,18.56C3.27,18.31 2.69,17.73 2.44,16.83C2.31,16.36 2.22,15.73 2.16,14.93C2.09,14.13 2.06,13.44 2.06,12.84L2,12C2,9.81 2.16,8.2 2.44,7.17C2.69,6.27 3.27,5.69 4.17,5.44C4.64,5.31 5.5,5.22 6.82,5.16C8.12,5.09 9.31,5.06 10.41,5.06L12,5C16.19,5 18.8,5.16 19.83,5.44C20.73,5.69 21.31,6.27 21.56,7.17Z";

function createButton(url, css) {
  const button = createIconButton(mdiYoutube, e => {
    // ignore if not left or middle click
    if (e.button > 1) return;
    e.preventDefault();
    e.stopPropagation();
    // check if middle mouse button is pressed
    if (e.button == 1) {
      GM_openInTab(url());
    } else if (e.button == 0) {
      location.href = url();
    }
  });
  button.title = "Open in YouTube";
  Object.assign(button.style, css);
  return button;
}
if (location.hostname === "music.youtube.com") {
  const el = document.querySelector(
    "#player div.ytmusic-player.top-row-buttons"
  );
  if (el) {
    el.prepend(
      createButton(
        () => {
          return location.href.replace("music.", "www.");
        },
        { padding: "8px" }
      )
    );
  }
} else {
  useSelector("ytd-reel-video-renderer", element => {
    const controlsEl = element.querySelector("ytd-shorts-player-controls");
    if (controlsEl) {
      controlsEl.insertBefore(
        createButton(
          () => {
            const url = new URL(location.href);
            url.pathname = "/watch";
            url.searchParams.set(
              "v",
              element.data.command.reelWatchEndpoint.videoId
            );
            return url.href;
          },
          { color: "white" }
        ),
        controlsEl.lastElementChild
      );
    }
  });
}
