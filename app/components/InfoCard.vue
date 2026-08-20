<script setup lang="ts"></script>
<template>
  <UCard class="content-center">
    <p class="font-bold text-5xl text-primary">
      StatusTracker v{{ $config.public.clientVersion }}
    </p>
    <p class="mt-2 *:mx-2">
      <ULink href="https://github.com/iiiii7d/statustracker">
        <UIcon name="simple-icons:github" class="size-4 translate-y-0.5" />
        GitHub
      </ULink>
      <ULink href="https://tangled.org/777d.tngl.sh/statustracker">
        <UIcon
          name="lucide:mirror-rectangular"
          class="size-4 translate-y-0.5"
        /><UIcon name="simple-icons:tangled" class="size-4 translate-y-0.5" />
        Tangled
      </ULink>
      <ULink href="/licenses.txt">
        <UIcon name="lucide:scroll" class="size-4 translate-y-0.5" /> Licences
      </ULink>
    </p>
  </UCard>
</template>
