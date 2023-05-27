import { useSelector } from "@/hooks";

useSelector<HTMLInputElement>("clipboard-copy", (element) => {
  if (element.value.startsWith("$ ")) {
    element.value = element.value.slice(2);
  }
});
