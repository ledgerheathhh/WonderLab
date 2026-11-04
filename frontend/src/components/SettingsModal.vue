<script setup lang="ts">
import { ref } from "vue";
import {
  X,
  KeyRound,
  ExternalLink,
  LoaderCircle,
  CheckCircle2,
} from "lucide-vue-next";
import type { Settings } from "../types";
import { request } from "../api";
import { t } from "../i18n";
const props = defineProps<{ settings: Settings }>();
const emit = defineEmits<{ close: []; save: [Settings] }>();
const draft = ref({ ...props.settings });
const testing = ref(false),
  message = ref(""),
  success = ref(false);
async function test() {
  testing.value = true;
  message.value = "";
  success.value = false;
  try {
    await request("/test-connection", {
      method: "POST",
      body: JSON.stringify(draft.value),
    });
    success.value = true;
    message.value = t(
      "连接成功，可以开始学习了。",
      "Connected. You are ready to learn.",
    );
  } catch (e) {
    message.value = (e as Error).message;
  } finally {
    testing.value = false;
  }
}
function preset(url: string) {
  draft.value.base_url = url;
  draft.value.model = "";
  message.value = "";
}
</script>
<template>
  <div
    class="modal-backdrop"
    @click.self="emit('close')"
    @keydown.esc="emit('close')"
  >
    <section
      class="modal"
      role="dialog"
      aria-modal="true"
      :aria-label="t('模型设置', 'Model settings')"
    >
      <div class="modal-top">
        <span class="icon-box"><KeyRound :size="22" /></span
        ><button
          class="icon-button"
          @click="emit('close')"
          :aria-label="t('关闭', 'Close')"
        >
          <X :size="20" />
        </button>
      </div>
      <h2>{{ t("连接你的 AI", "Connect your AI") }}</h2>
      <p class="muted">
        {{
          t(
            "使用自己的 API Key，让好奇心连接更多可能。",
            "Bring your own API key. Give your curiosity more possibilities.",
          )
        }}
      </p>
      <form @submit.prevent="emit('save', { ...draft })">
        <div class="presets">
          <button type="button" @click="preset('https://api.openai.com/v1')">
            OpenAI</button
          ><button type="button" @click="preset('https://api.deepseek.com/v1')">
            DeepSeek</button
          ><span>{{ t("或使用兼容接口", "or any compatible API") }}</span>
        </div>
        <label
          >API Base URL<input
            v-model.trim="draft.base_url"
            type="url"
            required
            placeholder="https://api.example.com/v1"
        /></label>
        <label
          >{{ t("模型名称", "Model name")
          }}<input
            v-model.trim="draft.model"
            required
            :placeholder="
              t(
                '填写服务商提供的模型 ID',
                'Enter the model ID from your provider',
              )
            "
        /></label>
        <label
          >API Key<input
            v-model.trim="draft.api_key"
            type="password"
            autocomplete="off"
            required
            placeholder="sk-…"
        /></label>
        <label class="check-label"
          ><input v-model="draft.json_mode" type="checkbox" />{{
            t("启用 JSON 模式（推荐）", "Enable JSON mode (recommended)")
          }}</label
        >
        <p class="small muted">
          {{
            t(
              "若模型不支持 response_format，可关闭 JSON 模式。生成结果仍会通过结构校验。",
              "Disable if your model does not support response_format. Scene validation remains enabled.",
            )
          }}
        </p>
        <div class="privacy-note">
          <KeyRound :size="16" /><span>{{
            t(
              "Key 仅保存在当前页面内存中，刷新后需重新填写。资料会发送至你配置的 API 服务。",
              "Your key stays in this page’s memory and clears on reload. Learning material is sent to your configured API provider.",
            )
          }}</span>
        </div>
        <p v-if="message" class="notice" :class="{ success }" role="status">
          <CheckCircle2 v-if="success" :size="16" />{{ message }}
        </p>
        <div class="modal-actions">
          <button
            type="button"
            class="button secondary"
            :disabled="testing || !draft.api_key || !draft.model"
            @click="test"
          >
            <LoaderCircle v-if="testing" class="spin" :size="16" />{{
              t("测试连接", "Test connection")
            }}</button
          ><button class="button primary" type="submit">
            {{ t("应用设置", "Apply settings") }}<ExternalLink :size="15" />
          </button>
        </div>
      </form>
    </section>
  </div>
</template>
