/// <reference types="vite/client" />
/// <reference types="typed-query-selector/strict" />
/// <reference types="@types/tampermonkey" />

import { HLJSApi } from "highlight.js";

declare global {
  const hljs: HLJSApi;
}
