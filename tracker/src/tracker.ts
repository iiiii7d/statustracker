import cron from "node-cron";
import config from "shared/backend/config.ts";
import updateCount from "./updateCount.ts";
import task from "./webhook.ts";
import { migrateDB } from "shared/backend/db/index.ts";
import logger from "shared/logger.ts";
import { FontLibrary } from "skia-canvas";
import { glob } from "node:fs/promises";

const fonts: string[] = [];
for await (const file of glob(`${import.meta.dirname}/fonts/*.{woff,woff2}`)) {
  fonts.push(file);
}
logger.debug(`Loading custom fonts: ${fonts}`);
FontLibrary.use(fonts);

await migrateDB();

cron.schedule("* * * * *", updateCount, {
  name: "updateCount",
  noOverlap: true,
  logger,
});

const webhookConfigSchedules = config.webhooks?.schedules ?? {};
for (const [id, { cron: cronExpression }] of Object.entries(
  webhookConfigSchedules,
)) {
  cron.schedule(
    cronExpression,
    async () => {
      await task(id);
    },
    { name: `webhook-${id}`, noOverlap: true, logger },
  );
  logger.start(`Started cron job for webhook \`${id}\``);
}
