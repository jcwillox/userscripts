import { coerceArray } from "./common";

type ElementOptions<T extends keyof HTMLElementTagNameMap> = Omit<
  Partial<HTMLElementTagNameMap[T]>,
  "children"
> & {
  children?: Node | string | (Node | string)[];
};

export function createElement<T extends keyof HTMLElementTagNameMap>(
  tag: T,
  { style, ...options }: Omit<ElementOptions<T>, "style"> & { style?: string }
) {
  const el = document.createElement(tag);
  const { children, ...attributes } = options;
  Object.assign(el, attributes);
  if (style) el.style.cssText = style;
  children && el.append(...coerceArray(children));
  return el;
}
