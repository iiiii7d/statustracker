import type { CategoriesAPI } from "#shared/api.ts";

export default defineEventHandler((event): CategoriesAPI => {
  logger.verbose(`Processing ${event.path}`);
  return config.categories;
});
