import * as dt from "@internationalized/date";
import { now } from "shared/index.ts";
import { z } from "zod/v4";
import { getMainChart } from "shared/db/chart/main.ts";
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
    movingAverages: z
      .preprocess(
        (a) => (typeof a === "string" ? a.split(",") : a),
        z
          .preprocess(
            (a) => (typeof a === "string" ? parseInt(a) : a),
            z.int().gte(0),
          )
          .array()
          .refine((arr) => arr.length === new Set(arr).size),
      )
      .default([0, 1]),
    chartDimensions: z
      .tuple([z.number().gt(0), z.number().gt(0)])
      .default([1920, 1080]),
  })
  .refine(
    ({ from: f, to: t }) =>
      !(f instanceof dt.ZonedDateTime) ||
      !(t instanceof dt.ZonedDateTime) ||
      f.compare(t) < 0,
    { error: "`to` is earlier than `from`" },
  );

export default defineEventHandler(async (event) => {
  logger.verbose(`Processing ${event.path}`);

  const { from, to, movingAverages, chartDimensions } = await getValidatedQuery(
    event,
    (body) => schema.parse(body),
  );

  return getMainChart(from, to, movingAverages, chartDimensions);
});
