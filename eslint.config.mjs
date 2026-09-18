import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTypeScript,
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
  {
    rules: {
      // The plates are plain <img>: they are decorative, sized by their section's CSS and driven
      // by GSAP, so next/image's wrapper and layout pass would fight the animations.
      "@next/next/no-img-element": "off",
    },
  },
]);
