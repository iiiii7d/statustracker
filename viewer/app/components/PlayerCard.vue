<script setup lang="ts">
import { player, playerUsername } from "~/state.ts";

const playDuration = computed(() => {
  if (player.value?.ty !== "success") {
    return null;
  }
  const h = Math.floor(player.value.playDuration / 60);
  const m = player.value.playDuration % 60;
  return `${h}h ${m}min`;
});
</script>

<template>
  <UCard class="text-wrap w-sm content-center">
    <p><label for="player">Show play time for</label></p>
    <UInput
      id="player"
      v-model="playerUsername"
      class="mt-2"
      placeholder="player username"
    >
      <template v-if="playerUsername" #trailing>
        <UIcon
          class="cursor-pointer"
          name="lucide:x"
          @click="playerUsername = ''"
        />
      </template>
    </UInput>

    <UCollapsible :open="playerUsername !== ''" class="mt-2">
      <template #content>
        <UProgress
          v-if="player?.username !== playerUsername"
          id="player-stats"
          class="px-8"
        />
        <template v-else-if="player?.ty === 'noPlayer'">
          No such player <b>{{ playerUsername }}</b>
        </template>
        <template
          v-else-if="player?.ty === 'success' && player.playTimes.length === 0"
        >
          <b>{{ playerUsername }}</b> did not join within this time period
        </template>
        <template
          v-else-if="player?.ty === 'success' && player.playDuration !== 0"
        >
          <b>{{ playerUsername }}</b> played for
          <b>{{ playDuration }}</b> within this time period
        </template>
      </template>
    </UCollapsible>
  </UCard>
</template>
