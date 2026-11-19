import { defineConfig } from "rolldown";
import { esmExternalRequirePlugin } from "rolldown/plugins";

export default defineConfig([
  {
    input: "src/tracker.ts",
    output: {
      dir: "dist/",
      minify: import.meta.env === "production",
      codeSplitting: false,
    },
    external: process.env.EXTERNAL_CANVAS ? ["canvas"] : undefined,
    platform: process.env.EXTERNAL_CANVAS ? "node" : undefined,
    plugins: process.env.EXTERNAL_CANVAS
      ? undefined
      : [
          esmExternalRequirePlugin({
            external: ["util", "util/types", "crypto", "dns", "net"],
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
