import { ref } from "vue";
export type Language = "zh" | "en";
export const language = ref<Language>(
  localStorage.getItem("wonderlab-language") === "en" ? "en" : "zh",
);
export function t(zh: string, en: string) {
  return language.value === "zh" ? zh : en;
}
export function switchLanguage() {
  language.value = language.value === "zh" ? "en" : "zh";
  localStorage.setItem("wonderlab-language", language.value);
}
