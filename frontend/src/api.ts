import type { Project } from "./types";
export async function request<T>(
  url: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`/api${url}`, {
    ...options,
    headers: {
      ...(options.body instanceof FormData
        ? {}
        : { "Content-Type": "application/json" }),
      ...options.headers,
    },
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(
      typeof data.detail === "string"
        ? data.detail
        : `请求失败（${response.status}），请检查输入或重试。`,
    );
  }
  return response.json();
}
export const saveProject = (project: Project) =>
  request<Project>(`/projects/${project.id}`, {
    method: "PUT",
    body: JSON.stringify(project),
  });
