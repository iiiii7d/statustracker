import spawnTasks from "#server/tasks/spawnTasks.ts";

export default defineEventHandler(async (event): Promise<unknown> => {
  spawnTasks();
  return { body: await readBody(event) };
});
