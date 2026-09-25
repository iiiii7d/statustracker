import { z } from "zod/v4";
import * as dt from "@internationalized/date";
import { now } from "shared/index.ts";
import type { PercentOnlineAPI } from "shared/api.ts";
import { getPercentOnline } from "shared/db/percentOnline.ts";
import logger from "shared/logger.ts";

const schema = z
  .object({
    from: z.iso
      .datetime({ local: false, offset: true })
      .transform((s) => dt.parseAbsoluteToLocal(s)),
    to: z.iso
      .datetime({ local: false, offset: true })
      .transform((s) => dt.parseAbsoluteToLocal(s))
      .default(now().add({ minutes: 1 })),
  })
  .refine(
    ({ from: f, to: t }) =>
      !(f instanceof dt.ZonedDateTime) ||
      !(t instanceof dt.ZonedDateTime) ||
      f.compare(t) < 0,
    { error: "`to` is earlier than `from`" },
  );

export default defineEventHandler(async (event): Promise<PercentOnlineAPI> => {
  logger.verbose(`Processing ${event.path}`);

  const { from, to } = await getValidatedQuery(event, (body) =>
    schema.parse(body),
  );

  return getPercentOnline(from, to);
});
