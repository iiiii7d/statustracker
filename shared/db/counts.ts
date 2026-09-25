import { getDB } from "./index.ts";
import { sql } from "kysely";
import type * as dt from "@internationalized/date";
import type { CountsAPI } from "../api.ts";
import config from "../config.ts";

export async function getCounts(
  from: dt.ZonedDateTime,
  to: dt.ZonedDateTime,
  movingAverage: number,
): Promise<CountsAPI> {
  const db = await getDB();
  const ma = `${movingAverage} hours`;

  return await db
    .with("moving_avgs", (qc) =>
      qc
        .selectFrom("counts")
        .select(["timestamp", "category"])
        .select(
          movingAverage === 0
            ? "value"
            : sql<number>`(AVG(value) OVER (PARTITION BY category ORDER BY timestamp RANGE BETWEEN ${ma} PRECEDING AND ${ma} FOLLOWING))::real`.as(
                "value",
              ),
        ),
    )
    .with("aggregation", (qc) =>
      qc
        .selectFrom("moving_avgs")
        .select("timestamp")
        .select((eb) =>
          eb.fn
            .agg("json_object_agg", ["category", "value"])
            .$castTo<Record<"all" | string, number>>()
            .as("values"),
        )
        .select((eb) => eb.fn.countAll().over().as("count"))
        .select((eb) =>
          eb.fn
            .agg("row_number")
            .over((ob) => ob.orderBy("timestamp"))
            .as("row_n"),
        )
        .groupBy("timestamp")
        .having((eb) => eb.between("timestamp", from, to)),
    )
    .selectFrom("aggregation")
    .select(["timestamp", "values"])
    .where(
      sql<boolean>`"count" <= ${config.countsApproxMaxLength} OR MOD(row_n, ("count"/${config.countsApproxMaxLength})) = 0`,
    )
    .orderBy("timestamp", "asc")
    .execute();
}
