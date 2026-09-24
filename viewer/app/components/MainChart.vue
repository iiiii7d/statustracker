<script setup lang="ts">
import { use } from "echarts/core";
import { LineChart } from "echarts/charts";
import {
  GridComponent,
  TooltipComponent,
  MarkAreaComponent,
} from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import VChart, { THEME_KEY } from "vue-echarts";
import { counts, loading, player } from "~/state.ts";
import {
  getMainChartOption,
  getPlayTimes,
  getSeries,
} from "#shared/mainChart.ts";

use([
  GridComponent,
  TooltipComponent,
  MarkAreaComponent,
  LineChart,
  CanvasRenderer,
]);
provide(THEME_KEY, "dark");

const { data: categories } = await useFetch("/categories");

const series = computed(() => getSeries(counts.value!, categories.value!));
const playTimes = computed(() =>
  player.value?.ty === "success" && player.value.playTimes
    ? getPlayTimes(player.value.playTimes)
    : undefined,
);
const option = computed(() =>
  getMainChartOption(series.value, playTimes.value),
);
</script>

<template>
  <div class="h-[75svh]!">
    <VChart
      class="chart"
      :option="option"
      autoresize
      :loading="loading !== 0"
    />
  </div>
</template>
