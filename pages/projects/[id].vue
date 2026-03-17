<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

type TaskStatus = 'TODO' | 'DOING' | 'DONE'
type Task = { id: number; title: string; description: string | null; status: TaskStatus; assigned_to: number | null }
type Asset = { id: number; task_id: number; s3_url: string }

const route = useRoute()
const { $api } = useNuxtApp()

const projectId = computed(() => Number(route.params.id))
const project = ref<{ id: number; name: string; team_id: number; team_name: string } | null>(null)
const tasks = ref<Task[]>([])
const assets = ref<Asset[]>([])

const newTitle = ref('')
const newDescription = ref('')
const error = ref<string | null>(null)
const loading = ref(true)

const columns: { key: TaskStatus; title: string }[] = [
  { key: 'TODO', title: 'To do' },
  { key: 'DOING', title: 'Doing' },
  { key: 'DONE', title: 'Done' }
]

const tasksByStatus = computed(() => {
  const map: Record<TaskStatus, Task[]> = { TODO: [], DOING: [], DONE: [] }
  for (const t of tasks.value) map[t.status].push(t)
  return map
})

function taskAssets(taskId: number) {
  return assets.value.filter((a) => a.task_id === taskId)
}

async function refresh() {
  loading.value = true
  error.value = null
  try {
    const p = await $api<{ project: any }>(`/projects/${projectId.value}`)
    project.value = p.project
    const res = await $api<{ tasks: Task[]; assets: Asset[] }>(`/projects/${projectId.value}/tasks`)
    tasks.value = res.tasks
    assets.value = res.assets
  } catch (e: any) {
    error.value = e?.data?.statusMessage || e?.message || 'Failed to load project'
  } finally {
    loading.value = false
  }
}

async function createTask() {
  if (!newTitle.value.trim()) return
  const res = await $api<{ task: Task }>(`/projects/${projectId.value}/tasks`, {
    method: 'POST',
    body: { title: newTitle.value.trim(), description: newDescription.value.trim() || undefined }
  })
  tasks.value = [res.task, ...tasks.value]
  newTitle.value = ''
  newDescription.value = ''
}

async function updateStatus(task: Task, status: TaskStatus) {
  if (task.status === status) return
  const prev = task.status
  task.status = status
  try {
    const res = await $api<{ task: Task }>(`/tasks/${task.id}`, { method: 'PATCH', body: { status } })
    Object.assign(task, res.task)
  } catch (e) {
    task.status = prev
  }
}

async function removeTask(taskId: number) {
  await $api(`/tasks/${taskId}`, { method: 'DELETE' })
  tasks.value = tasks.value.filter((t) => t.id !== taskId)
  assets.value = assets.value.filter((a) => a.task_id !== taskId)
}

onMounted(refresh)
</script>

<template>
  <div>
    <header class="flex items-end justify-between gap-4">
      <div>
        <NuxtLink to="/dashboard" class="text-sm text-sand-100/70 hover:text-sand-50 underline underline-offset-4">
          Back
        </NuxtLink>
        <h1 class="title text-3xl text-sand-50 mt-2">{{ project?.name || 'Project' }}</h1>
        <p class="text-sm text-sand-100/70 mt-1">{{ project?.team_name }}</p>
      </div>
      <button class="text-sm rounded-xl bg-sand-100/10 hover:bg-sand-100/15 text-sand-50 px-3 py-2 transition" @click="refresh">
        Refresh
      </button>
    </header>

    <div class="mt-6">
      <p v-if="error" class="text-sm text-red-200 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2 mb-4">
        {{ error }}
      </p>
      <div v-if="loading" class="text-sand-100/70">Loading…</div>

      <template v-else>
        <section class="card p-5">
          <h2 class="title text-2xl">New task</h2>
          <p class="muted text-sm mt-1">Write a clear title and keep descriptions short.</p>
          <div class="mt-4 grid md:grid-cols-3 gap-2">
            <input v-model="newTitle" placeholder="Title" class="input md:col-span-1" />
            <input
              v-model="newDescription"
              placeholder="Description (optional)"
              class="input md:col-span-2"
            />
          </div>
          <div class="mt-3">
            <button class="btn-primary" @click="createTask">Add task</button>
          </div>
        </section>

        <section class="mt-6 grid md:grid-cols-3 gap-4">
          <div v-for="c in columns" :key="c.key" class="card p-5">
            <div class="flex items-center justify-between">
              <h3 class="title text-xl">{{ c.title }}</h3>
              <div class="pill">{{ tasksByStatus[c.key].length }}</div>
            </div>

            <div class="mt-4 space-y-3">
              <div
                v-for="t in tasksByStatus[c.key]"
                :key="t.id"
                class="rounded-2xl border border-ink-950/10 bg-sand-50 p-3 hover:border-ink-950/20 transition"
              >
                <div class="flex items-start justify-between gap-2">
                  <div class="font-medium">{{ t.title }}</div>
                  <button class="text-xs text-red-700 underline underline-offset-4" @click="removeTask(t.id)">
                    Delete
                  </button>
                </div>
                <div v-if="t.description" class="text-sm text-slate-600 mt-1">
                  {{ t.description }}
                </div>

                <div class="mt-3 flex items-center gap-2">
                  <label class="text-xs text-ink-950/55">Status</label>
                  <select
                    class="text-sm rounded-xl bg-sand-100 border border-ink-950/10 px-2 py-1 focus:outline-none focus:ring-2 focus:ring-gold-400/50"
                    :value="t.status"
                    @change="updateStatus(t, ($event.target as HTMLSelectElement).value as any)"
                  >
                    <option value="TODO">TODO</option>
                    <option value="DOING">DOING</option>
                    <option value="DONE">DONE</option>
                  </select>
                </div>

                <div v-if="taskAssets(t.id).length" class="mt-3">
                  <div class="text-xs text-ink-950/55">Assets</div>
                  <ul class="mt-1 space-y-1">
                    <li v-for="a in taskAssets(t.id)" :key="a.id" class="text-xs text-ink-950/70 break-all">
                      {{ a.s3_url }}
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>
      </template>
    </div>
  </div>
</template>

