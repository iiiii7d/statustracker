import cron from "node-cron";
import config from "shared/backend/config.ts";
import updateCount from "./updateCount.ts";
import task from "./webhook.ts";
import { migrateDB } from "shared/backend/db/index.ts";
import logger from "shared/logger.ts";

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
}
