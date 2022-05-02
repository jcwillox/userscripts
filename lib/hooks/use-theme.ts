interface Options {
  onDark?: () => void;
  onLight?: () => void;
}

export function useSystemTheme({ onDark, onLight }: Options) {
  if (window.matchMedia) {
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      onDark?.();
    } else {
      onLight?.();
    }
    window
      .matchMedia("(prefers-color-scheme: dark)")
      .addEventListener("change", e => {
        if (e.matches) {
          onDark?.();
        } else {
          onLight?.();
        }
      });
  }
}

interface OptionsCSS {
  darkCSS?: string;
  lightCSS?: string;
}

export function useSystemThemeCSS({ darkCSS, lightCSS }: OptionsCSS) {
  let styleEl: HTMLStyleElement | null = null;

  useSystemTheme({
    onLight: () => {
      styleEl && styleEl.remove();
      if (lightCSS) styleEl = GM_addStyle(lightCSS);
    },
    onDark: () => {
      styleEl && styleEl.remove();
      if (darkCSS) styleEl = GM_addStyle(darkCSS);
    }
  });
}
