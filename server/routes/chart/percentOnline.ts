import * as echarts from "echarts";
import * as dt from "@internationalized/date";
import now from "#shared/now.ts";
import { z } from "zod/v4";
import { createCanvas } from "canvas";
import { getPercentOnlineChartOption } from "#shared/percentOnlineChart.ts";
import { getPercentOnline } from "#server/routes/percentOnline.ts";

const schema = z
  .object({
    from: z.iso
      .datetime({ local: false, offset: true })
      .transform((s) => dt.parseAbsoluteToLocal(s)),
    to: z.iso
      .datetime({ local: false, offset: true })
      .transform((s) => dt.parseAbsoluteToLocal(s))
      .default(now().add({ minutes: 1 })),
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

export async function getPercentOnlineChart({
  from,
  to,
  chartDimensions,
}: z.infer<typeof schema>): Promise<Buffer<ArrayBufferLike>> {
  const canvas = createCanvas(...chartDimensions);
  const chart = echarts.init(canvas as never);

  const percentages = await getPercentOnline(from, to);
  const option = getPercentOnlineChartOption(config.categories, percentages);

  chart.setOption({ ...option, backgroundColor: "#111" });
  const buffer = canvas.toBuffer("image/png");
  chart.dispose();
  return buffer;
}

export default defineEventHandler(async (event) => {
  logger.verbose(`Processing ${event.path}`);

  const inputs = await getValidatedQuery(event, (body) => schema.parse(body));

  return getPercentOnlineChart(inputs);
});
