import { getDB } from "./index.ts";
import type * as dt from "@internationalized/date";
import type { PercentOnlineAPI } from "../api.ts";

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
