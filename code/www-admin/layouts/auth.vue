<template>
  <div class="min-h-screen bg-[rgb(var(--bg))]">
    <img
      :src="'/images/logo.jpg'"
      alt="logo"
      class="absolute top-4 right-4 w-24 h-16 object-cover rounded-lg opacity-90"
      onerror="this.style.display='none'"
    />
    <div class="grid min-h-screen place-items-center p-6">
      <div class="w-full max-w-sm">
        <div class="mb-6 text-center">
          <div
            class="app-border mx-auto grid h-10 w-10 place-items-center rounded-2xl border bg-[rgba(var(--primary),0.18)] text-lg font-semibold text-slate-100"
          >
            A
          </div>
          <div class="app-title mt-3 text-lg font-semibold text-slate-100">Admin</div>
          <div class="text-sm text-slate-400">Connexion admin</div>
        </div>
        <slot />
      </div>
    </div>
  </div>
</template>
