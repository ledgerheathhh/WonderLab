export interface Settings {
  base_url: string;
  model: string;
  api_key: string;
  json_mode: boolean;
}
export interface BaseScene {
  id: string;
  title: string;
  objective: string;
  explanation: string;
  hint: string;
  quote: string;
  phase?: "guided" | "practice" | "transfer" | null;
  introduction?: string;
  worked_example?: string;
}
export interface Experiment extends BaseScene {
  type: "experiment";
  variable: string;
  unit: string;
  result_label: string;
  result_unit: string;
  min: number;
  max: number;
  step: number;
  points: { x: number; y: number }[];
  target_min: number;
  target_max: number;
}
export interface Decision extends BaseScene {
  type: "decision";
  context: string;
  options: { id: string; text: string; correct: boolean; feedback: string }[];
}
export interface SortScene extends BaseScene {
  type: "sort";
  items: { id: string; text: string }[];
  correct_order: string[];
}
export interface Recall extends BaseScene {
  type: "recall";
  question: string;
  reference_answer: string;
  checkpoints: string[];
}
export type Scene = Experiment | Decision | SortScene | Recall;
export interface Course {
  title: string;
  summary: string;
  subject: string;
  learning_goals?: string[];
  scenes: Scene[];
}
export interface Progress {
  completed: string[];
  active: string;
  attempts: Record<string, number>;
  answers: Record<string, string | number | string[]>;
}
export interface Project {
  id: string;
  source: string;
  source_name: string;
  source_kind: "text" | "pdf" | "topic" | "example";
  course: Course;
  progress: Progress;
  updated_at: string;
}
export const sceneNames = {
  experiment: "交互实验",
  decision: "情境决策",
  sort: "排序挑战",
  recall: "回忆与迁移",
};
export function interpolate(points: Experiment["points"], x: number): number {
  if (x <= points[0]!.x) return points[0]!.y;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1]!,
      b = points[i]!;
    if (x <= b.x) return a.y + ((b.y - a.y) * (x - a.x)) / (b.x - a.x);
  }
  return points[points.length - 1]!.y;
}
