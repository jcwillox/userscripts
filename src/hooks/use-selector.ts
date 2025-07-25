import type { StrictlyParseSelector } from "typed-query-selector/parser";

export interface UseSelectorOptions {
  root?: Element;
  event?: "added" | "removed";
}

//! watch selector for changes, fires callback every time the element is added
//! call observer.disconnect() to stop watching
export function useSelector<
  E extends Element = Element,
  S extends string = string,
  T extends StrictlyParseSelector<S, E> = StrictlyParseSelector<S, E>
>(
  selector: Node | S,
  callback: (element: T) => void,
  options: UseSelectorOptions = {}
) {
  const opts: Required<UseSelectorOptions> = {
    root: options.root || document.body,
    event: options.event || "added",
  };

  if (opts.event == "added") {
    if (typeof selector == "string") {
      for (const el of document.querySelectorAll<T>(selector)) {
        callback(el);
      }
    } else {
      callback(selector as T);
    }
  }

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      const nodes =
        opts.event == "added" ? mutation.addedNodes : mutation.removedNodes;
      const matches =
        typeof selector == "string" && opts.root.querySelectorAll<T>(selector);
      for (const node of nodes) {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const el = node as Element;
          if (typeof selector == "string") {
            if (matches) {
              for (const match of matches) {
                if (match == el) {
                  callback(match);
                  break;
                }
              }
            }
          } else if (node == selector) {
            callback(el as T);
          }
        }
      }
    }
  });
  observer.observe(opts.root, { childList: true, subtree: true });
  return observer;
}
