# WonderLab

**English** | [简体中文](README.zh-CN.md)

Turn text, PDFs, or a topic into an interactive learning path. WonderLab runs locally and connects to an OpenAI-compatible API of your choice. The interface supports English and Simplified Chinese.

Courses move from concepts and worked examples to practice and independent application. You can also try three curated courses in economics, physics, and programming without an API key.

## Features

- **A coherent learning path:** 2–4 learning goals and 3–6 activities, with explanations, examples, practice, and a final transfer task.
- **Activities that fit the subject:** numeric experiments, scenario decisions, ordering challenges, and recall exercises. Courses do not need to include every activity type.
- **Recall before review:** write an answer, compare it with reference reasoning, then check your own explanation. Self-assessment records progress; it is not automatic AI grading or proof of mastery.
- **Help when needed:** optional hints, AI tutoring, knowledge explanations, and access to the original material.
- **A local learning library:** save answers and progress, resume courses, reorder activities, replay, or delete them.

## Quick start

Requirements: **Python 3.11+, Node.js 22.12+, and npm**. The first setup needs internet access to download dependencies.

### macOS / Linux

From the project directory:

```bash
./start.sh
```

The script installs dependencies as needed, builds the frontend, and starts the local server.

### Windows

Run in PowerShell from the project directory:

```powershell
python -m venv .venv
.venv\Scripts\python -m pip install -r backend/requirements.txt
npm ci
npm run build
.venv\Scripts\python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --no-access-log
```

Open [WonderLab](http://127.0.0.1:8000). Press `Ctrl+C` in the terminal to stop the server. To explore without configuring a model, choose a curated course on the home page.

## Connect a model and create a course

1. Open **Model & API settings** in the sidebar.
2. Enter your provider's **Base URL**, **model ID**, and **API key**. The Base URL should include the API prefix, such as `/v1`, but omit `/chat/completions`.
3. Select **Test connection**, then **Apply settings**.
4. Choose **Paste text**, **Upload PDF**, or **Explore a topic**, enter your material, and create a learning experience.

The provider must support non-streaming `POST /chat/completions`. JSON mode is enabled by default using `response_format: {"type":"json_object"}`. If your provider does not support it, disable JSON mode in settings; course validation still applies.

Choose the interface language before generation to set the course language. Tutor replies follow the current interface language. Changing languages does not translate existing course content.

### Input limits

| Input | Requirements |
| --- | --- |
| Text | 10–60,000 characters, excluding leading and trailing whitespace |
| Topic | Any nonempty topic, such as “entropy” or “compound interest”; up to 60,000 characters |
| PDF | Extractable text; up to 12 MB, 150 pages, and 60,000 extracted characters; at least 10 text characters |

Scanned PDFs need OCR before upload. Topic courses use model knowledge and have no source quotations. For text and PDF courses, quotations are kept only when they match the supplied material after whitespace normalization. A matching quote does not establish factual accuracy.

### If generation fails

- Check the API address, key, model ID, and JSON mode setting. A successful connection test confirms connectivity, not course-generation quality.
- Valid JSON must also satisfy the course schema and design rules. Errors show up to three specific issues, such as `scenes.1.sort: Correct order must contain every item exactly once`. Scene indexes start at zero.
- Errors do not include the raw model response or submitted material. Real model quality and API compatibility need validation with your chosen provider; curated courses are fixed examples, separate from AI-generated content.

## Data and privacy

| Data | Storage |
| --- | --- |
| API key, by default | Current page memory; cleared on reload |
| API key with **Remember API key on this device** enabled | Plain text in the current browser's localStorage after applying settings |
| API address and model ID | Browser localStorage |
| Source material, courses, answers, and progress | Local SQLite database at `backend/wonderlab.sqlite3` |

Remembered settings use the same browser and site address, including the port. Enable key storage only on your own device. Disabling Remember and applying settings removes the stored key while keeping it available in the current page. **Clear saved key** removes both the stored and active key immediately.

The backend does not persist API keys or log request bodies. Generation sends the material to your configured API provider. Tutoring also sends the current activity, learner answers, attempt counts, and conversation context. Local execution does not make those AI requests offline.

WonderLab includes no hosted service, accounts, or telemetry. Keep the server on localhost; do not expose it to the public internet.

## Scope and limitations

Experiments use piecewise-linear interpolation between numeric data points and do not execute generated code. New course prompts ask for observable result goals without disclosing parameter answers, and require explanations of model limits.

Validation rejects some invalid activities, including experiments where every reachable input is correct or the result never changes. It does not verify all facts, semantic consistency, or teaching effectiveness. Older courses remain usable and are not automatically rewritten.

The MVP does not include OCR, web scraping, accounts, multiple users, adaptive difficulty, spaced-review scheduling, sharing, generated HTML, or native Anthropic/Gemini API protocols.

## Development

The app uses Vue 3, TypeScript, and Vite for the frontend, with FastAPI and SQLite for the backend.

After installing dependencies through the quick start, run these commands in **separate terminals**:

```bash
# Terminal 1 — backend
.venv/bin/python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```

```bash
# Terminal 2 — frontend
npm run dev
```

Open the [development frontend](http://127.0.0.1:5173). Vite proxies `/api` to FastAPI on port 8000. On Windows, replace `.venv/bin/python` with `.venv\Scripts\python`.

### Checks

```bash
npm run build
npm test
.venv/bin/python -m pytest backend/tests -q
git diff --check
```

### Project map

| Path | Purpose |
| --- | --- |
| [`frontend/src/components/ScenePlayer.vue`](frontend/src/components/ScenePlayer.vue) | Activity rendering and interaction |
| [`backend/ai.py`](backend/ai.py) | Model requests and course-generation prompts |
| [`backend/models.py`](backend/models.py) | Course schema and validation rules |
| [`backend/main.py`](backend/main.py) | Local API, PDF extraction, tutoring, and persistence |
| [`docs/course.schema.json`](docs/course.schema.json) | Exported course schema |
| [`docs/learning-design.md`](docs/learning-design.md) | Teaching rationale, generation contract, and validation boundaries (Chinese) |

### Git workflow

Use `main` as the verified baseline and create `codex/<topic>` branches for changes. Check existing work before editing, preserve unrelated changes, and run checks appropriate to the task. Stage only relevant files and inspect the staged diff before committing. Merge verified changes into `main`; pushes, pull requests, and releases follow the specific task's instructions.

Dependencies, build output, local databases, and `.env*` files are excluded by `.gitignore`.
