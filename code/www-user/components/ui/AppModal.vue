<script setup lang="ts">
const props = defineProps<{
  open: boolean
  title: string
  description?: string
}>()

const emit = defineEmits<{ (e: 'close'): void }>()

function onBackdrop(e: MouseEvent) {
  if (e.target === e.currentTarget) emit('close')
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="props.open"
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
      @mousedown="onBackdrop"
    >
      <div class="absolute inset-0 bg-black/55 backdrop-blur-xl" />
      <div
        class="relative w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-slate-950/70 shadow-xl backdrop-blur-xl"
      >
        <div class="p-4 border-b border-white/10 flex items-start justify-between gap-4">
          <div>
            <div class="text-lg font-semibold">{{ title }}</div>
            <div v-if="description" class="text-sm text-slate-300 mt-0.5">{{ description }}</div>
          </div>
          <AppButton variant="ghost" size="sm" @click="$emit('close')">Fermer</AppButton>
        </div>
        <div class="p-4">
          <slot />
        </div>
      </div>
    </div>
  </Teleport>
</template>

