import * as echarts from "echarts";
import type { CategoriesAPI, CountsAPI, PlayerAPI } from "../../api.ts";
import { hhmm, now } from "../../index.ts";
import { createCanvas } from "canvas";
import type * as dt from "@internationalized/date";

function formatHours(h: number): string {
  if (h === 0) return "Raw";
  if (h < 24) return `${h}h`;
  const days = Math.round(h % 24);
  const remHours = Math.round(h - 24 * days);
  if (remHours === 0) return `${days}d`;
  return `${days}d ${remHours}h`;
}

const ALPHA = "f84210";

export function getSeries(
  counts: Map<number, CountsAPI>,
  categories: CategoriesAPI,
): echarts.LineSeriesOption[] {
  return (
    Array.from(counts.entries())
      .sort(([a], [b]) => b - a)
      // .filter(([ma]) => ma !== 0 || shownMovingAverages[0])
      .flatMap(([ma, m], i) =>
        [
          ["all", { colour: "#fff" }] as const,
          ...Object.entries(categories),
        ].map(([cat, { colour }]) => ({
          id: `${cat}:${ma}`,
          name: `${cat}${ma === 0 ? "" : ` (Rolling average ${formatHours(ma)})`}`,
          type: "line",
          smooth: true,
          data: m.map(
            (a) => [a.timestamp.toDate(), a.values[cat] ?? 0] as const,
          ),
          color:
            colour + (colour.length === 4 ? ALPHA[i]! : ALPHA[i]! + ALPHA[i]!),
          showSymbol: false,
          lineStyle: {
            width: 3,
          },
        })),
      )
  );
}

export type PlayTimesChartData = [
  { name: string; xAxis: Date },
  { xAxis: Date },
][];

export function getPlayTimes(
  playTimes: PlayerAPI["playTimes"],
): PlayTimesChartData {
  return playTimes.map(({ join, leave: leave2 }) => {
    const leave = leave2 ?? now();
    return [
      {
        name: `${hhmm(join)} → ${hhmm(leave)}`,
        xAxis: join.toDate(),
      },
      {
        xAxis: leave.toDate(),
      },
    ];
  });
}

export function getMainChartOption(
  series: echarts.LineSeriesOption[],
  playTimes?: PlayTimesChartData,
): echarts.ComposeOption<
  | echarts.LineSeriesOption
  | echarts.TooltipComponentOption
  | echarts.GridComponentOption
  | echarts.MarkAreaComponentOption
> {
  return {
    backgroundColor: "transparent",
    xAxis: {
      type: "time",
    },
    yAxis: {
      type: "value",
      maxInterval: 1,
      splitLine: {
        lineStyle: {
          color: "#fff3",
        },
      },
      min: 0,
    },
    tooltip: {
      trigger: "axis",
    },
    grid: {
      left: "left",
      width: "100%",
    },
    series: [
      ...series,
      {
        type: "line",
        markArea: {
          label: {
            position: "inside",
          },
          itemStyle: {
            color: "#fc03",
          },
          data: playTimes ?? [],
        },
      },
    ],
  };
}

// eslint-disable-next-line max-params
export async function getMainChart(
  from: dt.ZonedDateTime,
  to: dt.ZonedDateTime,
  movingAverages: number[],
  chartDimensions: [number, number],
): Promise<Buffer<ArrayBufferLike>> {
  const canvas = createCanvas(...chartDimensions);
  const chart = echarts.init(canvas as never);
  const { default: config } = await import("../../config.ts");
  const { getCounts } = await import("../counts.ts");

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
