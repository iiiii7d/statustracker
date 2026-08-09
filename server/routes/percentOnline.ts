import { getDB } from "#server/db";
import { z } from "zod/v4";
import * as dt from "@internationalized/date";
import now from "#shared/now";
import type { PercentOnlineAPI } from "#shared/api.ts";

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

export async function getPercentOnline(
  from: dt.ZonedDateTime,
  to: dt.ZonedDateTime,
): Promise<PercentOnlineAPI> {
  const db = await getDB();

  const result: { category: "all" | string; percentage: number }[] = await db
    .selectFrom("counts")
    .select("category")
    .select((eb) =>
      eb(
        eb.fn.sum(eb.case().when("value", ">", 0).then(1).else(0).end()),
        "/",
        eb.cast<number>(
          eb
            .selectFrom("counts")
            .select((eb2) => eb2.fn.count("timestamp").distinct().as("count"))
            .where((eb2) => eb2.between("timestamp", from, to)),
          "real",
        ),
      )
        .$castTo<number>()
        .as("percentage"),
    )
    .where((eb) => eb.between("timestamp", from, to))
    .groupBy("category")
    .orderBy("percentage", "desc")
    .execute();

  return Object.fromEntries(
    result.map(({ category, percentage }) => [category, percentage] as const),
  );
}

export default defineEventHandler(async (event): Promise<PercentOnlineAPI> => {
  logger.verbose(`Processing ${event.path}`);

  const { from, to } = await getValidatedQuery(event, (body) =>
    schema.parse(body),
  );

  return getPercentOnline(from, to);
});
