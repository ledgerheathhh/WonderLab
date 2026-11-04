import { describe, it, expect } from "vitest";
import { loadSettings, storeSettings } from "./settings";
import type { Settings } from "./types";

const settings: Settings = {
  base_url: "https://provider.example/v1",
  model: "test-model",
  api_key: "test-key-not-a-real-secret",
  json_mode: false,
};

function memoryStorage(initial: string | null = null) {
  const values = new Map<string, string>();
  if (initial !== null) values.set("wonderlab-settings", initial);
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, next: string) => { values.set(key, next); },
  };
}

describe("API key persistence", () => {
  it("keeps the default key in memory only", () => {
    const storage = memoryStorage();
    expect(loadSettings(storage).rememberKey).toBe(false);
    storeSettings(storage, settings, false);
    expect(storage.getItem("wonderlab-settings")).not.toContain(settings.api_key);
    expect(loadSettings(storage)).toEqual({
      settings: { ...settings, api_key: "" }, rememberKey: false,
    });
  });

  it("restores a key after a fresh load only when opted in", () => {
    const storage = memoryStorage();
    storeSettings(storage, settings, true);
    expect(loadSettings(storage)).toEqual({ settings, rememberKey: true });
  });

  it("removes a previously remembered key when opting out", () => {
    const storage = memoryStorage();
    storeSettings(storage, settings, true);
    storeSettings(storage, settings, false);
    expect(storage.getItem("wonderlab-settings")).not.toContain(settings.api_key);
    expect(loadSettings(storage).settings.api_key).toBe("");
  });

  it("clears the remembered key while keeping endpoint preferences", () => {
    const storage = memoryStorage();
    storeSettings(storage, settings, true);
    storeSettings(storage, { ...settings, api_key: "" }, false);
    expect(loadSettings(storage)).toEqual({
      settings: { ...settings, api_key: "" }, rememberKey: false,
    });
  });

  it("does not restore a key from old preferences without explicit consent", () => {
    for (const remember_key of [undefined, false, "true"]) {
      const storage = memoryStorage(JSON.stringify({ ...settings, remember_key }));
      expect(loadSettings(storage).settings.api_key).toBe("");
    }
  });

  it("starts with empty settings when stored preferences are malformed", () => {
    const result = loadSettings(memoryStorage("{invalid"));
    expect(result.rememberKey).toBe(false);
    expect(result.settings.api_key).toBe("");
    expect(result.settings.base_url).toBe("https://api.openai.com/v1");
  });
});
