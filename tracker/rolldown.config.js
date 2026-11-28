import { defineConfig } from "rolldown";
import nativeFilePlugin from "vite-plugin-native-modules";
import copyPlugin from "rollup-plugin-copy";

export default defineConfig([
  {
    input: "src/tracker.ts",
    output: {
      dir: "dist/",
      minify: import.meta.env === "production",
      codeSplitting: false,
    },
    platform: "node",
    plugins: [
      nativeFilePlugin(),
      copyPlugin({
        targets: [
          {
            src: "node_modules/@fontsource/nunito/files/**/*",
            dest: "dist/fonts",
          },
        ],
      }),
    ],
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
