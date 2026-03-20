<template>
  <div class="min-h-screen bg-[rgb(var(--bg))]">
    <div class="min-h-screen grid place-items-center p-6">
      <div class="w-full max-w-sm">
        <div class="mb-6 text-center">
          <div class="mx-auto h-10 w-10 rounded-2xl bg-[rgba(var(--primary),0.18)] app-border border grid place-items-center text-slate-100 font-semibold">
            B
          </div>
          <div class="mt-3 app-title text-lg font-semibold text-slate-100">Boards</div>
          <div class="text-sm text-slate-400">Sign in to continue</div>
        </div>
        <slot />
      </div>
    </div>
  </div>
  <AppToastHost />
</template>

