<script setup lang="ts">
withDefaults(
  defineProps<{
    modelValue: string
    placeholder?: string
    type?: string
    disabled?: boolean
    autocomplete?: string
  }>(),
  { type: 'text', disabled: false }
)

defineEmits<{ (e: 'update:modelValue', v: string): void }>()
</script>

<template>
  <input
    :value="modelValue"
    :type="type"
    :placeholder="placeholder"
    :disabled="disabled"
    :autocomplete="autocomplete"
    class="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-slate-50 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-emerald-300/30 disabled:opacity-70"
    @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
  />
</template>

