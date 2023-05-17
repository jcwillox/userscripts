import { useSystemTheme, useWaitElement } from "@/lib/hooks";

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

//! moves right panel to the bottom of the page
useWaitElement<HTMLDivElement>("div.page.has-right-rail").then((element) => {
  element.classList.remove("has-right-rail");
});

//! toggle dark-mode based on system-preference
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
  },
});
