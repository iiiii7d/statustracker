<script setup lang="ts">
import { loading } from "~/state.ts";
</script>

<template>
  <UProgress
    class="sticky w-3/4 left-1/8 top-0 transition-transform -translate-y-2 duration-500"
    :class="{ 'translate-y-4': loading !== 0 }"
  />
</template>
