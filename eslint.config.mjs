import { defineConfig } from "eslint/config";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
export default defineConfig([
  ...nextCoreWebVitals,
  // Existing animation/hydration patterns: surface the new compiler diagnostics
  // without coupling the dependency migration to a UI behavior refactor.
  {
    files: [
      "src/components/Footer/Footer.tsx",
      "src/components/ui/DarkModeToogle.tsx",
    ],
    rules: { "react-hooks/set-state-in-effect": "warn" },
  },
  {
    files: [
      "src/components/WorkExperience/WorkExperienceList.tsx",
      "src/components/ui/BackgroundBoxes.tsx",
      "src/components/ui/GridGlobe.tsx",
    ],
    rules: { "react-hooks/purity": "warn" },
  },
  {
    files: ["src/components/ui/3d-card.tsx", "src/components/ui/CardRevealEffect.tsx"],
    rules: { "react-hooks/immutability": "warn" },
  },
  {
    files: ["src/components/ui/TextGenerate.tsx"],
    rules: { "react-hooks/refs": "warn" },
  },
]);
