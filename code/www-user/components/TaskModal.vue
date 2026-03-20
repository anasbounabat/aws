<script setup lang="ts">
type Status = 'TODO' | 'DOING' | 'DONE'

const props = defineProps<{
  open: boolean
  task: any | null
}>()

const emit = defineEmits<{ (e: 'close'): void; (e: 'saved'): void; (e: 'deleted'): void }>()

const { $api } = useNuxtApp() as any
const toast = useToast()

const title = ref('')
const description = ref('')
const status = ref<Status>('TODO')
const saving = ref(false)
const deleting = ref(false)

watch(
  () => props.task,
  (t) => {
    title.value = t?.title || ''
    description.value = t?.description || ''
    status.value = (t?.status as Status) || 'TODO'
  },
  { immediate: true }
)

async function save() {
  if (!props.task) return
  saving.value = true
  try {
    await $api(`/tasks/${props.task.id}`, {
      method: 'PATCH',
      body: { title: title.value.trim(), description: description.value.trim() || null }
    })
    await $api(`/tasks/${props.task.id}/status`, { method: 'PATCH', body: { status: status.value } })
    toast.push({ kind: 'success', title: 'Task updated' })
    emit('saved')
  } catch (e: any) {
    toast.push({ kind: 'error', title: 'Update failed', message: e?.message || 'Please try again' })
  } finally {
    saving.value = false
  }
}

async function del() {
  if (!props.task) return
  deleting.value = true
  try {
    await $api(`/tasks/${props.task.id}`, { method: 'DELETE' })
    toast.push({ kind: 'success', title: 'Task deleted' })
    emit('deleted')
  } catch (e: any) {
    toast.push({ kind: 'error', title: 'Delete failed', message: e?.message || 'Please try again' })
  } finally {
    deleting.value = false
  }
}
</script>

<template>
  <div v-if="open" class="space-y-4">
    <div v-if="!task" class="text-slate-300 text-sm">No task selected.</div>
    <div v-else class="space-y-4">
      <div class="grid gap-3 sm:grid-cols-2">
        <AppField label="Titre">
          <AppInput v-model="title" placeholder="Task title" />
        </AppField>
        <AppField label="Status">
          <select
            v-model="status"
            class="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-slate-50 outline-none focus:ring-2 focus:ring-emerald-300/30"
          >
            <option value="TODO">A faire</option>
            <option value="DOING">En cours</option>
            <option value="DONE">Termine</option>
          </select>
        </AppField>
      </div>

      <AppField label="Description" hint="optionnel">
        <AppTextarea v-model="description" placeholder="Add more context…" :rows="6" />
      </AppField>

      <div class="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/10">
        <NuxtLink :to="`/tasks/${task.id}/assets`">
          <AppButton variant="secondary" size="sm">Attachments</AppButton>
        </NuxtLink>
        <div class="flex gap-2">
          <AppButton variant="danger" size="sm" :disabled="deleting" @click="del">
            {{ deleting ? 'Deleting…' : 'Delete' }}
          </AppButton>
          <AppButton variant="primary" size="sm" :disabled="saving || !title.trim()" @click="save">
            {{ saving ? 'Saving…' : 'Save' }}
          </AppButton>
        </div>
      </div>
    </div>
  </div>
</template>

