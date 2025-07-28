export type UseMutationOptions = {
  root?: Node | null;
  event?: "added" | "removed" | "all";
};

/** Get all added or removed nodes from the mutation records */
export function getChangedNodes(
  mutations: MutationRecord[],
  type: "added" | "removed" | "all"
) {
  const nodes: NodeList[] = [];
  for (const mutation of mutations) {
    if (type === "added" && mutation.addedNodes.length !== 0)
      nodes.push(mutation.addedNodes);
    if (type === "removed" && mutation.removedNodes.length !== 0)
      nodes.push(mutation.removedNodes);
    if (type === "all") {
      if (mutation.addedNodes.length !== 0) nodes.push(mutation.addedNodes);
      if (mutation.removedNodes.length !== 0) nodes.push(mutation.removedNodes);
    }
  }
  return nodes;
}

//! watch for nodes to be added or removed from the root
export function useMutation(
  callback: (nodeList: NodeList[]) => void,
  options: UseMutationOptions = {}
) {
  const opts = {
    root: options.root || document.body,
    event: options.event || "added",
  };

  const observer = new MutationObserver((mutations) => {
    const nodeList = getChangedNodes(mutations, opts.event);
    if (nodeList.length === 0) return;
    callback(nodeList);
  });

  observer.observe(opts.root, { childList: true, subtree: true });
  return observer;
}
