import { useSelector } from "@/hooks";

declare global {
  interface HTMLElementTagNameMap {
    "clipboard-copy": HTMLInputElement;
  }
}

useSelector("clipboard-copy", (element) => {
  if (element.value.startsWith("$ ")) {
    element.value = element.value.slice(2);
  }
});
