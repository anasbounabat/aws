<script setup lang="ts">
withDefaults(
  defineProps<{
    padded?: boolean
  }>(),
  { padded: true }
)
</script>

<template>
  <section :class="['rounded-2xl border surface shadow-sm', padded ? 'p-4' : '']">
    <slot />
  </section>
</template>

