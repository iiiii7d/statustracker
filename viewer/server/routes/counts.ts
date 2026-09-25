import { z } from "zod/v4";
import * as dt from "@internationalized/date";
import { countsAPI, type CountsAPIJson } from "shared/api.ts";
import logger from "shared/logger.ts";
import { getCounts } from "shared/db/counts.ts";
import { now } from "shared/index.ts";

const schema = z
  .object({
    from: z.iso
      .datetime({ local: false, offset: true })
      .transform((s) => dt.parseAbsoluteToLocal(s)),
    to: z.iso
      .datetime({ local: false, offset: true })
      .transform((s) => dt.parseAbsoluteToLocal(s))
      .default(now().add({ minutes: 1 })),
    movingAverage: z.preprocess(
      (a) => (typeof a === "string" ? parseInt(a) : a),
      z.int().gte(0).default(0),
    ),
  })
  .refine(
    ({ from: f, to: t }) =>
      !(f instanceof dt.ZonedDateTime) ||
      !(t instanceof dt.ZonedDateTime) ||
      f.compare(t) < 0,
    { error: "`to` is earlier than `from`" },
  );

export default defineEventHandler(async (event): Promise<CountsAPIJson> => {
  logger.verbose(`Processing ${event.path}`);

  const { from, to, movingAverage } = await getValidatedQuery(event, (body) =>
    schema.parse(body),
  );
  const result = await getCounts(from, to, movingAverage);

  return countsAPI.ser(result);
});
