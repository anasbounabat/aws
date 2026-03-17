<script setup lang="ts">
const config = useRuntimeConfig()
</script>

<template>
  <div class="min-h-screen relative overflow-hidden">
    <div class="absolute inset-0">
      <div class="absolute -top-24 -left-24 h-80 w-80 rounded-full bg-leaf-500/15 blur-3xl" />
      <div class="absolute -bottom-28 -right-24 h-96 w-96 rounded-full bg-gold-400/15 blur-3xl" />
      <div class="absolute inset-0 bg-[radial-gradient(1000px_600px_at_20%_0%,rgba(115,197,147,0.12),transparent_60%),radial-gradient(800px_500px_at_100%_40%,rgba(215,189,115,0.12),transparent_60%)]" />
    </div>

    <div class="relative container-app py-10">
      <header class="flex items-center justify-between">
        <NuxtLink to="/" class="flex items-baseline gap-2">
          <span class="title text-2xl text-sand-50">{{ config.public.appName }}</span>
          <span class="text-xs text-sand-100/60">workspace</span>
        </NuxtLink>
      </header>

      <main class="mt-10 flex items-center justify-center">
        <div class="w-full max-w-md">
          <div class="card p-6 md:p-7">
            <slot />
          </div>
          <p class="mt-4 text-center text-xs text-sand-100/60">
            Calm, secure, and minimal.
          </p>
        </div>
      </main>
    </div>
  </div>
</template>

