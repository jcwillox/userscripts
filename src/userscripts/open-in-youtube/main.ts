import { useSelector } from "@/hooks";
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

function createButton(url: () => string, className?: string) {
  return createElement("button", {
    className: "un-btn un-btn-small",
    title: "Open in YouTube",
    onclick: (e) => {
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
    },
    children: createElement("span", {
      className: `i-mdi-youtube un-(h-[18px] w-[18px]) ${className}`,
    }),
  });
}

if (location.hostname === "music.youtube.com") {
  const el = document.querySelector(
    "#player div.ytmusic-player.top-row-buttons"
  );
  if (el) {
    el.prepend(
      createButton(() => {
        return location.href.replace("music.", "www.");
      }, "un-m-2")
    );
  }
} else {
  useSelector("ytd-reel-video-renderer", (element) => {
    const controlsEl = element.querySelector("ytd-shorts-player-controls");
    if (controlsEl) {
      controlsEl.insertBefore(
        createButton(() => {
          const url = new URL(location.href);
          url.pathname = "/watch";
          url.searchParams.set(
            "v",
            element.data?.command?.reelWatchEndpoint?.videoId || ""
          );
          return url.href;
        }, "un-text-white"),
        controlsEl.lastElementChild
      );
    }
  });
}
