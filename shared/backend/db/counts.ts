import db, { SQLZonedDateTime } from "./index.ts";
import { sql } from "kysely";
import type * as dt from "@internationalized/date";
import config from "../config.ts";
import * as echarts from "echarts";
import type { CountsAPI } from "../../api.ts";
import { createCanvas } from "canvas";
import { getCountsChartOption, getSeries } from "../../chart/counts.ts";

// eslint-disable-next-line max-lines-per-function
export async function getCounts(
  from: dt.ZonedDateTime,
  to: dt.ZonedDateTime,
  movingAverage: number,
): Promise<CountsAPI> {
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
        .having((eb) =>
          eb.between(
            "timestamp",
            new SQLZonedDateTime(from),
            new SQLZonedDateTime(to),
          ),
        ),
    )
    .selectFrom("aggregation")
    .select(["timestamp", "values"])
    .where(
      sql<boolean>`"count" <= ${config.countsApproxMaxLength} OR MOD(row_n, ("count"/${config.countsApproxMaxLength})) = 0`,
    )
    .orderBy("timestamp", "asc")
    .execute();
}

// eslint-disable-next-line max-params
export async function getCountsChart(
  from: dt.ZonedDateTime,
  to: dt.ZonedDateTime,
  movingAverages: number[],
  chartDimensions: [number, number],
): Promise<Buffer<ArrayBufferLike>> {
  const canvas = createCanvas(...chartDimensions);
  const chart = echarts.init(canvas as never);

  const counts = new Map(
    await Promise.all(
      movingAverages.map(
        async (ma) => [ma, await getCounts(from, to, ma)] as const,
      ),
    ),
  );
  const series = getSeries(counts, config.categories);

  const option = getCountsChartOption(series);
  chart.setOption({ ...option, backgroundColor: "#111" });
  const buffer = canvas.toBuffer("image/png");
  chart.dispose();
  return buffer;
}
