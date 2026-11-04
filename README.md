# WonderLab

本地运行的 AI 互动学习 MVP。输入文本、PDF 或学习主题，使用自己的 OpenAI 兼容 API 生成学习路线，再通过参数实验、情境决策和排序挑战学习。支持中文 / English。

## 运行 / Run locally

需要 **Python 3.11+、Node.js 22.12+、npm**。首次启动需要联网下载依赖。

```bash
./start.sh
```

打开 http://127.0.0.1:8000 。按 Ctrl+C 停止。没有 API Key 时，可以直接体验经济、物理、编程三个内置课程。

Windows 请在 PowerShell 中执行：

```powershell
python -m venv .venv
.venv\Scripts\python -m pip install -r backend/requirements.txt
npm ci
npm run build
.venv\Scripts\python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --no-access-log
```

Requires Python 3.11+ and Node.js 22.12+. Run `./start.sh`, then open http://127.0.0.1:8000. The first run downloads dependencies. Try any of the three curated examples without an API key.

## 连接模型 / Connect a model

1. 打开左下角“模型与 API 设置 / Model & API settings”。
2. 填写 Base URL（如 `https://api.openai.com/v1`）、模型 ID 和自己的 API Key。Base URL 不包含 `/chat/completions`，模型 ID 以服务商文档为准。
3. 测试连接并应用。接口需要支持非流式 `POST /chat/completions`；默认启用 `response_format: {"type":"json_object"}`。不支持 JSON 模式的服务可关闭该选项，后端仍会校验场景结构。
4. 粘贴至少 10 字符的资料、上传 PDF，或输入主题。生成语言跟随界面语言。已有课程保留生成时的语言，不随界面切换自动翻译。

Add a compatible API base URL (without `/chat/completions`), model ID, and API key in settings. Test, apply, and create a course. Switch the UI language before generation to choose the course and tutor language. Existing course content is not automatically translated.

Key 仅在当前页面内存保存，刷新页面后清除。模型地址和名称保存在浏览器 localStorage；资料、路线、作答、完成状态保存在 `backend/wonderlab.sqlite3`。后端不保存 API Key，不记录请求正文。AI 生成和辅导会将当前资料发往用户配置的 API 服务。无云托管、账户系统或遥测。请勿把本地服务器暴露到公网。

Your key stays in page memory and clears on reload. Endpoint preferences use browser localStorage. Material, courses, answers, and progress use local SQLite. AI generation and tutoring send material to your configured provider. No hosted service, account, or telemetry is included.

## MVP 范围

- 文本、主题、可提取文字的 PDF（≤12 MB、150 页、60,000 字符）；扫描件先自行 OCR。
- AI 生成 2–6 个任务，至少两种互动形式；路线可调整顺序。
- 实验仅使用数值点的线性插值，不执行 AI 代码。每个实验有明确参数目标和模型适用范围。
- 决策逐选项解释；排序支持拖拽和上下移动；规则反馈无需再次调用 AI。
- 提示、AI 追问、知识解释、原文查看；摘录经空白规范化后必须能匹配输入资料，否则不标记为原文依据。主题生成没有原文引用。引用存在不代表已自动验证事实正确性。
- 自动保存当前任务、历史作答和完成状态；本地学习库可继续、重玩或删除。
- 真实模型效果与 API 兼容性需要使用自己的 Key 验证；内置示例是固定内容，明确区别于 AI 生成。

未纳入：OCR、网页抓取、账户、多用户、动态难度、间隔复习、分享、AI 生成 HTML，以及 Anthropic/Gemini 原生协议。

## 开发与验证 / Development

两个终端分别运行：

```bash
.venv/bin/python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
npm run dev
```

前端 http://127.0.0.1:5173 ，`/api` 代理到 FastAPI。

```bash
npm run build
npm test
.venv/bin/python -m pytest backend/tests -q
```

代码位置：`frontend/src/components/ScenePlayer.vue` 为互动模板；`backend/models.py` 为权威 JSON Schema；`backend/ai.py` 为模型调用与教学提示；`backend/main.py` 为本地 API、PDF 和 SQLite。导出的场景结构见 `docs/course.schema.json`。

API 协议参考：[DeepSeek JSON Output](https://api-docs.deepseek.com/guides/json_mode/)。文件接收与解析参考：[FastAPI UploadFile](https://fastapi.tiangolo.com/tutorial/request-files/)、[pypdf](https://github.com/py-pdf/pypdf)。

## Git 开发流程 / Git workflow

- `main` 保存已验证的基线。每个功能或修复从 `main` 新建 `codex/<topic>` 分支。
- 修改前检查 `git status` 和已有差异，保留不属于当前任务的改动。
- 按改动范围运行上面的构建或测试，提交前执行 `git diff --check`。
- 仅暂存当前任务相关文件，检查 `git diff --cached`，每次提交聚焦一个明确目的。
- 确认验证通过后合并到 `main`；远程推送、PR 和发布按具体任务执行。

依赖目录、构建产物、本地数据库和 `.env*` 配置文件由 `.gitignore` 排除。
