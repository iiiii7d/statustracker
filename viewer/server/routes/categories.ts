import type { CategoriesAPI } from "shared/api.ts";
import logger from "shared/logger.ts";
import config from "shared/config.ts";

export default defineEventHandler((event): CategoriesAPI => {
  logger.verbose(`Processing ${event.path}`);
  return config.categories;
});
