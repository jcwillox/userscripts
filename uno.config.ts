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
    presetUno(),
    presetIcons({
      cdn: "https://esm.sh/",
      warn: true,
    }),
  ],
  transformers: [transformerVariantGroup(), transformerCompileClass()],
});
