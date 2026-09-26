import cron from "node-cron";
import config from "shared/config.ts";
import updateCount from "./updateCount.ts";
import task from "./webhook.ts";
import { migrateDB } from "shared/db/index.ts";

await migrateDB();

cron.schedule(
  "* * * * *",
  async () => {
    await updateCount();
  },
  { noOverlap: true },
);

const webhookConfigSchedules = config.webhooks?.schedules ?? {};
for (const [id, { cron: cronExpression }] of Object.entries(
  webhookConfigSchedules,
)) {
  cron.schedule(
    cronExpression,
    async () => {
      await task(id);
    },
    { noOverlap: true },
  );
}
