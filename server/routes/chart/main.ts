import * as echarts from "echarts";
import { getMainChartOption, getSeries } from "#shared/mainChart.ts";
import { getCounts } from "#server/routes/counts.ts";
import * as dt from "@internationalized/date";
import now from "#shared/now.ts";
import { z } from "zod/v4";
import { createCanvas } from "canvas";

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

export async function getMainChart({
  from,
  to,
  movingAverages,
  chartDimensions,
}: z.infer<typeof schema>): Promise<Buffer<ArrayBufferLike>> {
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

  const option = getMainChartOption(series);
  chart.setOption({ ...option, backgroundColor: "#111" });
  const buffer = canvas.toBuffer("image/png");
  chart.dispose();
  return buffer;
}

export default defineEventHandler(async (event) => {
  logger.verbose(`Processing ${event.path}`);

  const inputs = await getValidatedQuery(event, (body) => schema.parse(body));

  return getMainChart(inputs);
});
