import type * as echarts from "echarts";
import type { CategoriesAPI, PercentOnlineAPI } from "./api.ts";

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
