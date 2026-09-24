<script setup lang="ts">
import { shownMovingAverages } from "~/state.ts";
</script>

<template>
  <UCard class="content-center">
    <p>Rolling Averages</p>
    <p class="mt-2 text-wrap">
      <CheckboxButton v-model="shownMovingAverages[0]">Raw</CheckboxButton>
      <CheckboxButton v-model="shownMovingAverages[1]">1h</CheckboxButton>
      <CheckboxButton v-model="shownMovingAverages[12]">12h</CheckboxButton>
      <CheckboxButton v-model="shownMovingAverages[24]">1d</CheckboxButton>
      <CheckboxButton v-model="shownMovingAverages[168]">7d</CheckboxButton>
    </p>
  </UCard>
</template>
