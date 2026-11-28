import type { CategoriesAPI } from "shared/api.ts";
import logger from "shared/logger.ts";
import config from "shared/backend/config.ts";
import * as dt from "@internationalized/date";
import { z } from "zod";
import { now } from "shared/index.ts";
import { defineHandler, getValidatedQuery } from "nuxt/server";

const schema = z.object({
  asOf: z.iso
    .datetime({ local: false, offset: true })
    .transform((s) => dt.parseAbsoluteToLocal(s))
    .default(now()),
});

export default defineHandler(async (event): Promise<CategoriesAPI> => {
  logger.verbose(`Processing ${event.url.pathname}`);

  const { asOf } = await getValidatedQuery(event, (body) => schema.parse(body));

  return config.categoriesAsOf(asOf);
});
