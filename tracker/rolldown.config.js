import { defineConfig } from "rolldown";

export default defineConfig([
  {
    input: "src/tracker.ts",
    output: {
      dir: "dist/",
      minify: import.meta.env === "production",
      codeSplitting: false,
    },
    // platform: 'node',
  },
  {
    input: "src/tasks/recalculateCounts.ts",
    output: {
      dir: "dist/",
      minify: import.meta.env === "production",
      codeSplitting: false,
    },
    platform: "node",
  },
  {
    input: "src/tasks/recalculatePlayerJoinTimes.ts",
    output: {
      dir: "dist/",
      minify: import.meta.env === "production",
      codeSplitting: false,
    },
    platform: "node",
  },
]);
