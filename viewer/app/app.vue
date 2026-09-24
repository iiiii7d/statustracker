<script setup lang="ts">
const route = useRoute();
if (route.path !== "/")
  throw createError({
    statusCode: 404,
    statusMessage: "Not Found",
  });
</script>
<template>
  <UApp>
    <UMain class="mx-8">
      <MainChart />
      <section
        id="input"
        class="select-none flex flex-wrap gap-5 justify-center text-center *:grow-3 min-h-[20svh]"
      >
        <InfoCard />
        <DateRangeCard />
        <PlayerCard />
        <RollingAvgCard />
      </section>
      <USeparator class="m-8" />
      <LazyPercentOnlineChart hydrate-on-visible />
    </UMain>
  </UApp>
</template>
