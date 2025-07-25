import { coerceArray } from "./common";

type ElementOptions<T extends keyof HTMLElementTagNameMap> = Omit<
  Partial<HTMLElementTagNameMap[T]>,
  "children"
> & {
  children?: Node | string | (Node | string)[];
};

export function createElement<T extends keyof HTMLElementTagNameMap>(
  tag: T,
  options: ElementOptions<T>
) {
  const el = document.createElement(tag);
  const { children, ...attributes } = options;
  Object.assign(el, attributes);
  children && el.append(...coerceArray(children));
  return el;
}
