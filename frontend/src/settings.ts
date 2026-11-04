import type { Settings } from "./types";

const storageKey = "wonderlab-settings";

export function loadSettings(storage: Pick<Storage, "getItem">) {
  const settings: Settings = {
    base_url: "https://api.openai.com/v1",
    model: "",
    api_key: "",
    json_mode: true,
  };
  let rememberKey = false;
  try {
    const saved = JSON.parse(storage.getItem(storageKey) || "null");
    if (saved) {
      settings.base_url = String(saved.base_url || settings.base_url);
      settings.model = String(saved.model || "");
      settings.json_mode = saved.json_mode !== false;
      rememberKey = saved.remember_key === true;
      settings.api_key =
        rememberKey && typeof saved.api_key === "string" ? saved.api_key : "";
    }
  } catch {}
  return { settings, rememberKey };
}

export function storeSettings(
  storage: Pick<Storage, "setItem">,
  settings: Settings,
  rememberKey: boolean,
) {
  storage.setItem(
    storageKey,
    JSON.stringify({
      base_url: settings.base_url,
      model: settings.model,
      json_mode: settings.json_mode,
      remember_key: rememberKey,
      ...(rememberKey ? { api_key: settings.api_key } : {}),
    }),
  );
}
