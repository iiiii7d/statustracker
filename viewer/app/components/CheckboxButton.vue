<script setup lang="ts">
const checked = defineModel<boolean>({ default: false });
</script>

<template>
  <UButton :variant="checked ? 'solid' : 'soft'" @click="checked = !checked">
    <slot />
  </UButton>
</template>
