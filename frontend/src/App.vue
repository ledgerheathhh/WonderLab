<script setup lang="ts">
import { computed, ref, watch, onMounted, nextTick } from "vue";
import {
  FlaskConical,
  Home,
  LibraryBig,
  Settings2,
  Plus,
  ArrowUpRight,
  ArrowRight,
  ArrowLeft,
  FileText,
  UploadCloud,
  Sparkles,
  Check,
  Clock3,
  MoreHorizontal,
  X,
  Globe2,
  Atom,
  Code2,
  Route,
  BookOpen,
  Trash2,
  LoaderCircle,
  PanelLeftClose,
  ArrowUp,
  ArrowDown,
  CheckCircle2,
  CircleHelp,
} from "lucide-vue-next";
import SettingsModal from "./components/SettingsModal.vue";
import ScenePlayer from "./components/ScenePlayer.vue";
import TutorPanel from "./components/TutorPanel.vue";
import { language, t, switchLanguage } from "./i18n";
import { example, exampleCards } from "./examples";
import { request, saveProject } from "./api";
import type { Project, Scene, Settings } from "./types";
const view = ref<"home" | "library" | "path" | "workspace">("home"),
  projects = ref<Project[]>([]),
  project = ref<Project | null>(null);
const settings = ref<Settings>({
  base_url: "https://api.openai.com/v1",
  model: "",
  api_key: "",
  json_mode: true,
});
try {
  const saved = JSON.parse(
    localStorage.getItem("wonderlab-settings") || "null",
  );
  if (saved)
    settings.value = {
      base_url: String(saved.base_url || settings.value.base_url),
      model: String(saved.model || ""),
      json_mode: saved.json_mode !== false,
      api_key: "",
    };
} catch {}
const settingsOpen = ref(false),
  sourceOpen = ref(false),
  sidebarOpen = ref(false),
  helpOpen = ref(false);
const inputMode = ref<"text" | "pdf" | "topic">("text"),
  material = ref(""),
  sourceName = ref(""),
  parsing = ref(false),
  generating = ref(false),
  loading = ref(true),
  error = ref(""),
  savedStatus = ref(""),
  deleteTarget = ref<Project | null>(null);
const uploadInput = ref<HTMLInputElement>(),
  importAbort = ref<AbortController | null>(null);
const sourceLength = computed(() => material.value.trim().length);
const sourceMinimum = computed(() => (inputMode.value === "topic" ? 1 : 10));
const sourceTooShort = computed(() => sourceLength.value < sourceMinimum.value);
const scene = computed(
  () =>
    project.value?.course.scenes.find(
      (s) => s.id === project.value?.progress.active,
    ) || project.value?.course.scenes[0],
);
const finished = computed(
  () =>
    !!project.value &&
    project.value.progress.completed.length ===
      project.value.course.scenes.length,
);
const completedCount = computed(() =>
  projects.value.reduce((n, p) => n + p.progress.completed.length, 0),
);
const nameOf = (type: Scene["type"]) =>
  ({
    experiment: t("交互实验", "Experiment"),
    decision: t("情境决策", "Decision"),
    sort: t("排序挑战", "Ordering"),
  })[type];
const iconOf = (type: Scene["type"]) =>
  ({ experiment: FlaskConical, decision: Route, sort: Code2 })[type];
const label = (pair: string[]) => pair[language.value === "zh" ? 0 : 1];
watch(
  language,
  () => {
    document.documentElement.lang = language.value === "zh" ? "zh-CN" : "en";
  },
  { immediate: true },
);
watch(
  () => [view.value, project.value?.id, scene.value?.id],
  async () => {
    await nextTick();
    window.scrollTo({ top: 0 });
  },
);
function applySettings(value: Settings) {
  settings.value = value;
  localStorage.setItem(
    "wonderlab-settings",
    JSON.stringify({
      base_url: value.base_url,
      model: value.model,
      json_mode: value.json_mode,
    }),
  );
  settingsOpen.value = false;
}
async function load() {
  loading.value = true;
  error.value = "";
  try {
    projects.value = await request<Project[]>("/projects");
  } catch {
    error.value = t(
      "无法连接本地后端。请使用 ./start.sh 启动，或确认 8000 端口服务已运行。",
      "Cannot reach the local server. Start with ./start.sh or check port 8000.",
    );
  } finally {
    loading.value = false;
  }
}
onMounted(load);
let saves = Promise.resolve();
function persist() {
  if (!project.value) return;
  const snapshot = JSON.parse(JSON.stringify(project.value)) as Project;
  savedStatus.value = t("正在保存…", "Saving…");
  saves = saves.then(async () => {
    try {
      const result = await saveProject(snapshot);
      const i = projects.value.findIndex((p) => p.id === result.id);
      if (i >= 0) projects.value[i] = result;
      else projects.value.unshift(result);
      savedStatus.value = t("已保存在本机", "Saved on this device");
    } catch {
      savedStatus.value = t(
        "保存失败，请点击重试",
        "Save failed. Click to retry",
      );
    }
  });
}
async function startExample(index: number) {
  error.value = "";
  const p = example(index, language.value);
  try {
    const stored = await saveProject(p);
    projects.value.unshift(stored);
    project.value = stored;
    view.value = "path";
  } catch (e) {
    error.value = (e as Error).message;
  }
}
function openProject(p: Project) {
  project.value = JSON.parse(JSON.stringify(p));
  view.value = "path";
  sidebarOpen.value = false;
}
function navigate(next: "home" | "library") {
  view.value = next;
  sidebarOpen.value = false;
  error.value = "";
}
async function parseFile(file?: File) {
  if (!file) return;
  error.value = "";
  if (!file.name.toLowerCase().endsWith(".pdf")) {
    error.value = t("请选择 PDF 文件。", "Please choose a PDF file.");
    return;
  }
  if (file.size > 12 * 1024 * 1024) {
    error.value = t("PDF 最大为 12 MB。", "Maximum PDF size is 12 MB.");
    return;
  }
  parsing.value = true;
  try {
    const form = new FormData();
    form.append("file", file);
    const result = await request<{ text: string; name: string; pages: number }>(
      "/pdf",
      { method: "POST", body: form },
    );
    material.value = result.text;
    sourceName.value = result.name;
    inputMode.value = "pdf";
  } catch (e) {
    error.value = (e as Error).message;
  } finally {
    parsing.value = false;
  }
}
function mode(next: typeof inputMode.value) {
  inputMode.value = next;
  material.value = "";
  sourceName.value = "";
  error.value = "";
}
async function generateCourse() {
  if (sourceTooShort.value || generating.value || parsing.value) return;
  if (!settings.value.api_key || !settings.value.model) {
    settingsOpen.value = true;
    return;
  }
  generating.value = true;
  error.value = "";
  const controller = new AbortController();
  importAbort.value = controller;
  try {
    const p = await request<Project>("/generate", {
      method: "POST",
      body: JSON.stringify({
        source: material.value.trim(),
        source_name:
          sourceName.value.trim() ||
          t(
            inputMode.value === "topic" ? "学习主题" : "粘贴的资料",
            inputMode.value === "topic" ? "Learning topic" : "Pasted material",
          ),
        source_kind: inputMode.value,
        language: language.value,
        settings: settings.value,
      }),
      signal: controller.signal,
    });
    projects.value.unshift(p);
    project.value = p;
    view.value = "path";
    material.value = "";
    sourceName.value = "";
  } catch (e) {
    if ((e as Error).name !== "AbortError") error.value = (e as Error).message;
  } finally {
    generating.value = false;
    importAbort.value = null;
  }
}
function selectScene(id: string) {
  if (!project.value) return;
  project.value.progress.active = id;
  view.value = "workspace";
  persist();
}
function answer(value: string | number | string[], correct: boolean) {
  if (!project.value || !scene.value) return;
  const progress = project.value.progress,
    id = scene.value.id;
  progress.answers[id] = value;
  progress.attempts[id] = (progress.attempts[id] || 0) + 1;
  if (correct && !progress.completed.includes(id)) progress.completed.push(id);
  persist();
}
function next() {
  if (!project.value || !scene.value) return;
  const scenes = project.value.course.scenes;
  const index = scenes.findIndex((s) => s.id === scene.value!.id);
  const candidate =
    scenes
      .slice(index + 1)
      .find((s) => !project.value!.progress.completed.includes(s.id)) ||
    scenes.find((s) => !project.value!.progress.completed.includes(s.id));
  if (candidate) selectScene(candidate.id);
  else view.value = "path";
}
function reorder(index: number, delta: number) {
  if (!project.value) return;
  const scenes = project.value.course.scenes,
    target = index + delta;
  if (target < 0 || target >= scenes.length) return;
  scenes.splice(target, 0, scenes.splice(index, 1)[0]!);
  persist();
}
async function remove() {
  if (!deleteTarget.value) return;
  try {
    await saves;
    await request(`/projects/${deleteTarget.value.id}`, { method: "DELETE" });
    projects.value = projects.value.filter(
      (p) => p.id !== deleteTarget.value!.id,
    );
    if (project.value?.id === deleteTarget.value.id) {
      project.value = null;
      view.value = "library";
    }
    deleteTarget.value = null;
  } catch (e) {
    error.value = (e as Error).message;
  }
}
</script>
<template>
  <div class="app-shell">
    <div
      v-if="sidebarOpen"
      class="sidebar-scrim"
      @click="sidebarOpen = false"
    />
    <aside class="sidebar" :class="{ open: sidebarOpen }">
      <a class="brand" href="#" @click.prevent="navigate('home')"
        ><span class="brand-icon"
          ><FlaskConical :size="23" stroke-width="1.8" /></span
        ><span
          >Wonder<span class="brand-light">Lab</span
          ><small>{{ t("让知识发生", "LEARNING, ALIVE") }}</small></span
        ></a
      >
      <button class="new-button" @click="navigate('home')">
        <Plus :size="19" />{{ t("开启新的探索", "Start a new exploration") }}
      </button>
      <nav class="main-nav">
        <button :class="{ active: view === 'home' }" @click="navigate('home')">
          <Home :size="19" />{{ t("探索首页", "Discover") }}</button
        ><button
          :class="{ active: view === 'library' }"
          @click="navigate('library')"
        >
          <LibraryBig :size="19" />{{ t("我的学习库", "My library")
          }}<span class="nav-count">{{ projects.length }}</span>
        </button>
      </nav>
      <div class="sidebar-section">
        <span>{{ t("最近的探索", "RECENT EXPLORATIONS") }}</span
        ><MoreHorizontal :size="16" />
      </div>
      <div class="recent-list">
        <button
          v-for="p in projects.slice(0, 5)"
          :key="p.id"
          :class="{
            current:
              project?.id === p.id && (view === 'path' || view === 'workspace'),
          }"
          @click="openProject(p)"
        >
          <span
            class="recent-dot"
            :class="{
              complete: p.progress.completed.length === p.course.scenes.length,
            }"
          /><span>{{ p.course.title }}</span>
        </button>
        <p v-if="!projects.length" class="small muted sidebar-empty">
          {{
            t(
              "你的下一次发现，从这里开始。",
              "Your next discovery starts here.",
            )
          }}
        </p>
      </div>
      <div class="sidebar-bottom">
        <div class="curiosity-card">
          <span>✦</span
          ><strong>{{
            t("好奇心，是最好的起点。", "Curiosity is a great beginning.")
          }}</strong>
          <p>
            {{
              t(
                "每一次探索，都让世界更清晰一点。",
                "Every exploration brings the world a little closer.",
              )
            }}
          </p>
        </div>
        <button @click="settingsOpen = true">
          <Settings2 :size="18" />{{
            t("模型与 API 设置", "Model & API settings")
          }}<span
            class="connection-dot"
            :class="{ connected: settings.api_key }"
          /></button
        ><button @click="helpOpen = true">
          <CircleHelp :size="18" />{{ t("关于这个实验室", "About this lab")
          }}<span class="version">MVP 0.1</span>
        </button>
        <div class="local-profile">
          <span class="profile-avatar">W</span>
          <div>
            <strong>{{ t("好奇的探索者", "Curious explorer") }}</strong
            ><small>{{ t("本地学习空间", "Your local learning space") }}</small>
          </div>
          <span class="local-badge">LOCAL</span>
        </div>
      </div>
    </aside>
    <main class="main-content">
      <header class="topbar">
        <div class="breadcrumb">
          <button
            class="icon-button mobile-menu"
            @click="sidebarOpen = true"
            :aria-label="t('打开导航', 'Open navigation')"
          >
            <PanelLeftClose :size="20" /></button
          ><span>Workspace</span><span class="slash">/</span
          ><strong>{{
            view === "home"
              ? t("探索首页", "Discover")
              : view === "library"
                ? t("我的学习库", "My library")
                : view === "path"
                  ? t("学习路线", "Learning path")
                  : t("互动空间", "Interactive workspace")
          }}</strong>
        </div>
        <div class="topbar-right">
          <span class="local-indicator"
            ><span />{{ t("本地模式", "Local mode") }}</span
          ><button class="language-button" @click="switchLanguage">
            <Globe2 :size="16" />{{ language === "zh" ? "EN" : "中文" }}</button
          ><button
            class="avatar"
            @click="settingsOpen = true"
            :aria-label="t('设置', 'Settings')"
          >
            W
          </button>
        </div>
      </header>
      <div v-if="error" class="global-error" role="alert">
        {{ error
        }}<button
          class="icon-button"
          @click="error = ''"
          :aria-label="t('关闭', 'Dismiss')"
        >
          <X :size="17" />
        </button>
      </div>
      <div v-if="view === 'home'" class="page home-page">
        <section class="hero">
          <div class="hero-copy">
            <span class="hero-kicker"
              ><span /> A LITTLE CURIOSITY. ENDLESS POSSIBILITIES.</span
            >
            <h1>
              {{ t("今天，想探索什么？", "What will you discover today?") }}
            </h1>
            <p>
              {{
                t(
                  "把想学的交给 WonderLab，让知识变成你的亲身发现。",
                  "Bring something you want to learn. Turn knowledge into your own discovery.",
                )
              }}
            </p>
          </div>
          <div class="orbit-art" aria-hidden="true">
            <span class="orbit o1" /><span class="orbit o2" /><span
              class="orbit o3"
            /><span class="orbit-core"
              ><Sparkles :size="34" stroke-width="1.3" /></span
            ><span class="orbit-node n1">✦</span
            ><span class="orbit-node n2">+</span
            ><span class="orbit-node n3">•</span>
          </div>
        </section>
        <section class="input-card">
          <div class="input-tabs">
            <button
              :class="{ active: inputMode === 'text' }"
              :disabled="generating || parsing"
              @click="mode('text')"
            >
              <FileText :size="17" />{{ t("粘贴文本", "Paste text") }}</button
            ><button
              :class="{ active: inputMode === 'pdf' }"
              :disabled="generating || parsing"
              @click="mode('pdf')"
            >
              <UploadCloud :size="18" />{{
                t("上传 PDF", "Upload PDF")
              }}</button
            ><button
              :class="{ active: inputMode === 'topic' }"
              :disabled="generating || parsing"
              @click="mode('topic')"
            >
              <Sparkles :size="17" />{{
                t("输入主题", "Explore a topic")
              }}</button
            ><span class="input-card-label">{{
              t("从一个问题开始", "START WITH A QUESTION")
            }}</span>
          </div>
          <div
            v-if="inputMode === 'pdf' && !material"
            class="upload-zone"
            @dragover.prevent
            @drop.prevent="parseFile($event.dataTransfer?.files[0])"
          >
            <UploadCloud :size="31" stroke-width="1.4" /><strong>{{
              parsing
                ? t("正在提取 PDF 文字…", "Extracting PDF text…")
                : t(
                    "把你的资料，变成一次探索",
                    "Turn your material into an exploration",
                  )
            }}</strong
            ><span>{{
              t(
                "拖入 PDF，或点击选择文件 · 最大 12 MB / 150 页",
                "Drop a PDF or choose a file · Up to 12 MB / 150 pages",
              )
            }}</span
            ><button
              class="button secondary"
              :disabled="parsing"
              @click="uploadInput?.click()"
            >
              {{ t("选择 PDF", "Choose PDF") }}
            </button>
          </div>
          <div v-else class="text-input-area">
            <div v-if="sourceName" class="file-chip">
              <FileText :size="15" />{{ sourceName
              }}<button
                class="icon-button"
                :disabled="generating"
                @click="
                  material = '';
                  sourceName = '';
                "
                :aria-label="t('移除资料', 'Remove material')"
              >
                <X :size="14" />
              </button>
            </div>
            <label class="sr-only" for="material">{{
              t("学习资料或主题", "Learning material or topic")
            }}</label
            ><textarea
              id="material"
              v-model="material"
              maxlength="60000"
              :disabled="generating"
              :aria-describedby="sourceTooShort ? 'source-hint' : undefined"
              :placeholder="
                inputMode === 'topic'
                  ? t(
                      '例如：为什么天空是蓝色的？\n或者，带我理解博弈论的基本思想…',
                      'For example: Why is the sky blue?\nOr help me understand the basics of game theory…',
                    )
                  : t(
                      '粘贴一篇文章、一段笔记，或任何让你好奇的知识…\n我们会一起找到知识点，把它们变成可以动手探索的学习体验。',
                      'Paste an article, a note, or anything that sparks your curiosity…\nWe’ll turn its ideas into something you can explore hands-on.',
                    )
              "
            />
          </div>
          <input
            ref="uploadInput"
            class="sr-only"
            type="file"
            accept="application/pdf,.pdf"
            @change="
              parseFile(($event.target as HTMLInputElement).files?.[0]);
              ($event.target as HTMLInputElement).value = '';
            "
          />
          <p
            v-if="sourceTooShort"
            id="source-hint"
            class="input-hint"
            role="status"
          >
            {{
              inputMode === "topic"
                ? t(
                    '请输入想学习的主题，例如“复利”或“熵”。',
                    'Enter a topic to learn, such as “interest” or “entropy”.',
                  )
                : t(
                    `资料至少需要 ${sourceMinimum} 个字符，当前 ${sourceLength} 个（不计首尾空白）。简短主题请使用“输入主题”。`,
                    `Material needs at least ${sourceMinimum} characters; currently ${sourceLength} (excluding leading and trailing whitespace). For a short topic, choose “Explore a topic”.`,
                  )
            }}
          </p>
          <div class="input-footer">
            <span
              ><span class="tiny-spark">✦</span
              >{{
                inputMode === "topic"
                  ? t(
                      "主题模式由 AI 生成内容，不包含原文依据。",
                      "Topic mode generates content without source evidence.",
                    )
                  : t(
                      "从资料出发，保留每一个知识的出处。",
                      "Grounded in your material. Connected to its source.",
                    )
              }}<small v-if="material"
                >{{ material.length.toLocaleString() }} / 60,000</small
              ></span
            ><button
              v-if="generating"
              class="button secondary"
              @click="importAbort?.abort()"
            >
              {{ t("停止等待", "Stop waiting") }}</button
            ><button
              class="button primary generate-button"
              :disabled="sourceTooShort || generating || parsing"
              @click="generateCourse"
            >
              <LoaderCircle
                v-if="generating"
                :size="17"
                class="spin"
              /><Sparkles v-else :size="17" />{{
                generating
                  ? t("正在设计学习体验…", "Designing your experience…")
                  : t("生成我的学习体验", "Create my learning experience")
              }}<ArrowRight v-if="!generating" :size="17" />
            </button>
          </div>
        </section>
        <div class="flow-caption">
          <span>01 {{ t("带来好奇", "Bring curiosity") }}</span
          ><i /><span>02 {{ t("生成路线", "Find a path") }}</span
          ><i /><span>03 {{ t("动手探索", "Explore hands-on") }}</span
          ><i /><span>04 {{ t("真正理解", "Make it yours") }}</span>
        </div>
        <section class="examples-section">
          <div class="section-heading">
            <div>
              <h2>
                {{ t("灵感，从这里开始", "A little inspiration to get started")
                }}<span class="tag">{{ t("精选体验", "CURATED") }}</span>
              </h2>
              <p>
                {{
                  t(
                    "不需要准备资料，也能先体验一次知识的奇妙。",
                    "No material needed. Take your first discovery for a spin.",
                  )
                }}
              </p>
            </div>
            <span class="small muted">{{
              t("无需 API Key", "No API key needed")
            }}</span>
          </div>
          <div class="example-grid">
            <button
              v-for="(card, i) in exampleCards"
              :key="i"
              class="example-card"
              :class="card.color"
              @click="startExample(i)"
            >
              <div class="example-visual">
                <div class="visual-grid" />
                <template v-if="i === 0"
                  ><svg viewBox="0 0 300 120">
                    <path
                      d="M24 101 C70 100 92 92 126 83 S191 64 217 42 S253 17 277 12"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2.5"
                    />
                    <path
                      d="M24 101 C70 100 92 92 126 83 S191 64 217 42 S253 17 277 12 L277 114 L24 114Z"
                      fill="currentColor"
                      opacity=".07"
                    />
                    <circle cx="217" cy="42" r="5" fill="currentColor" />
                    <path
                      d="M217 42V114"
                      stroke="currentColor"
                      stroke-dasharray="3 4"
                      opacity=".4"
                    /></svg
                  ><span class="visual-formula"
                    >A = P(1 + r)<sup>t</sup></span
                  ></template
                ><template v-else-if="i === 1"
                  ><Atom
                    class="atom-visual"
                    :size="104"
                    stroke-width=".8" /><span class="visual-note">F = kx</span
                  ><span class="science-dot" /></template
                ><template v-else
                  ><div class="code-visual">
                    <span>if <i>(curious)</i> {</span
                    ><span class="indent"
                      >explore<span class="code-paren">();</span></span
                    ><span>}</span>
                  </div>
                  <span class="code-bracket">{ }</span></template
                ><span class="visual-index">LAB 00{{ i + 1 }}</span
                ><span class="visual-arrow"><ArrowUpRight :size="18" /></span>
              </div>
              <div class="example-info">
                <span class="subject-label">{{ label(card.subject) }}</span>
                <h3>{{ label(card.title) }}</h3>
                <p>{{ label(card.desc) }}</p>
                <div class="example-meta">
                  <span
                    ><component
                      :is="i === 0 ? FlaskConical : i === 1 ? Atom : Code2"
                      :size="14"
                    />{{
                      i === 2
                        ? t("决策 + 排序", "Decision + ordering")
                        : t(
                            "实验 + 决策 + 排序",
                            "Experiment + decision + ordering",
                          )
                    }}</span
                  ><span
                    ><Clock3 :size="13" />{{ card.duration }}
                    {{ t("分钟", "min") }}</span
                  >
                </div>
              </div>
            </button>
          </div>
        </section>
        <section v-if="projects.length" class="continue-section">
          <div class="section-heading">
            <h2>{{ t("接着上一次的好奇", "Pick up your curiosity") }}</h2>
            <button class="text-button" @click="navigate('library')">
              {{ t("查看学习库", "View library") }}<ArrowRight :size="15" />
            </button>
          </div>
          <button class="continue-card" @click="openProject(projects[0]!)">
            <span class="continue-icon"><BookOpen :size="23" /></span>
            <div>
              <strong>{{ projects[0]!.course.title }}</strong>
              <p>
                {{ projects[0]!.progress.completed.length }} /
                {{ projects[0]!.course.scenes.length }}
                {{ t("个探索已完成", "activities completed") }}
              </p>
            </div>
            <div class="progress-track">
              <span
                :style="{
                  width:
                    (projects[0]!.progress.completed.length /
                      projects[0]!.course.scenes.length) *
                      100 +
                    '%',
                }"
              />
            </div>
            <ArrowRight :size="19" />
          </button>
        </section>
        <footer class="page-footer">
          <span class="footer-mark">✦</span
          >{{
            t(
              "知识不只被阅读，更值得被体验。",
              "Knowledge is more than something to read. It is something to experience.",
            )
          }}<span>WONDERLAB / LOCAL MVP</span>
        </footer>
      </div>
      <div v-else-if="view === 'library'" class="page library-page">
        <div class="section-heading">
          <div>
            <span class="eyebrow">YOUR PERSONAL LAB</span>
            <h1>
              {{
                t("每一次探索，都有迹可循。", "Every discovery leaves a trail.")
              }}
            </h1>
            <p>
              {{ projects.length }} {{ t("份学习资料", "learning projects") }} ·
              {{ completedCount }}
              {{ t("个已完成的探索", "completed activities") }}
            </p>
          </div>
          <button class="button primary" @click="navigate('home')">
            <Plus :size="17" />{{ t("新建学习", "New exploration") }}
          </button>
        </div>
        <p v-if="loading" class="muted">
          {{ t("正在读取本地资料…", "Loading local projects…") }}
        </p>
        <div v-else-if="!projects.length" class="empty-state">
          <LibraryBig :size="48" stroke-width="1" />
          <h2>{{ t("这里将装下你的好奇心", "A home for your curiosity") }}</h2>
          <p>
            {{
              t(
                "粘贴资料或体验一个精选示例，开始建立你的学习库。",
                "Paste material or try a curated example to start your library.",
              )
            }}
          </p>
          <button class="button primary" @click="navigate('home')">
            {{ t("开始探索", "Start exploring") }}<ArrowRight :size="16" />
          </button>
        </div>
        <div class="library-grid">
          <article v-for="p in projects" :key="p.id" class="library-card">
            <div class="library-card-top">
              <span class="subject-label">{{ p.course.subject }}</span
              ><button
                class="icon-button"
                @click="deleteTarget = p"
                :aria-label="t('删除项目', 'Delete project')"
              >
                <Trash2 :size="16" />
              </button>
            </div>
            <h2>{{ p.course.title }}</h2>
            <p>{{ p.course.summary }}</p>
            <div class="progress-track">
              <span
                :style="{
                  width:
                    (p.progress.completed.length / p.course.scenes.length) *
                      100 +
                    '%',
                }"
              />
            </div>
            <div class="library-card-footer">
              <span
                >{{ p.progress.completed.length }} /
                {{ p.course.scenes.length }}
                {{ t("已完成", "completed") }}</span
              ><button class="text-button" @click="openProject(p)">
                {{ t("继续探索", "Continue") }}<ArrowRight :size="16" />
              </button>
            </div>
          </article>
        </div>
      </div>
      <div v-else-if="view === 'path' && project" class="page path-page">
        <button class="back-link" @click="navigate('library')">
          <ArrowLeft :size="16" />{{ t("返回学习库", "Back to library") }}
        </button>
        <div class="path-intro">
          <span class="eyebrow"
            >{{ project.course.subject }} / LEARNING PATH</span
          >
          <h1>{{ project.course.title }}</h1>
          <p>{{ project.course.summary }}</p>
          <div class="path-metadata">
            <span
              ><Route :size="16" />{{ project.course.scenes.length }}
              {{ t("个互动探索", "interactive activities") }}</span
            ><span
              ><CheckCircle2 :size="16" />{{
                project.progress.completed.length
              }}
              {{ t("个已完成", "completed") }}</span
            ><button class="text-button" @click="sourceOpen = true">
              <BookOpen :size="16" />{{
                t("查看原始资料", "View original material")
              }}
            </button>
          </div>
        </div>
        <div v-if="finished" class="completion-banner">
          <Sparkles :size="26" />
          <div>
            <h2>
              {{
                t("这一段探索，你已经走过。", "You made this discovery yours.")
              }}
            </h2>
            <p>
              {{
                t(
                  "所有任务已完成。回顾知识解释，或带着新的问题再试一次。",
                  "All activities completed. Review the explanations or explore again with a new question.",
                )
              }}
            </p>
          </div>
        </div>
        <div class="path-heading">
          <h2>{{ t("你的探索路线", "Your exploration path") }}</h2>
          <span class="small muted">{{
            t(
              "可以调整顺序，按自己的节奏学习",
              "Reorder the activities and learn at your own pace",
            )
          }}</span>
        </div>
        <div class="path-list">
          <article
            v-for="(s, i) in project.course.scenes"
            :key="s.id"
            class="path-card"
          >
            <span
              class="path-number"
              :class="{ done: project.progress.completed.includes(s.id) }"
              ><Check
                v-if="project.progress.completed.includes(s.id)"
                :size="20"
              /><template v-else>{{
                String(i + 1).padStart(2, "0")
              }}</template></span
            >
            <div class="path-card-content">
              <span class="scene-type"
                ><component :is="iconOf(s.type)" :size="14" />{{
                  nameOf(s.type)
                }}</span
              >
              <h3>{{ s.title }}</h3>
              <p>{{ s.objective }}</p>
            </div>
            <div class="path-order">
              <button
                class="icon-button"
                :disabled="i === 0"
                :aria-label="t('上移任务', 'Move activity up')"
                @click="reorder(i, -1)"
              >
                <ArrowUp :size="16" /></button
              ><button
                class="icon-button"
                :disabled="i === project.course.scenes.length - 1"
                :aria-label="t('下移任务', 'Move activity down')"
                @click="reorder(i, 1)"
              >
                <ArrowDown :size="16" />
              </button>
            </div>
            <button class="button secondary" @click="selectScene(s.id)">
              {{
                project.progress.completed.includes(s.id)
                  ? t("再探索", "Explore again")
                  : t("开始", "Start")
              }}<ArrowRight :size="16" />
            </button>
          </article>
        </div>
        <button class="saved-status" @click="persist">
          {{
            savedStatus ||
            t(
              "资料和学习进度保存在本机 SQLite 中",
              "Material and progress are saved in local SQLite",
            )
          }}
        </button>
      </div>
      <div
        v-else-if="view === 'workspace' && project && scene"
        class="workspace"
      >
        <div class="workspace-top">
          <button class="back-link" @click="view = 'path'">
            <ArrowLeft :size="16" />{{ project.course.title }}</button
          ><button class="saved-status" @click="persist">
            <span class="connection-dot connected" />{{
              savedStatus || t("保存在本机", "Saved locally")
            }}
          </button>
        </div>
        <div class="workspace-grid">
          <section class="activity-panel">
            <div class="activity-tabs">
              <button
                v-for="(s, i) in project.course.scenes"
                :key="s.id"
                :class="{
                  active: s.id === scene.id,
                  done: project.progress.completed.includes(s.id),
                }"
                @click="selectScene(s.id)"
              >
                <Check
                  v-if="project.progress.completed.includes(s.id)"
                  :size="14"
                /><span v-else>{{ i + 1 }}</span
                >{{ nameOf(s.type) }}
              </button>
            </div>
            <div class="activity-heading">
              <span class="eyebrow"
                >{{ nameOf(scene.type) }} /
                {{
                  String(project.course.scenes.indexOf(scene) + 1).padStart(
                    2,
                    "0",
                  )
                }}</span
              >
              <h1>{{ scene.title }}</h1>
            </div>
            <ScenePlayer
              :key="project.id + scene.id"
              :scene="scene"
              :progress="project.progress"
              @answer="answer"
              @next="next"
            />
            <details class="explanation-details">
              <summary>
                <BookOpen :size="17" />{{
                  t("知识解释与原文依据", "Explanation & source evidence")
                }}<Plus :size="16" />
              </summary>
              <p>{{ scene.explanation }}</p>
              <blockquote v-if="scene.quote">{{ scene.quote }}</blockquote>
              <p v-else class="small muted">
                {{
                  t(
                    "此知识点暂无可核对的原文摘录。请结合资料或其他可靠来源判断。",
                    "No verified source excerpt for this concept. Check the material or other reliable references.",
                  )
                }}
              </p>
              <button class="text-button" @click="sourceOpen = true">
                {{ t("打开完整原文", "Open full source")
                }}<ArrowUpRight :size="14" />
              </button>
            </details>
          </section>
          <TutorPanel
            :project="project"
            :scene="scene"
            :settings="settings"
            @settings="settingsOpen = true"
            @source="sourceOpen = true"
          />
        </div>
      </div>
    </main>
    <SettingsModal
      v-if="settingsOpen"
      :settings="settings"
      @close="settingsOpen = false"
      @save="applySettings"
    />
    <div
      v-if="sourceOpen && project"
      class="modal-backdrop"
      @click.self="sourceOpen = false"
    >
      <section
        class="modal source-modal"
        role="dialog"
        aria-modal="true"
        :aria-label="t('原始资料', 'Original material')"
      >
        <div class="modal-top">
          <span class="eyebrow">{{ t("原始资料", "ORIGINAL MATERIAL") }}</span
          ><button
            class="icon-button"
            @click="sourceOpen = false"
            :aria-label="t('关闭', 'Close')"
          >
            <X :size="20" />
          </button>
        </div>
        <h2>{{ project.source_name }}</h2>
        <p v-if="project.source_kind === 'topic'" class="notice">
          {{
            t(
              "这是用户输入的主题，课程内容由 AI 生成，并非原文提取。",
              "This is a user-entered topic. Course content is AI-generated, not extracted from a source.",
            )
          }}
        </p>
        <div class="source-text">{{ project.source }}</div>
      </section>
    </div>
    <div
      v-if="deleteTarget"
      class="modal-backdrop"
      @click.self="deleteTarget = null"
    >
      <section class="modal small-modal" role="dialog" aria-modal="true">
        <h2>{{ t("删除这次探索？", "Delete this exploration?") }}</h2>
        <p>{{ deleteTarget.course.title }}</p>
        <p class="muted">
          {{
            t(
              "资料和学习进度将从本机移除，此操作无法撤销。",
              "Material and progress will be removed from this device. This cannot be undone.",
            )
          }}
        </p>
        <div class="modal-actions">
          <button class="button secondary" @click="deleteTarget = null">
            {{ t("保留", "Keep it") }}</button
          ><button class="button danger" @click="remove">
            {{ t("确认删除", "Delete") }}
          </button>
        </div>
      </section>
    </div>
    <div v-if="helpOpen" class="modal-backdrop" @click.self="helpOpen = false">
      <section class="modal" role="dialog" aria-modal="true">
        <div class="modal-top">
          <FlaskConical :size="27" /><button
            class="icon-button"
            @click="helpOpen = false"
            :aria-label="t('关闭', 'Close')"
          >
            <X :size="20" />
          </button>
        </div>
        <h2>WonderLab · MVP</h2>
        <p>
          {{
            t(
              "先体验精选示例，再连接自己的 API，上传资料并生成学习路线。通过实验、决策和排序探索知识。",
              "Try a curated example, then connect your API and turn your material into a learning path. Explore through experiments, decisions, and ordering challenges.",
            )
          }}
        </p>
        <p class="muted">
          {{
            t(
              "支持可提取文字的 PDF（12 MB / 150 页 / 60,000 字符）。扫描件需先 OCR。学习资料存储在本机；生成与辅导时会发送至所选 API 服务。",
              "Supports text-based PDFs (12 MB / 150 pages / 60,000 characters). Scans require OCR. Material is stored locally and sent to your chosen API provider for generation and tutoring.",
            )
          }}
        </p>
        <button class="button primary" @click="helpOpen = false">
          {{ t("继续探索", "Keep exploring") }}<ArrowRight :size="16" />
        </button>
      </section>
    </div>
  </div>
</template>
