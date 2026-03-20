<script setup lang="ts">
type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md'

const props = withDefaults(
  defineProps<{
    variant?: Variant
    size?: Size
    disabled?: boolean
    type?: 'button' | 'submit' | 'reset'
  }>(),
  { variant: 'secondary', size: 'md', disabled: false, type: 'button' }
)

const cls = computed(() => {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-emerald-300/30 disabled:opacity-50 disabled:pointer-events-none'
  const size = props.size === 'sm' ? 'text-xs px-2.5 py-1.5 rounded-lg' : ''
  const variants: Record<Variant, string> = {
    primary:
      'border-transparent bg-[rgba(var(--primary),0.92)] text-white hover:bg-[rgba(var(--primary),1)] shadow-sm',
    secondary: 'border-white/10 bg-white/5 text-slate-100 hover:bg-white/10',
    ghost: 'border-transparent bg-transparent text-slate-200 hover:bg-white/5',
    danger: 'border-white/10 bg-red-500/10 text-red-100 hover:bg-red-500/15'
  }
  return [base, size, variants[props.variant]].filter(Boolean).join(' ')
})
</script>

<template>
  <button :type="type" :disabled="disabled" :class="cls">
    <slot />
  </button>
</template>

