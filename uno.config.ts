import {
  defineConfig,
  presetIcons,
  presetWind3,
  transformerCompileClass,
  transformerVariantGroup,
} from "unocss";

export default defineConfig({
  presets: [
    presetWind3({ prefix: "un-" }),
    presetIcons({ cdn: "https://esm.sh/" }),
  ],
  rules: [
    [
      "un-font-code",
      {
        "font-family":
          '"Fira Code", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
      },
    ],
  ],
  shortcuts: {
    "un-btn":
      "un-(rounded-full inline-flex items-center justify-center relative text-inherit overflow-hidden cursor-pointer bg-transparent border-none m-0 p-0) before:un-(pointer-events-none absolute inset-0 bg-current opacity-0 transition-opacity content-['']) hover:before:un-opacity-10",
    "un-btn-basic":
      "un-(flex items-center relative text-inherit overflow-hidden cursor-pointer bg-transparent border-none m-0 p-0) before:un-(pointer-events-none absolute inset-0 bg-current opacity-0 transition-opacity content-['']) hover:before:un-opacity-10",
    "un-btn-small": "un-(h-8 w-8)",
  },
  transformers: [transformerVariantGroup(), transformerCompileClass()],
});
