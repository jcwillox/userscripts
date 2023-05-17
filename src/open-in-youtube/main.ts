import { mdiYoutube } from "@mdi/js";
import { createIconButton } from "@/lib/buttons";
import { useSelector } from "@/lib/hooks";

function createButton(url: () => string, css: Record<string, unknown>) {
  const button = createIconButton(mdiYoutube, (e) => {
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
  const el = document.querySelector<HTMLDivElement>(
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
  useSelector("ytd-reel-video-renderer", (element) => {
    const controlsEl = element.querySelector("ytd-shorts-player-controls");
    if (controlsEl) {
      controlsEl.insertBefore(
        createButton(
          () => {
            const url = new URL(location.href);
            url.pathname = "/watch";
            url.searchParams.set(
              "v",
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (element as any).data.command.reelWatchEndpoint.videoId
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
