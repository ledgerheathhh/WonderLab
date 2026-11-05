# WonderLab

[English](README.md) | **简体中文**

把文本、PDF 或学习主题转化为互动学习路线。WonderLab 在本地运行，连接你选择的 OpenAI 兼容 API，界面支持简体中文和英文。

课程从概念讲解、推理示例逐步过渡到应用练习和独立迁移。无需配置 API Key，也可以体验经济、物理、编程三个内置课程。

## 主要功能

- **连贯的学习路线**：围绕 2–4 个学习目标生成 3–6 个任务，包含讲解、示例、练习和最后的迁移任务。
- **适合知识点的互动**：支持数值实验、情境决策、排序挑战、回忆练习，不要求每门课凑齐所有形式。
- **先回忆，再对照**：先用自己的话作答，再查看参考思路并逐项自查。自查用于记录进度，不代表 AI 自动评分或已经掌握。
- **按需获得帮助**：展开提示、向 AI 追问、阅读知识解释，或回到原始资料。
- **本地学习库**：保存作答和进度，继续学习、调整任务顺序、重新探索或删除课程。

## 快速开始

需要 **Python 3.11+、Node.js 22.12+ 和 npm**。首次安装需要联网下载依赖。

### macOS / Linux

在项目目录中执行：

```bash
./start.sh
```

脚本会按需安装依赖、构建前端并启动本地服务。

### Windows

在项目目录中打开 PowerShell，执行：

```powershell
python -m venv .venv
.venv\Scripts\python -m pip install -r backend/requirements.txt
npm ci
npm run build
.venv\Scripts\python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --no-access-log
```

打开 [WonderLab](http://127.0.0.1:8000)。在终端按 `Ctrl+C` 停止服务。暂不配置模型时，可以直接选择首页的内置课程。

## 连接模型并生成课程

1. 打开侧边栏的**模型与 API 设置**。
2. 填写服务商的 **Base URL**、**模型 ID** 和 **API Key**。Base URL 应保留 `/v1` 等 API 前缀，不包含 `/chat/completions`。
3. 点击**测试连接**，再点击**应用设置**。
4. 选择**粘贴文本**、**上传 PDF** 或**输入主题**，填写内容后生成学习资料。

服务需要支持非流式 `POST /chat/completions`。默认通过 `response_format: {"type":"json_object"}` 启用 JSON 模式；如果服务商不支持，可在设置中关闭，课程结构仍会经过校验。

生成前切换界面语言，可以选择课程语言。AI 辅导回复跟随当前界面语言，已有课程内容不会随语言切换自动翻译。

### 输入限制

| 输入方式 | 要求 |
| --- | --- |
| 文本 | 10–60,000 字符，不计首尾空白 |
| 主题 | 任意非空主题，如“熵”“复利”；最多 60,000 字符 |
| PDF | 可提取文字；最大 12 MB、150 页、60,000 个提取字符；至少包含 10 个文字字符 |

扫描件请先自行 OCR。主题课程使用模型知识，不提供原文引用；文本和 PDF 课程的摘录经空白规范化后，必须匹配输入资料才能保留。引用匹配不代表事实已经验证。

### 生成失败时

- 检查 API 地址、Key、模型 ID 和 JSON 模式。连接测试成功只说明接口可连通，不代表能生成合格课程。
- 有效 JSON 还必须满足课程结构和设计规则。报错最多显示三个具体问题，例如 `scenes.1.sort: 排序答案必须恰好包含每个条目一次`，任务索引从 0 开始。
- 报错不包含模型原始回答或提交的资料。真实模型效果和 API 兼容性需要使用所选服务验证；内置课程是固定示例，与 AI 生成内容分开标识。

## 数据与隐私

| 数据 | 保存位置 |
| --- | --- |
| API Key，默认情况 | 当前页面内存，刷新后清除 |
| 勾选**在此设备记住 API Key**并应用设置后的 Key | 当前浏览器 localStorage，以明文保存 |
| API 地址、模型 ID | 浏览器 localStorage |
| 原始资料、课程、作答和进度 | 本地 SQLite 数据库 `backend/wonderlab.sqlite3` |

已记住的设置需要使用同一浏览器和相同访问地址，包括端口。仅在自己的设备上开启 Key 保存。取消勾选并应用设置，会移除已保存的 Key，当前页面仍可使用；**清除已保存的 Key**会立即清除已保存和当前使用的 Key。

后端不持久化 API Key，也不记录请求正文。生成课程会将资料发送到你配置的 API 服务；AI 辅导还会发送当前任务、学习者作答、尝试次数和对话上下文。本地运行并不代表 AI 请求离线处理。

WonderLab 不包含云托管、账户系统或遥测。服务应保持在 localhost，不要暴露到公网。

## 功能边界

实验通过数值点之间的分段线性插值运行，不执行生成代码。新课程提示词要求实验围绕可观察的结果目标设计，不直接透露参数答案，并说明模型适用范围。

校验会拦截部分无效任务，例如所有可到达参数都判为正确、实验结果始终不变；不会自动验证全部事实、语义一致性或教学效果。旧课程仍可使用，不会自动重写。

MVP 暂不包含 OCR、网页抓取、账户、多用户、动态难度、间隔复习调度、分享、生成 HTML，以及 Anthropic/Gemini 原生 API 协议。

## 开发

前端使用 Vue 3、TypeScript 和 Vite，后端使用 FastAPI 和 SQLite。

按快速开始安装依赖后，在**两个终端**分别运行：

```bash
# 终端 1：后端
.venv/bin/python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```

```bash
# 终端 2：前端
npm run dev
```

打开[开发前端](http://127.0.0.1:5173)，Vite 会将 `/api` 代理到 8000 端口的 FastAPI。Windows 下将 `.venv/bin/python` 替换为 `.venv\Scripts\python`。

### 检查命令

```bash
npm run build
npm test
.venv/bin/python -m pytest backend/tests -q
git diff --check
```

### 项目结构

| 路径 | 用途 |
| --- | --- |
| [`frontend/src/components/ScenePlayer.vue`](frontend/src/components/ScenePlayer.vue) | 任务渲染与互动 |
| [`backend/ai.py`](backend/ai.py) | 模型请求与课程生成提示词 |
| [`backend/models.py`](backend/models.py) | 课程结构与校验规则 |
| [`backend/main.py`](backend/main.py) | 本地 API、PDF 提取、AI 辅导与数据保存 |
| [`docs/course.schema.json`](docs/course.schema.json) | 导出的课程 Schema |
| [`docs/learning-design.md`](docs/learning-design.md) | 教学依据、生成契约与校验边界 |

### Git 开发流程

`main` 保存已验证的基线，修改从 `codex/<topic>` 分支开始。编辑前检查已有改动，保留无关内容，并按任务范围执行检查。只暂存相关文件，提交前检查暂存差异。验证通过后合并到 `main`；推送、PR 和发布按具体任务执行。

依赖、构建产物、本地数据库和 `.env*` 文件由 `.gitignore` 排除。
