<script setup lang="ts">
import { use } from "echarts/core";
import { BarChart } from "echarts/charts";
import { GridComponent, TitleComponent } from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import VChart, { THEME_KEY } from "vue-echarts";
import { getPercentOnlineChartOption } from "#shared/percentOnlineChart.ts";
import { percentages } from "~/state.ts";

use([GridComponent, BarChart, TitleComponent, CanvasRenderer]);
provide(THEME_KEY, "dark");

const { data: categories } = await useFetch("/categories");

const option = computed(() =>
  getPercentOnlineChartOption(categories.value!, percentages.value),
);
</script>

<template>
  <VChart class="chart h-[75dvh]!" :option="option" :autoresize="true" />
</template>

<style scoped></style>
