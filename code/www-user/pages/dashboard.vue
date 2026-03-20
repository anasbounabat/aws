<script setup lang="ts">
definePageMeta({ middleware: ['require-auth'] })

import draggable from 'vuedraggable'

const auth = useAuth()
// @ts-ignore
const { $api } = useNuxtApp()

const loading = ref(true)
const toast = useToast()

type Status = 'TODO' | 'DOING' | 'DONE'

const route = useRoute()
const router = useRouter()

const teams = ref<any[]>([])
const selectedTeamId = computed<string | null>(() => {
  const v = route.query.team
  if (!v) return null
  return Array.isArray(v) ? String(v[0]).trim() : String(v).trim()
})

const team = ref<any | null>(null)
const members = ref<any[]>([])
const projects = ref<any[]>([])
const selectedProjectId = ref<string | null>(null)

const tasks = ref<any[]>([])
const activeTask = ref<any | null>(null)
const taskOpen = computed(() => !!activeTask.value)

const columns: { key: Status; label: string; color: string; shadow: string }[] = [
  { key: 'TODO', label: 'À faire', color: 'bg-slate-400', shadow: '' },
  { key: 'DOING', label: 'En cours', color: 'bg-indigo-400', shadow: 'shadow-[0_0_8px_rgba(129,140,248,0.8)]' },
  { key: 'DONE', label: 'Terminé', color: 'bg-emerald-400', shadow: 'shadow-[0_0_8px_rgba(52,211,153,0.8)]' }
]

const listByStatus = computed<Record<Status, any[]>>(() => {
  const out: Record<Status, any[]> = { TODO: [], DOING: [], DONE: [] }
  for (const t of tasks.value) {
    const s = (t.status || 'TODO') as Status
    if (s === 'TODO' || s === 'DOING' || s === 'DONE') out[s].push(t)
  }
  return out
})

// Forms
const teamCreateOpen = ref(false)
const teamName = ref('')
const creatingTeam = ref(false)

const inviteOpen = ref(false)
const inviteEmail = ref('')
const inviting = ref(false)

// Inline Project Creation
const projectName = ref('')
const projectDescription = ref('')
const creatingProject = ref(false)

// Inline Task Creation
const showTaskForm = ref(false)
const taskTitle = ref('')
const taskDescription = ref('')
const taskFiles = ref<File[]>([])
const creatingTask = ref(false)

function closeAllModals() {
  teamCreateOpen.value = false
  inviteOpen.value = false
}

function openTeamCreateModal() {
  closeAllModals()
  teamName.value = ''
  teamCreateOpen.value = true
}

function openInviteModal() {
  if (!selectedTeamId.value) return
  closeAllModals()
  inviteEmail.value = ''
  inviteOpen.value = true
}

const quickTitle = ref<Record<Status, string>>({ TODO: '', DOING: '', DONE: '' })
const quickCreating = ref<Record<Status, boolean>>({ TODO: false, DOING: false, DONE: false })

async function refreshTeams() {
  const t = await $api('/teams')
  teams.value = t.teams || []
}

async function refreshTeamContext() {
  if (!selectedTeamId.value) {
    team.value = null
    members.value = []
    projects.value = []
    selectedProjectId.value = null
    tasks.value = []
    return
  }
  const id = selectedTeamId.value
  team.value = (await $api(`/teams/${id}`)).team
  members.value = (await $api(`/teams/${id}/members`)).members || []
  projects.value = (await $api(`/teams/${id}/projects`)).projects || []
  if (!selectedProjectId.value && projects.value[0]) {
    selectedProjectId.value = String(projects.value[0].id)
  }
}

async function refreshTasks() {
  if (!selectedProjectId.value) {
    tasks.value = []
    return
  }
  tasks.value = (await $api(`/projects/${selectedProjectId.value}/tasks`)).tasks || []
}

async function createTeam() {
  if (!teamName.value.trim()) return
  creatingTeam.value = true
  try {
    const res = await $api('/teams', { method: 'POST', body: { name: teamName.value.trim() } })
    toast.push({ kind: 'success', title: 'Équipe créée avec succès' })
    teamName.value = ''
    teamCreateOpen.value = false
    await refreshTeams()
    const newId = String(res.team?.id || '')
    if (newId) {
      await router.push({ path: '/dashboard', query: { team: newId } })
    }
  } catch (e: any) {
    toast.push({ kind: 'error', title: 'Erreur création équipe', message: e?.message || 'Réessayez' })
  } finally {
    creatingTeam.value = false
  }
}

async function invite() {
  if (!selectedTeamId.value || !inviteEmail.value.trim()) return
  inviting.value = true
  try {
    await $api(`/teams/${selectedTeamId.value}/invitations`, { method: 'POST', body: { email: inviteEmail.value.trim() } })
    toast.push({ kind: 'success', title: 'Invitation envoyée' })
    inviteEmail.value = ''
    inviteOpen.value = false
  } catch (e: any) {
    toast.push({ kind: 'error', title: "Erreur d'invitation", message: e?.message || 'Réessayez' })
  } finally {
    inviting.value = false
  }
}

async function createProject() {
  if (!selectedTeamId.value) {
    toast.push({ kind: 'error', title: 'Veuillez d\'abord sélectionner une équipe' })
    return
  }
  if (!projectName.value.trim()) return
  creatingProject.value = true
  try {
    const res = await $api(`/teams/${selectedTeamId.value}/projects`, {
      method: 'POST',
      body: { name: projectName.value.trim(), description: projectDescription.value.trim() || null }
    })
    toast.push({ kind: 'success', title: 'Projet créé avec succès' })
    projectName.value = ''
    projectDescription.value = ''
    await refreshTeamContext()
    const pid = String(res.project?.id || '')
    if (pid) {
      selectedProjectId.value = pid
      await refreshTasks()
    }
  } catch (e: any) {
    toast.push({ kind: 'error', title: 'Erreur création projet', message: e?.message || 'Réessayez' })
  } finally {
    creatingProject.value = false
  }
}

async function setStatus(taskId: string, status: Status) {
  await $api(`/tasks/${taskId}/status`, { method: 'PATCH', body: { status } })
}

async function uploadFilesToTask(taskId: string, files: File[]) {
  for (const f of files) {
    const res = await $api(`/tasks/${taskId}/assets`, {
      method: 'POST',
      body: { filename: f.name, contentType: f.type || 'application/octet-stream' }
    })
    const url = res.uploadUrl || res.url
    if (!url) throw new Error('Missing uploadUrl')
    await $fetch(url, { method: 'PUT', body: f, headers: { 'Content-Type': f.type || 'application/octet-stream' } })
  }
}

async function createTask() {
  if (!selectedProjectId.value) {
    toast.push({ kind: 'error', title: 'Veuillez d\'abord sélectionner un projet' })
    return
  }
  if (!taskTitle.value.trim()) return
  creatingTask.value = true
  try {
    const created = await $api(`/projects/${selectedProjectId.value}/tasks`, {
      method: 'POST',
      body: { title: taskTitle.value.trim(), description: taskDescription.value.trim() || null }
    })
    const tid = String(created.task?.id || '')
    if (tid && taskFiles.value.length) {
      await uploadFilesToTask(tid, taskFiles.value)
      toast.push({ kind: 'success', title: 'Tâche & fichiers ajoutés' })
    } else {
      toast.push({ kind: 'success', title: 'Tâche créée avec succès' })
    }
    taskTitle.value = ''
    taskDescription.value = ''
    taskFiles.value = []
    showTaskForm.value = false
    await refreshTasks()
  } catch (e: any) {
    toast.push({ kind: 'error', title: 'Erreur création tâche', message: e?.message || 'Réessayez' })
  } finally {
    creatingTask.value = false
  }
}

async function quickAdd(status: Status) {
  if (!selectedProjectId.value) return
  const title = quickTitle.value[status].trim()
  if (!title) return
  quickCreating.value[status] = true
  try {
    const created = await $api(`/projects/${selectedProjectId.value}/tasks`, {
      method: 'POST',
      body: { title, description: null }
    })
    const tid = String(created.task?.id || '')
    if (tid && status !== 'TODO') await setStatus(tid, status)
    quickTitle.value[status] = ''
    await refreshTasks()
    toast.push({ kind: 'success', title: 'Tâche ajoutée' })
  } catch (e: any) {
    toast.push({ kind: 'error', title: 'Erreur ajout rapide', message: e?.message || 'Réessayez' })
  } finally {
    quickCreating.value[status] = false
  }
}

async function onMoved(status: Status, evt: any) {
  const moved = evt?.added?.element || null
  if (!moved?.id) return
  try {
    await setStatus(String(moved.id), status)
    toast.push({ kind: 'success', title: 'Tâche déplacée' })
    await refreshTasks()
  } catch (e: any) {
    toast.push({ kind: 'error', title: 'Erreur de déplacement', message: e?.message || 'Réessayez' })
    await refreshTasks()
  }
}

onMounted(async () => {
  await auth.loadMe()
  loading.value = true
  try {
    await refreshTeams()
    if (!selectedTeamId.value && teams.value[0]) {
      await router.replace({ path: '/dashboard', query: { team: String(teams.value[0].id) } })
    }
    await refreshTeamContext()
    await refreshTasks()
  } finally {
    loading.value = false
  }
})

watch(
  () => selectedTeamId.value,
  async () => {
    await refreshTeamContext()
    await refreshTasks()
  }
)
</script>

<template>
  <div class="space-y-6 md:space-y-8">
    <header class="flex flex-col md:flex-row md:items-end justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400 tracking-tight">Tableau de Bord</h1>
        <p class="text-sm text-slate-400 mt-1">Gérez vos équipes, projets et toutes vos tâches au même endroit sans clics superflus.</p>
      </div>
      <div class="flex flex-wrap items-center gap-3">
        <AppButton variant="secondary" @click="openInviteModal" class="hover:shadow-glow transition-all">Inviter Membre</AppButton>
      </div>
    </header>

    <div v-if="loading" class="flex flex-col items-center justify-center min-h-[400px] space-y-4">
      <div class="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-400 rounded-full animate-spin"></div>
      <div class="text-sm font-medium text-slate-400 animate-pulse tracking-wide">Chargement de votre espace...</div>
    </div>

    <div v-else class="grid gap-6 xl:grid-cols-12 min-h-screen">
      <section class="xl:col-span-3 lg:col-span-4 space-y-5">
        
        <!-- Team Selector -->
        <div class="rounded-2xl app-border border app-surface p-5 relative overflow-hidden group">
          <div class="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition duration-500"></div>
          <div class="relative z-10 flex justify-between items-start">
            <div>
              <div class="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                <span class="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"></span>
                Espace Équipe
              </div>
              <div class="text-lg text-slate-50 font-semibold leading-tight">
                {{ team?.name || 'Aucune équipe sélectionnée' }}
              </div>
            </div>
            <AppButton size="sm" variant="ghost" class="shrink-0 p-1.5 bg-white/5 hover:bg-white/10" @click="openTeamCreateModal">
              + Équipe
            </AppButton>
          </div>
        </div>

        <!-- INLINE - Create Project -->
        <div v-if="selectedTeamId" class="rounded-2xl app-border border bg-indigo-500/5 border-indigo-500/20 p-4">
          <div class="text-xs font-semibold text-indigo-300 uppercase tracking-widest mb-3">Nouveau Projet</div>
          <div class="flex flex-col gap-3">
            <input
              v-model="projectName"
              type="text"
              class="w-full rounded-lg border border-indigo-500/20 bg-black/40 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:ring-1 focus:ring-indigo-500 transition-all shadow-inner"
              placeholder="Nom du projet..."
              @keydown.enter.prevent="createProject"
            />
            <AppButton variant="primary" class="w-full shadow-glow" :disabled="creatingProject || !projectName.trim()" @click="createProject">
              {{ creatingProject ? 'Création…' : 'Créer le projet' }}
            </AppButton>
          </div>
        </div>

        <!-- Projects List -->
        <div class="rounded-2xl app-border border app-surface p-5 max-h-[40vh] overflow-y-auto custom-scrollbar">
          <div class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Vos Projets</div>
          <div v-if="!projects.length" class="text-xs text-slate-500 text-center py-4">
            Rien à afficher. Créez votre premier projet ci-dessus.
          </div>
          <ul v-else class="space-y-1.5">
            <li v-for="p in projects" :key="p.id">
              <button
                class="w-full text-left rounded-xl px-3 py-2.5 text-sm transition-all duration-200 border"
                :class="String(p.id) === String(selectedProjectId) ? 'bg-indigo-500/10 text-indigo-200 border-indigo-500/30 font-medium' : 'text-slate-300 border-transparent hover:bg-white/5 hover:border-white/10'"
                @click="
                  () => {
                    selectedProjectId = String(p.id)
                    refreshTasks()
                  }
                "
              >
                <div class="flex items-center justify-between gap-2">
                  <span class="truncate">{{ p.name }}</span>
                </div>
              </button>
            </li>
          </ul>
        </div>
      </section>

      <!-- Missions (Kanban) Section -->
      <section class="xl:col-span-9 lg:col-span-8 space-y-4">
        
        <div v-if="!selectedProjectId" class="h-full min-h-[500px] rounded-2xl app-border border app-surface p-8 text-center text-slate-300 flex flex-col justify-center items-center gap-4 relative overflow-hidden group">
          <div class="relative z-10 text-4xl mb-2 grayscale opacity-50">📂</div>
          <div class="relative z-10 text-lg font-medium text-slate-200">En attente de projet</div>
          <p class="relative z-10 text-sm text-slate-400 max-w-sm">Utilisez le panneau de gauche pour créer ou sélectionner un projet afin de gérer les tâches.</p>
        </div>

        <section v-else class="h-full flex flex-col">
          
          <!-- INLINE - Create Task Form -->
          <div class="mb-6 rounded-2xl app-border border app-surface p-5 shadow-soft">
            <div class="flex items-center justify-between cursor-pointer" @click="showTaskForm = !showTaskForm">
              <div class="text-sm font-semibold text-slate-200 tracking-wide flex items-center gap-2">
                <span class="text-indigo-400 font-bold">+</span> Créer une nouvelle Tâche dans ce projet
              </div>
              <div class="text-slate-500 text-xs">
                {{ showTaskForm ? 'Masquer' : 'Afficher le formulaire' }}
              </div>
            </div>
            
            <div v-if="showTaskForm" class="mt-4 pt-4 border-t border-white/5 flex flex-col gap-4 animate-in fade-in slide-in-from-top-4 duration-300">
              <div class="grid md:grid-cols-2 gap-4">
                <input
                  v-model="taskTitle"
                  type="text"
                  class="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:ring-1 focus:ring-indigo-500 transition-all shadow-inner"
                  placeholder="Titre de la tâche..."
                />
                <input
                  v-model="taskDescription"
                  type="text"
                  class="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:ring-1 focus:ring-indigo-500 transition-all shadow-inner"
                  placeholder="Description (optionnelle)..."
                />
              </div>
              <div class="border border-white/5 rounded-xl bg-black/10 overflow-hidden">
                <div class="text-xs text-slate-400 font-medium px-4 py-2 bg-black/20 border-b border-white/5">Fichiers liés (Glisser-Déposer l'image S3)</div>
                <div class="p-4">
                  <TaskImageUpload v-model:files="taskFiles" />
                </div>
              </div>
              <div class="flex justify-end">
                <AppButton variant="primary" class="shadow-glow px-8" :disabled="creatingTask || !taskTitle.trim()" @click="createTask">
                  {{ creatingTask ? 'Création…' : 'Ajouter la tâche' }}
                </AppButton>
              </div>
            </div>
          </div>

          <!-- Kanban Board -->
          <div class="flex gap-4 overflow-x-auto pb-4 custom-scrollbar h-full items-start flex-1 min-h-[500px]">
            <div
              v-for="c in columns"
              :key="c.key"
              class="min-w-[320px] w-[320px] h-full rounded-2xl bg-black/20 border border-white/5 p-4 flex flex-col relative overflow-hidden"
            >
              <!-- Top Color Accent -->
              <div class="absolute top-0 left-0 w-full h-1" :class="{
                'bg-gradient-to-r from-slate-500 to-slate-400': c.key === 'TODO',
                'bg-gradient-to-r from-indigo-500 to-purple-500': c.key === 'DOING',
                'bg-gradient-to-r from-emerald-500 to-teal-500': c.key === 'DONE'
              }"></div>

              <div class="flex items-center justify-between mb-4 mt-1">
                <div class="flex items-center gap-2.5">
                  <div class="h-2.5 w-2.5 rounded-full" :class="[c.color, c.shadow]"></div>
                  <div class="text-sm font-semibold text-slate-200 tracking-wide">{{ c.label }}</div>
                  <span class="text-xs rounded-full bg-white/5 border border-white/10 px-2 py-0.5 text-slate-300 font-medium ml-1">
                    {{ listByStatus[c.key].length }}
                  </span>
                </div>
              </div>

              <!-- Quick Add Input -->
              <div class="mb-4">
                <input
                  v-model="quickTitle[c.key]"
                  class="w-full rounded-lg border border-white/5 bg-black/40 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all shadow-inner"
                  placeholder="Tâche rapide (Entrée)..."
                  @keydown.enter.prevent="quickAdd(c.key)"
                />
              </div>

              <!-- Draggable Board -->
              <draggable
                :list="listByStatus[c.key]"
                group="tasks"
                item-key="id"
                class="space-y-3 min-h-[200px] flex-1 pb-4"
                ghost-class="opacity-50 ring-2 ring-indigo-500/50 scale-95"
                drag-class="cursor-grabbing"
                @change="(evt) => onMoved(c.key, evt)"
              >
                <template #item="{ element: t }">
                  <div
                    class="rounded-xl border border-white/10 app-card p-4 hover:-translate-y-1 hover:shadow-glow cursor-grab active:cursor-grabbing group relative overflow-hidden transition-all duration-300"
                    @click="activeTask = t"
                  >
                    <div class="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition duration-300"></div>
                    <div class="relative z-10 flex flex-col gap-2">
                      <div class="text-slate-100 font-medium leading-snug break-words group-hover:text-indigo-200 transition-colors">{{ t.title }}</div>
                      <div v-if="t.description" class="text-xs text-slate-400 line-clamp-2 leading-relaxed">{{ t.description }}</div>
                    </div>
                    <div class="relative z-10 mt-3 pt-3 border-t border-white/5 flex items-center justify-between gap-2">
                      <div class="text-[10px] text-slate-500 font-mono">#{{ t.id }}</div>
                      <div class="flex gap-2">
                        <NuxtLink :to="`/tasks/${t.id}/assets`" @click.stop class="text-[11px] font-medium text-slate-400 hover:text-indigo-300 transition-colors bg-white/5 px-2 py-1 rounded">
                          📎 Fichiers S3
                        </NuxtLink>
                      </div>
                    </div>
                  </div>
                </template>
              </draggable>
            </div>
          </div>
        </section>
      </section>
    </div>

    <!-- Remaining Modals -->
    <AppModal :open="teamCreateOpen" title="Créer une équipe" description="Donnez un nom clair à votre nouvelle équipe." @close="teamCreateOpen = false">
      <div class="space-y-4">
        <AppField label="Nom de l'équipe">
          <AppInput v-model="teamName" placeholder="Ex: Direction commerciale" @keydown.enter.prevent="createTeam" />
        </AppField>
        <div class="flex justify-end gap-3 mt-4">
          <AppButton variant="ghost" @click="teamCreateOpen = false">Annuler</AppButton>
          <AppButton variant="primary" :disabled="creatingTeam || !teamName.trim()" @click="createTeam" class="shadow-glow">
            {{ creatingTeam ? 'Création en cours…' : 'Créer l\'équipe' }}
          </AppButton>
        </div>
      </div>
    </AppModal>

    <AppModal
      :open="inviteOpen"
      title="Inviter un membre"
      description="Envoyez une invitation par e-mail pour rejoindre l'équipe."
      @close="inviteOpen = false"
    >
      <div class="space-y-4">
        <AppField label="Adresse E-mail">
          <AppInput v-model="inviteEmail" type="email" autocomplete="email" placeholder="collaborateur@entreprise.com" @keydown.enter.prevent="invite" />
        </AppField>
        <div class="flex justify-end gap-3 mt-4">
          <AppButton variant="ghost" @click="inviteOpen = false">Annuler</AppButton>
          <AppButton variant="secondary" :disabled="inviting || !inviteEmail.trim() || !selectedTeamId" @click="invite">
            {{ inviting ? 'Envoi…' : 'Envoyer l\'invitation' }}
          </AppButton>
        </div>
      </div>
    </AppModal>

    <AppDrawer :open="taskOpen" :title="activeTask?.title || 'Mission'" :description="`Tâche #${activeTask?.id || ''}`" @close="activeTask = null">
      <TaskModal
        :open="true"
        :task="activeTask"
        @close="activeTask = null"
        @saved="
          () => {
            activeTask = null
            refreshTasks()
          }
        "
        @deleted="
          () => {
            activeTask = null
            refreshTasks()
          }
        "
      />
    </AppDrawer>
  </div>
</template>
