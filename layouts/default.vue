<script setup lang="ts">
const auth = useAuth()
const config = useRuntimeConfig()

const showAuthedNav = computed(() => !!auth.token.value)
</script>

<template>
  <div class="min-h-screen">
    <header class="sticky top-0 z-40 backdrop-blur bg-ink-950/65 border-b border-sand-100/10">
      <div class="container-app h-16 flex items-center justify-between">
        <NuxtLink to="/" class="flex items-baseline gap-2">
          <span class="title text-2xl text-sand-50">{{ config.public.appName }}</span>
          <span class="text-xs text-sand-100/60">boards</span>
        </NuxtLink>

        <nav class="flex items-center gap-2" v-if="showAuthedNav">
          <NuxtLink to="/dashboard" class="text-sm text-sand-100/80 hover:text-sand-50 px-2 py-1 rounded-lg">
            Dashboard
          </NuxtLink>
          <NuxtLink
            v-if="auth.user?.role === 'admin'"
            to="/admin"
            class="text-sm text-sand-100/80 hover:text-sand-50 px-2 py-1 rounded-lg"
          >
            Admin
          </NuxtLink>
          <button
            class="text-sm rounded-xl bg-sand-100/10 hover:bg-sand-100/15 text-sand-50 px-3 py-2 transition"
            @click="auth.logout(); navigateTo('/login')"
          >
            Logout
          </button>
        </nav>

        <nav class="flex items-center gap-2" v-else>
          <NuxtLink to="/login" class="text-sm text-sand-100/80 hover:text-sand-50 px-2 py-1 rounded-lg">
            Login
          </NuxtLink>
          <NuxtLink
            to="/register"
            class="text-sm rounded-xl bg-gold-400/20 hover:bg-gold-400/25 text-sand-50 px-3 py-2 transition"
          >
            Register
          </NuxtLink>
        </nav>
      </div>
    </header>

    <main class="container-app py-8">
      <slot />
    </main>
  </div>
</template>

