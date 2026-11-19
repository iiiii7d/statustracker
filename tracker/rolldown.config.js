import { defineConfig } from "rolldown";

export default defineConfig([
  {
    input: "src/tracker.ts",
    output: {
      dir: "dist/",
      codeSplitting: false,
    },
    // platform: 'node',
  },
  {
    input: "src/abc.ts",
    output: {
      dir: "dist/",
      codeSplitting: false,
    },
    platform: "node",
  },
]);
