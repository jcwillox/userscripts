/**
 * If the input is not an array wraps it in an array.
 * If the value is undefined returns an empty array.
 */
export function coerceArray<T>(value: T | T[]): T[] {
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

/**
 * Type guard to filter out falsy values
 *
 * @category Guards
 * @example array.filter(isTruthy)
 */
export function isTruthy<T>(v: T): v is Exclude<NonNullable<T>, false> {
  return !!v;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function isString(value: unknown): value is string {
  return typeof value === "string";
}

export function isDocumentNode(node: Node): node is Document {
  return node.nodeType === Node.DOCUMENT_NODE;
}

export function isElementNode(node: Node): node is Element {
  return node.nodeType === Node.ELEMENT_NODE;
}
