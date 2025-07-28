import prettyMs from "pretty-ms";
import { useWaitElement } from "@/hooks";
import { useMutation } from "@/hooks/use-mutation";
import { createElement } from "@/utils";

const reqColors = [
  "#ffb3ba", // Light Coral
  "#ffdfba", // Peach
  "#ffffba", // Pale Yellow
  "#baffc9", // Mint Green
  "#bae1ff", // Light Blue
  "#d7b0ff", // Light Purple
  "#ffb0f7", // Light Pink
  "#b0f0ff", // Light Cyan
];

const logLevels = {
  INFO: "#a0c4ff",
  WARN: "#ffd6a5",
  ERROR: "#ffadad",
  DEBUG: "#caffbf",
};

const ft = new Intl.DateTimeFormat(
  navigator.language === "en-US" ? undefined : navigator.language,
  { dateStyle: "short", timeStyle: "medium" }
);

const element = await useWaitElement("iframe#microConsole-Logs");

function highlightSection(
  text: string,
  start: number,
  end: number,
  color: string
) {
  const before = text.slice(0, start);
  const after = text.slice(end);
  const highlighted = createElement("span", {
    textContent: text.slice(start, end),
    style: `background-color: ${color}; padding: 1px 4px; border-radius: 4px; color: black;`,
  });
  return `${before}${highlighted.outerHTML}${after}`;
}

function simpleHash(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
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
        cell.textContent = `${ft.format(date)} (${prettyMs(diff)} ago)`;
      }
    }

    const logCells = element.contentDocument.querySelectorAll(
      'span[data-testid="logs__log-events-table__message"]'
    );
    for (const cell of logCells) {
      let log = cell.textContent;
      if (!log) continue;
      //! escape html in to avoid rendering it to the dom
      log = createElement("span", { textContent: log }).innerHTML;

      //! highlight log levels
      for (const logLevel in logLevels) {
        const idx = log.indexOf(logLevel);
        if (idx !== -1) {
          const color = logLevels[logLevel as keyof typeof logLevels];
          log = highlightSection(log, idx, idx + logLevel.length, color);
        }
      }

      //! highlight request ids
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
        // highlight request ids in json logs
        const logParts = log.split("\t");
        if (logParts[1].length === 36) {
          const reqId = logParts[1];
          log = highlightSection(
            log,
            logParts[0].length + 1,
            logParts[0].length + 1 + reqId.length,
            reqColors[simpleHash(reqId) % reqColors.length]
          );
        }
        // strip timestamp from log
        if (logParts[0].endsWith("Z") || logParts[0].includes("T")) {
          log = log.slice(logParts[0].length + 1);
        }
      }

      cell.innerHTML = log;
    }
  },
  { root: element.contentDocument }
);
