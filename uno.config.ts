import {
  defineConfig,
  presetIcons,
  presetUno,
  transformerCompileClass,
  transformerVariantGroup,
} from "unocss";

export default defineConfig({
  include: ["src/**/*.ts"],
  presets: [
    presetUno({ prefix: "un-" }),
    presetIcons({ cdn: "https://esm.sh/" }),
  ],
  shortcuts: {
    "un-btn":
      "un-(rounded-full inline-flex items-center justify-center relative text-inherit overflow-hidden) before:un-(pointer-events-none absolute inset-0 bg-current opacity-0 transition-opacity content-['']) hover:before:un-opacity-10",
    "un-btn-small": "un-(h-8 w-8)",
  },
  transformers: [transformerVariantGroup(), transformerCompileClass()],
});
