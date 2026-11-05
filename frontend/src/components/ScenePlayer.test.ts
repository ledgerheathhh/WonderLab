import { describe, expect, it, vi } from "vitest";
import { createSSRApp } from "vue";
import { renderToString } from "vue/server-renderer";
import ScenePlayer from "./ScenePlayer.vue";
import type { Recall, Decision } from "../types";

vi.mock("../i18n", () => ({ t: (_zh: string, en: string) => en }));

const progress = { completed: [], active: "", attempts: {}, answers: {} };
const recall: Recall = {
  id: "transfer", type: "recall", phase: "transfer", title: "A new situation",
  objective: "Explain a new situation.", question: "Why does it happen?",
  reference_answer: "The reference must stay hidden before an attempt.",
  checkpoints: ["Explain the cause.", "State the boundary."],
  explanation: "The full explanation.", hint: "Think about the cause.", quote: "",
};
const decision: Decision = {
  id: "guided", type: "decision", phase: "guided", title: "Learn a principle",
  objective: "Apply the principle.", introduction: "A necessary concept.",
  worked_example: "A different example with reasoning.", explanation: "Why it works.",
  hint: "Think again.", quote: "", context: "Choose a consequence.",
  options: [{ id: "a", text: "A consequence", correct: true, feedback: "A reason." }],
};

describe("learning scaffolds", () => {
  it("requires an attempt before revealing the recall reference", async () => {
    const html = await renderToString(createSSRApp(ScenePlayer, { scene: recall, progress }));
    expect(html).toContain("Why does it happen?");
    expect(html).not.toContain(recall.reference_answer);
    expect(html).not.toContain(recall.checkpoints[0]);
    expect(html).toMatch(/<button[^>]*disabled[^>]*>\s*Compare with reference/);
  });

  it("opens instruction and a worked example in the guided phase", async () => {
    const html = await renderToString(createSSRApp(ScenePlayer, { scene: decision, progress }));
    expect(html).toMatch(/<details[^>]*class="teaching-card"[^>]*open/);
    expect(html).toContain(decision.introduction);
    expect(html).toContain(decision.worked_example);
  });

  it("fades the example in the practice phase", async () => {
    const html = await renderToString(createSSRApp(ScenePlayer, {
      scene: { ...decision, phase: "practice" }, progress,
    }));
    expect(html).toContain("teaching-card");
    expect(html).not.toMatch(/<details[^>]*open/);
  });

  it("renders an older activity without the new teaching fields", async () => {
    const { phase, introduction, worked_example, ...legacy } = decision;
    const html = await renderToString(createSSRApp(ScenePlayer, { scene: legacy, progress }));
    expect(html).toContain(legacy.context);
    expect(html).not.toContain("teaching-card");
  });
});
