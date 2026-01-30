import type { StrictlyParseSelector } from "typed-query-selector/parser";
import { UseMutationOptions, useMutation } from "@/hooks/use-mutation";
import { isElementNode } from "@/utils";

/** Recurse through child nodes to check if a node matches the target node */
const hasChildNode = (root: Element, target: Element) => {
  if (root === target) return true;
  for (const child of root.children) {
    if (hasChildNode(child, target)) return true;
  }
  return false;
};

export type UseSelectorNodeOptions = UseMutationOptions & { once?: boolean };

//! watch for a node to be added or removed
export function useSelectorNode<T extends Node = Node>(
  target: T,
  callback: (element: T) => void,
  options: UseSelectorOptions = {}
) {
  const opts = {
    root: options.root || document.body,
    event: options.event || "added",
    once: options.once || false,
  };

  const observer = useMutation((nodeList) => {
    for (const nodes of nodeList) {
      for (const node of nodes) {
        if (node === target) {
          callback(target);
          if (opts.once) observer.disconnect();
          return;
        }
      }
    }
  }, opts);

  return observer;
}

export type UseSelectorOptions = Omit<UseSelectorNodeOptions, "root"> & {
  root?: Element | Document | null;
  subtree?: boolean;
};

//! watch selector for changes, fires callback every time the element is added
export function useSelector<
  E extends Element = Element,
  S extends string = string,
  T extends StrictlyParseSelector<S, E> = StrictlyParseSelector<S, E>
>(
  selector: S,
  callback: (element: T) => void,
  options: UseSelectorOptions = {}
) {
  const opts = {
    root: options.root ?? document.body,
    event: options.event ?? "added",
    once: options.once ?? false,
    subtree: options.subtree ?? true,
  };

  if (opts.event === "added") {
    for (const el of opts.root.querySelectorAll<T>(selector)) {
      callback(el);
      if (opts.once) return;
    }
  }

  const observer = useMutation((nodeList) => {
    const seen = new Set<Element>();
    const matches = opts.root.querySelectorAll<T>(selector);
    if (matches.length === 0) return;

    for (const nodes of nodeList) {
      for (const node of nodes) {
        if (!isElementNode(node)) continue;
        for (const match of matches) {
          if (opts.subtree) {
            if (seen.has(match)) continue;
            if (hasChildNode(node, match)) {
              seen.add(match);
              callback(match);
              if (opts.once) {
                observer.disconnect();
                return;
              }
            }
          } else {
            if (node === match) {
              callback(match);
              if (opts.once) observer.disconnect();
              return;
            }
          }
        }
      }
    }
  }, opts);

  return observer;
}
