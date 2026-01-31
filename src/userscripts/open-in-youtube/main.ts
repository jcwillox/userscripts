import { useSelectorNode, useWaitElement } from "@/hooks";
import { createElement } from "@/utils";

declare global {
  interface HTMLElementTagNameMap {
    "ytd-reel-video-renderer": HTMLElement & {
      data?: { command?: { reelWatchEndpoint?: { videoId?: string } } };
    };
  }
}

GM_addStyle(`@unocss-placeholder
`);

if (location.hostname === "music.youtube.com") {
  const el = document.querySelector(
    "#player div.ytmusic-player.top-row-buttons"
  );
  if (el) {
    const url = location.href.replace("music.", "www.");
    el.prepend(
      createElement("button", {
        className: ":uno: un-(btn size-40px)",
        title: "Open in YouTube",
        onclick: (e) => {
          // ignore if not left-click
          if (e.button !== 0) return;
          e.preventDefault();
          e.stopPropagation();
          location.href = url;
        },
        onauxclick: (e) => {
          // ignore if not middle-click
          if (e.button !== 1) return;
          e.preventDefault();
          e.stopPropagation();
          GM_openInTab(url);
        },
        children: createElement("span", {
          className: ":uno: i-mdi-youtube un-(size-24px m-2)",
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
        className:
          ":uno: un-(btn-basic flex items-center h-36px pl-16px rd-8px)",
        children: [
          createElement("span", {
            className: ":uno: i-mdi-youtube un-(size-24px mr-12px)",
          }),
          createElement("span", {
            className: ":uno: un-(text-14px)",
            innerText: "Open in YouTube",
          }),
        ],
        onclick: (e) => {
          // ignore if not left-click
          if (e.button !== 0) return;
          e.preventDefault();
          e.stopPropagation();
          location.href = url;
        },
        onauxclick: (e) => {
          // ignore if not middle-click
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
