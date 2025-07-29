// ==UserScript==
// @name        Enhance Cloudwatch
// @namespace   https://github.com/jcwillox/userscripts
// @version     0.1.1
// @description Enhance the AWS Cloudwatch console with additional features.
// @author      jcwillox
// @license     MIT
// @match       *://*.console.aws.amazon.com/cloudwatch/home*
// @icon        https://www.google.com/s2/favicons?domain=aws.amazon.com
// @run-at      document-body
// @grant       GM_addStyle
// ==/UserScript==

console.info(
  `%c ${GM_info.script.name.toUpperCase()} %c ${GM_info.script.version} `,
  "color: white; background: #039BE5; font-weight: 700;",
  "color: #039BE5; background: white; font-weight: 700;"
);
const toZeroIfInfinity = (value) => (Number.isFinite(value) ? value : 0);
function parseNumber(milliseconds) {
  return {
    days: Math.trunc(milliseconds / 864e5),
    hours: Math.trunc((milliseconds / 36e5) % 24),
    minutes: Math.trunc((milliseconds / 6e4) % 60),
    seconds: Math.trunc((milliseconds / 1e3) % 60),
    milliseconds: Math.trunc(milliseconds % 1e3),
    microseconds: Math.trunc(toZeroIfInfinity(milliseconds * 1e3) % 1e3),
    nanoseconds: Math.trunc(toZeroIfInfinity(milliseconds * 1e6) % 1e3),
  };
}
function parseBigint(milliseconds) {
  return {
    days: milliseconds / 86400000n,
    hours: (milliseconds / 3600000n) % 24n,
    minutes: (milliseconds / 60000n) % 60n,
    seconds: (milliseconds / 1000n) % 60n,
    milliseconds: milliseconds % 1000n,
    microseconds: 0n,
    nanoseconds: 0n,
  };
}
function parseMilliseconds(milliseconds) {
  switch (typeof milliseconds) {
    case "number": {
      if (Number.isFinite(milliseconds)) {
        return parseNumber(milliseconds);
      }
      break;
    }
    case "bigint": {
      return parseBigint(milliseconds);
    }
  }
  throw new TypeError("Expected a finite number or bigint");
}
const isZero = (value) => value === 0 || value === 0n;
const pluralize = (word, count) =>
  count === 1 || count === 1n ? word : `${word}s`;
const SECOND_ROUNDING_EPSILON = 1e-7;
const ONE_DAY_IN_MILLISECONDS = 24n * 60n * 60n * 1000n;
function prettyMilliseconds(milliseconds, options) {
  const isBigInt = typeof milliseconds === "bigint";
  if (!isBigInt && !Number.isFinite(milliseconds)) {
    throw new TypeError("Expected a finite number or bigint");
  }
  options = { ...options };
  const sign = milliseconds < 0 ? "-" : "";
  milliseconds = milliseconds < 0 ? -milliseconds : milliseconds;
  if (options.colonNotation) {
    options.compact = false;
    options.formatSubMilliseconds = false;
    options.separateMilliseconds = false;
    options.verbose = false;
  }
  if (options.compact) {
    options.unitCount = 1;
    options.secondsDecimalDigits = 0;
    options.millisecondsDecimalDigits = 0;
  }
  let result = [];
  const floorDecimals = (value, decimalDigits) => {
    const flooredInterimValue = Math.floor(
      value * 10 ** decimalDigits + SECOND_ROUNDING_EPSILON
    );
    const flooredValue = Math.round(flooredInterimValue) / 10 ** decimalDigits;
    return flooredValue.toFixed(decimalDigits);
  };
  const add = (value, long, short, valueString) => {
    if (
      (result.length === 0 || !options.colonNotation) &&
      isZero(value) &&
      !(options.colonNotation && short === "m")
    ) {
      return;
    }
    valueString ??= String(value);
    if (options.colonNotation) {
      const wholeDigits = valueString.includes(".")
        ? valueString.split(".")[0].length
        : valueString.length;
      const minLength = result.length > 0 ? 2 : 1;
      valueString =
        "0".repeat(Math.max(0, minLength - wholeDigits)) + valueString;
    } else {
      valueString += options.verbose ? " " + pluralize(long, value) : short;
    }
    result.push(valueString);
  };
  const parsed = parseMilliseconds(milliseconds);
  const days = BigInt(parsed.days);
  if (options.hideYearAndDays) {
    add(BigInt(days) * 24n + BigInt(parsed.hours), "hour", "h");
  } else {
    if (options.hideYear) {
      add(days, "day", "d");
    } else {
      add(days / 365n, "year", "y");
      add(days % 365n, "day", "d");
    }
    add(Number(parsed.hours), "hour", "h");
  }
  add(Number(parsed.minutes), "minute", "m");
  if (!options.hideSeconds) {
    if (
      options.separateMilliseconds ||
      options.formatSubMilliseconds ||
      (!options.colonNotation && milliseconds < 1e3)
    ) {
      const seconds = Number(parsed.seconds);
      const milliseconds2 = Number(parsed.milliseconds);
      const microseconds = Number(parsed.microseconds);
      const nanoseconds = Number(parsed.nanoseconds);
      add(seconds, "second", "s");
      if (options.formatSubMilliseconds) {
        add(milliseconds2, "millisecond", "ms");
        add(microseconds, "microsecond", "µs");
        add(nanoseconds, "nanosecond", "ns");
      } else {
        const millisecondsAndBelow =
          milliseconds2 + microseconds / 1e3 + nanoseconds / 1e6;
        const millisecondsDecimalDigits =
          typeof options.millisecondsDecimalDigits === "number"
            ? options.millisecondsDecimalDigits
            : 0;
        const roundedMilliseconds =
          millisecondsAndBelow >= 1
            ? Math.round(millisecondsAndBelow)
            : Math.ceil(millisecondsAndBelow);
        const millisecondsString = millisecondsDecimalDigits
          ? millisecondsAndBelow.toFixed(millisecondsDecimalDigits)
          : roundedMilliseconds;
        add(
          Number.parseFloat(millisecondsString),
          "millisecond",
          "ms",
          millisecondsString
        );
      }
    } else {
      const seconds =
        ((isBigInt
          ? Number(milliseconds % ONE_DAY_IN_MILLISECONDS)
          : milliseconds) /
          1e3) %
        60;
      const secondsDecimalDigits =
        typeof options.secondsDecimalDigits === "number"
          ? options.secondsDecimalDigits
          : 1;
      const secondsFixed = floorDecimals(seconds, secondsDecimalDigits);
      const secondsString = options.keepDecimalsOnWholeSeconds
        ? secondsFixed
        : secondsFixed.replace(/\.0+$/, "");
      add(Number.parseFloat(secondsString), "second", "s", secondsString);
    }
  }
  if (result.length === 0) {
    return sign + "0" + (options.verbose ? " milliseconds" : "ms");
  }
  const separator = options.colonNotation ? ":" : " ";
  if (typeof options.unitCount === "number") {
    result = result.slice(0, Math.max(options.unitCount, 1));
  }
  return sign + result.join(separator);
}

function getChangedNodes(mutations, type) {
  const nodes = [];
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
// watch for nodes to be added or removed from the root
function useMutation(callback, options = {}) {
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

function coerceArray(value) {
  if (value === void 0) return [];
  return Array.isArray(value) ? value : [value];
}
function isElementNode(node) {
  return node.nodeType === Node.ELEMENT_NODE;
}

function createElement(tag, { style, ...options }) {
  const el = document.createElement(tag);
  const { children, ...attributes } = options;
  Object.assign(el, attributes);
  if (style) el.style.cssText = style;
  children && el.append(...coerceArray(children));
  return el;
}

const hasChildNode = (root, target) => {
  if (root === target) return true;
  for (const child of root.children) {
    if (hasChildNode(child, target)) return true;
  }
  return false;
};
// watch selector for changes, fires callback every time the element is added
function useSelector(selector, callback, options = {}) {
  const opts = {
    root: options.root || document.body,
    event: options.event || "added",
    once: options.once || false,
    subtree: options.subtree || false,
  };
  if (opts.event === "added") {
    for (const el of opts.root.querySelectorAll(selector)) {
      callback(el);
    }
  }
  const observer = useMutation((nodeList) => {
    const seen = /* @__PURE__ */ new Set();
    const matches = opts.root.querySelectorAll(selector);
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

function useWaitElement(selector, options = {}) {
  return new Promise((resolve, reject) => {
    // check if element already exists
    const el = document.querySelector(selector);
    if (el) return resolve(el);
    // wait for element to be added
    const observer = useSelector(
      selector,
      (element2) => {
        resolve(element2);
      },
      { root: options.root, subtree: options.subtree, once: true }
    );
    if (options.timeout === void 0 || options.timeout > 0) {
      setTimeout(() => {
        observer.disconnect();
        reject(new Error(`Timeout waiting for element: '${selector}'`));
      }, options.timeout || 5e3);
    }
  });
}

const reqColors = [
  "#ffb3ba",
  // Light Coral
  "#ffdfba",
  // Peach
  "#ffffba",
  // Pale Yellow
  "#baffc9",
  // Mint Green
  "#bae1ff",
  // Light Blue
  "#d7b0ff",
  // Light Purple
  "#ffb0f7",
  // Light Pink
  "#b0f0ff",
  // Light Cyan
];
const logLevels = {
  INFO: "#a0c4ff",
  WARN: "#ffd6a5",
  ERROR: "#ffadad",
  DEBUG: "#caffbf",
};
const ft = new Intl.DateTimeFormat(
  navigator.language === "en-US" ? void 0 : navigator.language,
  { dateStyle: "short", timeStyle: "medium" }
);
const element = await useWaitElement("iframe#microConsole-Logs", {
  subtree: true,
});
function highlightSection(text, start, end, color) {
  const before = text.slice(0, start);
  const after = text.slice(end);
  const highlighted = createElement("span", {
    textContent: text.slice(start, end),
    style: `background-color: ${color}; padding: 1px 4px; border-radius: 4px; color: black;`,
  });
  return `${before}${highlighted.outerHTML}${after}`;
}
function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash);
}
useMutation(
  () => {
    if (!element.contentDocument) return;
    const timestampCells = element.contentDocument.querySelectorAll(
      "span.logs__log-events-table__timestamp-cell"
    );
    for (const cell of timestampCells) {
      const timestamp = cell.textContent;
      if (timestamp?.includes("T")) {
        const date = new Date(timestamp);
        const diff = Math.abs(date.getTime() - Date.now());
        cell.textContent = `${ft.format(date)} (${prettyMilliseconds(
          diff
        )} ago)`;
      }
    }
    const logCells = element.contentDocument.querySelectorAll(
      'span[data-testid="logs__log-events-table__message"]'
    );
    for (const cell of logCells) {
      let log = cell.textContent;
      if (!log) continue;
      if (log.startsWith("highlighted")) continue;
      // escape html in to avoid rendering it to the dom
      log = createElement("span", { textContent: log }).innerHTML;
      // highlight log levels
      for (const logLevel in logLevels) {
        const idx = log.indexOf(logLevel);
        if (idx !== -1) {
          const color = logLevels[logLevel];
          log = highlightSection(log, idx, idx + logLevel.length, color);
        }
      }
      // highlight request ids
      const reqIdIdx = log.indexOf("RequestId: ");
      if (reqIdIdx !== -1) {
        const reqId = log.slice(reqIdIdx + 11, reqIdIdx + 11 + 36);
        log = highlightSection(
          log,
          reqIdIdx + 11,
          reqIdIdx + 11 + 36,
          reqColors[simpleHash(reqId) % reqColors.length]
        );
      } else {
        const logParts = log.split("	");
        if (logParts[0] && logParts[1]?.length === 36) {
          const reqId = logParts[1] ?? "";
          log = highlightSection(
            log,
            logParts[0].length + 1,
            logParts[0].length + 1 + reqId.length,
            reqColors[simpleHash(reqId) % reqColors.length]
          );
        }
        if (logParts[0]?.endsWith("Z") || logParts[0]?.includes("T")) {
          log = log.slice(logParts[0].length + 1);
        }
      }
      const marker = createElement("span", {
        textContent: "highlighted",
        style: "display: none;",
      });
      cell.innerHTML = marker.outerHTML + "	" + log;
    }
  },
  { root: element.contentDocument }
);
