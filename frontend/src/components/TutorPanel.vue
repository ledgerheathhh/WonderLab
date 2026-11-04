<script setup lang="ts">
import { ref, watch, nextTick, onUnmounted } from "vue";
import {
  Sparkles,
  Send,
  BookOpen,
  Lightbulb,
  LoaderCircle,
} from "lucide-vue-next";
import type { Project, Scene, Settings } from "../types";
import { request } from "../api";
import { t, language } from "../i18n";
const props = defineProps<{
  project: Project;
  scene: Scene;
  settings: Settings;
}>();
const emit = defineEmits<{ settings: []; source: [] }>();
const messages = ref<{ role: string; content: string }[]>([]),
  question = ref(""),
  busy = ref(false),
  error = ref(""),
  log = ref<HTMLElement>();
let contextVersion = 0;
let controller: AbortController | null = null;
onUnmounted(() => controller?.abort());
watch(
  () => [props.project.id, props.scene.id],
  () => {
    contextVersion++;
    controller?.abort();
    busy.value = false;
    messages.value = [];
    error.value = "";
    question.value = "";
  },
);
async function ask(text = question.value) {
  if (!text.trim() || busy.value) return;
  if (!props.settings.api_key || !props.settings.model) {
    emit("settings");
    return;
  }
  const version = contextVersion,
    history = messages.value.slice(-8);
  controller = new AbortController();
  messages.value.push({ role: "user", content: text });
  question.value = "";
  busy.value = true;
  error.value = "";
  try {
    const data = await request<{ answer: string }>("/chat", {
      method: "POST",
      body: JSON.stringify({
        settings: props.settings,
        project: props.project,
        scene_id: props.scene.id,
        question: text,
        language: language.value,
        history,
      }),
      signal: controller.signal,
    });
    if (version === contextVersion)
      messages.value.push({ role: "assistant", content: data.answer });
  } catch (e) {
    if (version === contextVersion && (e as Error).name !== "AbortError")
      error.value = (e as Error).message;
  } finally {
    if (version === contextVersion) {
      busy.value = false;
      await nextTick();
      if (log.value) log.value.scrollTop = log.value.scrollHeight;
    }
  }
}
</script>
<template>
  <aside class="tutor-panel">
    <div class="tutor-heading">
      <span class="tutor-avatar"><Sparkles :size="19" /></span>
      <div>
        <strong>{{ t("你的探索搭子", "Your learning companion") }}</strong
        ><span>{{
          settings.api_key
            ? t("AI 辅导已配置", "AI tutoring configured")
            : t("连接 API 后开启对话", "Connect an API to chat")
        }}</span>
      </div>
      <i />
    </div>
    <div class="tutor-log" ref="log" aria-live="polite">
      <div class="tutor-welcome">
        <span class="eyebrow">{{
          t("一起想深一点", "GO A LITTLE DEEPER")
        }}</span>
        <p>
          {{
            t(
              "不必一次就找到答案。试一试、问一问，让每次发现都成为你的知识。",
              "You don’t need to get it right the first time. Try, ask, and turn each discovery into understanding.",
            )
          }}
        </p>
      </div>
      <div class="hint-card">
        <Lightbulb :size="18" />
        <div>
          <strong>{{ t("一个小提示", "A little hint") }}</strong>
          <p>{{ scene.hint }}</p>
        </div>
      </div>
      <div
        v-for="(message, i) in messages"
        :key="i"
        class="chat-message"
        :class="message.role"
      >
        <span>{{ message.role === "user" ? t("你", "You") : "Wonder" }}</span>
        <p>{{ message.content }}</p>
      </div>
      <p v-if="busy" class="muted small">
        <LoaderCircle class="spin" :size="15" />
        {{ t("正在思考…", "Thinking…") }}
      </p>
      <p v-if="error" class="notice" role="alert">{{ error }}</p>
    </div>
    <div class="tutor-bottom">
      <button
        class="suggestion"
        :disabled="busy"
        @click="
          ask(
            t(
              '请用一个生活中的例子解释这个知识点。',
              'Explain this concept with an everyday example.',
            ),
          )
        "
      >
        {{ t("用生活中的例子解释", "Give me an everyday example") }} ↗
      </button>
      <form class="chat-input" @submit.prevent="ask()">
        <input
          v-model="question"
          maxlength="2000"
          :placeholder="t('有疑问，随时问我…', 'Ask anything about this…')"
          :aria-label="t('向 AI 提问', 'Ask AI')"
        /><button
          class="icon-button"
          type="submit"
          :disabled="busy || !question.trim()"
          :aria-label="t('发送', 'Send')"
        >
          <Send :size="17" />
        </button>
      </form>
      <span class="small muted">{{
        t(
          "AI 可能出错，请结合原始资料判断。",
          "AI can make mistakes. Check the original source.",
        )
      }}</span>
    </div>
    <button class="source-link" @click="emit('source')">
      <BookOpen :size="17" />{{ t("回到原始资料", "View original material")
      }}<span>↗</span>
    </button>
  </aside>
</template>
