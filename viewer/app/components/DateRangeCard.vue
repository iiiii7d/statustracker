<script setup lang="ts">
import { from, to, dateInvalid } from "~/state.ts";
import * as dt from "@internationalized/date";
import { z } from "zod/v4";
import now from "#shared/now";

const { locale } = new Intl.NumberFormat().resolvedOptions();

const initFromTo = computed(() => {
  const { query: routeQuery } = useRoute();
  const result = z
    .object({
      from: z.iso
        .datetime({ local: false, offset: true })
        .transform((s) => dt.parseAbsoluteToLocal(s))
        .default(now().subtract({ days: 1 })),
      to: z.iso
        .datetime({ local: false, offset: true })
        .transform((s) => dt.parseAbsoluteToLocal(s))
        .default(now().add({ minutes: 1 })),
    })
    .refine(
      ({ from: f, to: t }) =>
        !(f instanceof dt.ZonedDateTime) ||
        !(t instanceof dt.ZonedDateTime) ||
        f.compare(t) < 0,
      { error: "`to` is earlier than `from`" },
    )
    .safeParse(routeQuery);
  if (!result.success)
    throw createError({
      statusCode: 400,
      message: z.prettifyError(result.error),
      data: JSON.parse(result.error.message),
    });

  return result.data;
});

onMounted(() => {
  from.value = initFromTo.value.from;
  to.value = initFromTo.value.to;
});

function setPreset(d: dt.DateDuration) {
  from.value = now().subtract(d);
  to.value = now();
}
</script>

<template>
  <UCard
    class="flex flex-col justify-center"
    :class="{ 'ring-error': dateInvalid && from && to }"
  >
    <div>
      <UInputDate
        v-model="from"
        :hour-cycle="24"
        :is-date-unavailable="() => dateInvalid"
        :color="dateInvalid ? 'error' : 'primary'"
        hide-time-zone
        :default-placeholder="now()"
        :locale="locale"
      />
    </div>
    <UIcon
      name="lucide:arrow-down"
      class="size-5 mt-1.5"
      :class="{ 'text-error': dateInvalid && from && to }"
    />
    <div>
      <UInputDate
        v-model="to"
        :hour-cycle="24"
        :is-date-unavailable="() => dateInvalid"
        :color="dateInvalid ? 'error' : 'primary'"
        hide-time-zone
        :default-placeholder="now()"
        :locale="locale"
      />
    </div>
    <p class="mt-2">
      <span>Presets: Past </span>
      <UButton @click="setPreset({ days: 1 })">Day</UButton>
      <UButton @click="setPreset({ weeks: 1 })">Week</UButton>
      <UButton @click="setPreset({ months: 1 })">Month</UButton>
      <UButton @click="setPreset({ years: 1 })">Year</UButton>
    </p>
  </UCard>
</template>
