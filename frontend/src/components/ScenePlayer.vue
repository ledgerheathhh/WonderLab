<script setup lang="ts">
import { computed, ref } from "vue";
import {
  ArrowDown,
  ArrowUp,
  Check,
  GripVertical,
  RotateCcw,
  Sparkles,
  ArrowRight,
} from "lucide-vue-next";
import type { Scene, Progress } from "../types";
import { interpolate } from "../types";
import { t } from "../i18n";
const props = defineProps<{ scene: Scene; progress: Progress }>();
const emit = defineEmits<{
  answer: [value: string | number | string[], correct: boolean];
  draft: [value: string];
  next: [];
}>();
const previous = props.progress.answers[props.scene.id];
const value = ref(
  props.scene.type === "experiment"
    ? typeof previous === "number"
      ? previous
      : props.scene.min
    : 0,
);
const selected = ref(typeof previous === "string" ? previous : "");
const response = ref(typeof previous === "string" ? previous : ""),
  reviewed = ref(false),
  checkpoints = ref<string[]>([]);
const order = ref(
  props.scene.type === "sort"
    ? Array.isArray(previous)
      ? previous
      : shuffled(props.scene.items.map((x) => x.id))
    : [],
);
const feedback = ref(""),
  checked = ref(false),
  correct = ref(false),
  dragging = ref<number | null>(null);
const done = computed(() => props.progress.completed.includes(props.scene.id));
function shuffled(ids: string[]) {
  const result = [...ids];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j]!, result[i]!];
  }
  if (result.join() === ids.join()) result.reverse();
  return result;
}
const result = computed(() =>
  props.scene.type === "experiment"
    ? interpolate(props.scene.points, value.value)
    : 0,
);
const geometry = computed(() => {
  if (props.scene.type !== "experiment") return { line: "", x: 0, y: 0 };
  const scene = props.scene,
    ys = scene.points.map((p) => p.y),
    low = Math.min(0, ...ys),
    high = Math.max(...ys),
    span = high - low || 1;
  const x = (n: number) =>
    38 + ((n - scene.min) / (scene.max - scene.min)) * 504;
  const y = (n: number) => 212 - ((n - low) / span) * 172;
  return {
    line: scene.points.map((p) => `${x(p.x)},${y(p.y)}`).join(" "),
    x: x(value.value),
    y: y(result.value),
  };
});
function move(index: number, target: number) {
  if (target < 0 || target >= order.value.length) return;
  const next = [...order.value];
  next.splice(target, 0, next.splice(index, 1)[0]!);
  order.value = next;
  checked.value = false;
}
function drop(index: number) {
  if (dragging.value !== null) move(dragging.value, index);
  dragging.value = null;
}
function submit() {
  const s = props.scene;
  let answer: string | number | string[];
  if (s.type === "experiment") {
    correct.value =
      value.value >= s.target_min - 1e-8 && value.value <= s.target_max + 1e-8;
    answer = value.value;
    feedback.value = correct.value
      ? s.explanation
      : t(
          "对照目标结果，观察参数变化如何影响结果，再试一次。",
          "Compare the result with the goal. Observe how changing the parameter affects it, then try again.",
        );
  } else if (s.type === "decision") {
    const option = s.options.find((o) => o.id === selected.value);
    if (!option) return;
    correct.value = option.correct;
    answer = selected.value;
    feedback.value = option.feedback;
  } else if (s.type === "recall") {
    if (!reviewed.value || !response.value.trim()) return;
    correct.value = s.checkpoints.every((point) =>
      checkpoints.value.includes(point),
    );
    answer = response.value.trim();
    feedback.value = correct.value
      ? s.explanation
      : t(
          "还有要点未覆盖。对照参考思路补充你的解释，再重新自查。",
          "Some points still need work. Revise your explanation using the reference, then check again.",
        );
  } else {
    correct.value = order.value.every((id, i) => id === s.correct_order[i]);
    answer = [...order.value];
    feedback.value = correct.value
      ? s.explanation
      : t(
          "顺序还可以调整。想一想：哪些步骤是下一步的前提？",
          "Try another order. Which steps must happen before the next ones?",
        );
  }
  checked.value = true;
  emit("answer", answer, correct.value);
}
function reset() {
  checked.value = false;
  feedback.value = "";
  selected.value = "";
  response.value = "";
  reviewed.value = false;
  checkpoints.value = [];
  if (props.scene.type === "experiment") value.value = props.scene.min;
  if (props.scene.type === "sort")
    order.value = shuffled(props.scene.items.map((x) => x.id));
}
const fmt = (n: number) =>
  new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(n);
</script>
<template>
  <div class="scene-body">
    <div class="scene-goal">
      <span class="eyebrow">{{ t("本次探索目标", "YOUR MISSION") }}</span>
      <p>{{ scene.objective }}</p>
    </div>
    <details
      v-if="scene.introduction || scene.worked_example"
      class="teaching-card"
      :open="scene.phase === 'guided'"
    >
      <summary>{{ t("理解概念与推理示例", "Concept & worked example") }}</summary>
      <p v-if="scene.introduction">{{ scene.introduction }}</p>
      <template v-if="scene.worked_example">
        <strong>{{ t("跟着推理一次", "Follow the reasoning") }}</strong>
        <p>{{ scene.worked_example }}</p>
      </template>
    </details>
    <template v-if="scene.type === 'experiment'">
      <div class="experiment-board">
        <div class="result-row">
          <span>{{ scene.result_label }}</span
          ><strong
            >{{ fmt(result) }} <small>{{ scene.result_unit }}</small></strong
          ><span class="live-pill"><span />{{ t("实时变化", "LIVE") }}</span>
        </div>
        <svg
          class="chart"
          viewBox="0 0 580 250"
          role="img"
          :aria-label="`${scene.variable} / ${scene.result_label}`"
        >
          <defs>
            <linearGradient id="area" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#258966" stop-opacity=".17" />
              <stop offset="100%" stop-color="#258966" stop-opacity="0" />
            </linearGradient>
          </defs>
          <line
            v-for="y in [40, 83, 126, 169, 212]"
            :key="y"
            x1="38"
            :y1="y"
            x2="542"
            :y2="y"
            stroke="#dce7df"
            stroke-dasharray="4 5"
          />
          <polygon
            :points="`38,212 ${geometry.line} 542,212`"
            fill="url(#area)"
          />
          <polyline
            :points="geometry.line"
            fill="none"
            stroke="#258966"
            stroke-width="3"
            stroke-linejoin="round"
          />
          <line
            :x1="geometry.x"
            y1="30"
            :x2="geometry.x"
            y2="212"
            stroke="#258966"
            stroke-dasharray="4 4"
            opacity=".5"
          />
          <circle
            :cx="geometry.x"
            :cy="geometry.y"
            r="7"
            fill="#258966"
            stroke="white"
            stroke-width="3"
          />
          <text x="38" y="239">{{ scene.min }} {{ scene.unit }}</text>
          <text x="542" y="239" text-anchor="end">
            {{ scene.max }} {{ scene.unit }}
          </text>
        </svg>
        <div class="slider-label">
          <label for="parameter">{{ scene.variable }}</label
          ><strong>{{ fmt(value) }} {{ scene.unit }}</strong>
        </div>
        <input
          id="parameter"
          v-model.number="value"
          type="range"
          :min="scene.min"
          :max="scene.max"
          :step="scene.step"
          @input="checked = false"
        />
        <p class="small muted">
          {{
            t(
              "基于预设数据点进行线性插值，适用范围见知识解释。",
              "Linear interpolation between preset data points. See the explanation for model limits.",
            )
          }}
        </p>
      </div>
    </template>
    <template v-else-if="scene.type === 'decision'">
      <div class="context-card">
        <span class="eyebrow">{{ t("进入情境", "THE SCENARIO") }}</span>
        <p>{{ scene.context }}</p>
      </div>
      <div class="options">
        <button
          v-for="(option, i) in scene.options"
          :key="option.id"
          :class="['option', { selected: selected === option.id }]"
          @click="
            selected = option.id;
            checked = false;
          "
        >
          <span class="option-letter">{{ String.fromCharCode(65 + i) }}</span
          ><span>{{ option.text }}</span
          ><Check v-if="selected === option.id" :size="18" />
        </button>
      </div>
    </template>
    <template v-else-if="scene.type === 'recall'">
      <div class="recall-board">
        <label for="recall-response">{{ scene.question }}</label>
        <p class="small muted">
          {{
            t(
              "先用自己的话作答，再对照参考思路。这是自我检查，不是 AI 评分。",
              "Answer in your own words before viewing the reference. This is self-assessment, not AI grading.",
            )
          }}
        </p>
        <textarea
          id="recall-response"
          v-model="response"
          rows="5"
          maxlength="6000"
          @input="
            reviewed = false;
            checked = false;
            checkpoints = [];
          "
          @change="emit('draft', response)"
        />
        <div v-if="reviewed" class="reference-answer">
          <strong>{{ t("参考思路", "Reference reasoning") }}</strong>
          <p>{{ scene.reference_answer }}</p>
          <strong>{{ t("我的解释已经覆盖", "My explanation covers") }}</strong>
          <label
            v-for="point in scene.checkpoints"
            :key="point"
            class="checkpoint"
          >
            <input
              v-model="checkpoints"
              type="checkbox"
              :value="point"
              @change="checked = false"
            />
            <span>{{ point }}</span>
          </label>
        </div>
      </div>
    </template>
    <template v-else>
      <p class="small muted">
        {{
          t(
            "拖拽卡片，或使用上下箭头调整顺序。",
            "Drag the cards or use the arrows to reorder them.",
          )
        }}
      </p>
      <div class="sort-list">
        <div
          v-for="(id, i) in order"
          :key="id"
          class="sort-item"
          draggable="true"
          @dragstart="dragging = i"
          @dragend="dragging = null"
          @dragover.prevent
          @drop.prevent="drop(i)"
        >
          <GripVertical :size="18" class="muted" /><span class="sort-number">{{
            i + 1
          }}</span
          ><span class="sort-text">{{
            scene.items.find((x) => x.id === id)?.text
          }}</span>
          <div>
            <button
              class="icon-button"
              :disabled="i === 0"
              :aria-label="t('上移', 'Move up')"
              @click="move(i, i - 1)"
            >
              <ArrowUp :size="17" /></button
            ><button
              class="icon-button"
              :disabled="i === order.length - 1"
              :aria-label="t('下移', 'Move down')"
              @click="move(i, i + 1)"
            >
              <ArrowDown :size="17" />
            </button>
          </div>
        </div>
      </div>
    </template>
    <div v-if="checked" class="feedback" :class="{ correct }" role="status">
      <span class="feedback-title"
        ><Sparkles :size="18" />{{
          scene.type === 'recall' && correct
            ? t("自查完成", "Self-check complete")
            : correct
            ? t("你发现了！", "You got it!")
            : t("再探索一下", "Keep exploring")
        }}</span
      >
      <p>{{ feedback }}</p>
    </div>
    <div v-if="done && !checked" class="done-note">
      <Check :size="16" />{{
        t(
          "已完成 · 你可以随时重新探索",
          "Completed · You can explore again anytime",
        )
      }}
    </div>
    <div class="scene-actions">
      <button class="button secondary" @click="reset">
        <RotateCcw :size="16" />{{ t("重置", "Reset") }}</button
      ><button
        v-if="scene.type === 'recall' && !reviewed"
        class="button primary"
        :disabled="!response.trim()"
        @click="
          reviewed = true;
          emit('draft', response);
        "
      >
        {{ t("对照参考思路", "Compare with reference") }}<ArrowRight :size="16" />
      </button><button
        v-else-if="checked && correct"
        class="button primary"
        @click="emit('next')"
      >
        {{ t("继续学习", "Continue") }}<ArrowRight :size="16" /></button
      ><button
        v-else
        class="button primary"
        :disabled="scene.type === 'decision' && !selected"
        @click="submit"
      >
        {{
          scene.type === 'recall'
            ? t("提交自查", "Submit self-check")
            : t("验证我的发现", "Check my discovery")
        }}<ArrowRight :size="16" />
      </button>
    </div>
  </div>
</template>
