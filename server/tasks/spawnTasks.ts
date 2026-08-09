import cron from "node-cron";
import logger from "#server/utils/logger.ts";
import config from "#server/utils/config.ts";
import updateCount from "#server/tasks/updateCount.ts";
import task from "#server/tasks/webhook.ts";

let tasksSpawned = false;

export default function spawnTasks() {
  if (tasksSpawned) {
    return;
  }
  tasksSpawned = true;
  logger.start("Spawning scheduled tasks");

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
}

spawnTasks();
