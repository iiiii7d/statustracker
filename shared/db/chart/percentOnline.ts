import * as echarts from "echarts";
import type { CategoriesAPI, PercentOnlineAPI } from "../../api.ts";
import { createCanvas } from "canvas";
import type * as dt from "@internationalized/date";
import { getPercentOnline } from "../percentOnline.ts";
import config from "../../config.ts";

export function getPercentOnlineChartOption(
  categories: CategoriesAPI,
  percentages: PercentOnlineAPI,
): echarts.ComposeOption<
  | echarts.BarSeriesOption
  | echarts.GridComponentOption
  | echarts.TitleComponentOption
> {
  return {
    title: {
      text: "% of the time players were online",
      subtext: "based on all timestamps sampled",
      textStyle: {
        color: "#fff",
      },
    },
    backgroundColor: "transparent",
    xAxis: {
      type: "value",
    },
    yAxis: {
      type: "category",
      data: Object.keys(percentages),
      axisLabel: {
        show: false,
      },
    },
    series: [
      {
        type: "bar",
        colorBy: "data",
        data: Object.values(percentages).map(
          (pc) => Math.round(pc * 10000) / 100,
        ),
        color: [
          "#fff",
          ...Object.keys(percentages).map(
            (cat) => categories[cat]?.colour ?? "#fff",
          ),
        ],
        label: {
          show: true,
          formatter: "{b}: {c}%",
          fontSize: 30,
        },
      },
    ],
  };
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
