import db, { SQLZonedDateTime } from "./index.ts";
import type * as dt from "@internationalized/date";
import * as echarts from "echarts";
import type { PercentOnlineAPI } from "../../api.ts";
import { createCanvas } from "canvas";
import { getPercentOnlineChartOption } from "../../chart/percentOnline.ts";
import config from "../config.ts";

export async function getPercentOnline(
  from: dt.ZonedDateTime,
  to: dt.ZonedDateTime,
): Promise<PercentOnlineAPI> {
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
            .where((eb2) =>
              eb2.between(
                "timestamp",
                new SQLZonedDateTime(from),
                new SQLZonedDateTime(to),
              ),
            ),
          "real",
        ),
      )
        .$castTo<number>()
        .as("percentage"),
    )
    .where((eb) =>
      eb.between(
        "timestamp",
        new SQLZonedDateTime(from),
        new SQLZonedDateTime(to),
      ),
    )
    .groupBy("category")
    .orderBy("percentage", "desc")
    .execute();

  return Object.fromEntries(
    result.map(({ category, percentage }) => [category, percentage] as const),
  );
}

export async function getPercentOnlineChart(
  from: dt.ZonedDateTime,
  to: dt.ZonedDateTime,
  chartDimensions: [number, number],
): Promise<Buffer<ArrayBufferLike>> {
  const canvas = createCanvas(...chartDimensions);
  const chart = echarts.init(canvas as never);

  const percentages = await getPercentOnline(from, to);
  const option = getPercentOnlineChartOption(config.categories, percentages);

  chart.setOption({ ...option, backgroundColor: "#111" });
  const buffer = canvas.toBuffer("image/png");
  chart.dispose();
  return buffer;
}
