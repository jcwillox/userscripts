import { svgIcon } from "./index";

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

    #gm-button {
      cursor: pointer;
      user-select: none;
    }
`);

export function createButton(
  content: string,
  action: () => void
): HTMLSpanElement {
  const buttonEl = document.createElement("span");
  buttonEl.innerHTML = content;
  buttonEl.onclick = action;
  buttonEl.id = "gm-button";
  return buttonEl;
}

export function createIconButton(
  svgPath: string,
  action: () => void,
  size?: number
): HTMLSpanElement {
  return createButton(svgIcon(svgPath, size), action);
}
