# AI English Speaking Coach 🎙️

> 七牛云 × XEngineer 暑期实训营 · 第三批次 · 题目一：AI 英语口语陪练

一款 AI 英语口语陪练 Web 应用：在真实场景下进行语音对话训练，提供**发音评测、语法/表达纠错、地道度反馈**与**课后量化总结**，帮助用户系统性提升英语口语。

🔗 **在线体验**：https://ai-english-coach-52pn.vercel.app （国内访问需科学上网）
📖 **使用文档**：[docs/使用文档.md](docs/使用文档.md) · **功能文档**：[docs/功能文档.md](docs/功能文档.md)

---

## ✨ 核心功能

| 功能 | 说明 |
|---|---|
| 🎭 **多场景对话** | 日常场景（面试 / 点餐 / 会议 / 医院 / 电话 / 客服）+ 程序员面试场景（行为面 / 项目深挖 / 思维与 CS）；可选难度（Beginner / Intermediate / Advanced） |
| 🎤 **实时语音对话** | 录音 → Azure 语音转写 → DeepSeek 生成角色回复 → 浏览器朗读，端到端语音闭环 |
| 📊 **发音评测（三维度）** | **Accuracy**（发音准确度）/ **Fluency**（语速流畅度）/ **Expression**（表达地道度），并给出**具体改进建议**和**待改进单词**（点击可听标准发音） |
| ✍️ **实时纠错** | 每轮对话即时检测语法/词汇错误，给出「原句 → 改后」对照与解释 |
| 🔍 **选词查义 / 选句翻译** | 选中单词看音标+释义，选中短语看中文翻译，均可 🔊 点击朗读 |
| 🧠 **跨会话记忆** | 记住上次练习的薄弱项，下次开场自动回顾并针对性训练 |
| 📈 **课后量化报告** | 整体评分、语法错误、表达清晰度、结构分等多维度可视化总结 |
| 👤 **用户系统** | Clerk 登录、每日免费额度、Pro 会员（爱发电支付）无限次评测 |

---

## 🎯 发音评测评分逻辑（项目亮点）

口语评测分三个维度，各自来源与含义不同：

| 维度 | 来源 | 评分逻辑 |
|---|---|---|
| **Accuracy** | Azure Speech 发音评测 REST API | 对每个音素打分后按词汇总，反映「读得准不准」 |
| **Fluency** | 后端根据录音时长计算 WPM（每分钟词数） | 110–170 WPM 为自然语速区间，过慢/过快酌情扣分 |
| **Expression** | DeepSeek 大模型评判 | **核心是「地道度」而非「高级词汇」**——衡量是否像美国人日常的自然说法，并给出「把 X 改成 Y」式的具体建议 |

> 💡 设计理念：口语不同于作文，不以堆砌高级词汇为目标，而以**自然、地道、母语者常用的表达**为标准。

---

## 🛠 技术栈

| 层 | 技术 |
|---|---|
| 前端 | Next.js 14 (App Router) + TypeScript + Tailwind CSS |
| 认证 | Clerk |
| 后端 | FastAPI + Python 3.11 + aiosqlite |
| 数据库 | SQLite |
| 对话 / 纠错 / 报告 / 翻译 / 表达评分 | DeepSeek API |
| 语音转写（ASR）+ 发音评测 | Azure Speech Service（REST API） |
| 语音合成（TTS） | 浏览器原生 speechSynthesis |
| 实时通信 | WebSocket |
| 支付 | 爱发电（afdian）Webhook |
| 部署 | 前端 Vercel · 后端 Railway |

---

## 🏗 架构概览

```
浏览器 (Next.js)
  │  ① 麦克风录音 (MediaRecorder) → 转 WAV
  │
  ├─ WebSocket ──────────────► FastAPI ──► DeepSeek（对话生成 / 纠错）
  │                                │
  ├─ POST /api/pronunciation ─────┤
  │   (音频)                       ├─► Azure STT（转写 + 发音评测）
  │                                ├─► WPM 计算（流畅度）
  │                                └─► DeepSeek（表达地道度评分）
  │
  ├─ GET /api/translate ──────────► DeepSeek（选句翻译）
  │
  └─ speechSynthesis（AI 回复 / 单词朗读）
```

---

## 🚀 本地运行

### 环境要求
- Python 3.11+
- Node.js 18+
- **Chrome 浏览器**（语音合成体验最佳）

### 1. 后端

```bash
cd backend
cp .env.example .env          # 填入密钥（见下方环境变量）
pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000
```

### 2. 前端

```bash
cd frontend
cp .env.local.example .env.local
npm install
npm run dev
```

访问 **http://localhost:3000**

### 环境变量

**backend/.env**
```
DEEPSEEK_API_KEY=your_deepseek_api_key      # DeepSeek 大模型
AZURE_SPEECH_KEY=your_azure_speech_key      # Azure 语音服务（发音评测）
AZURE_SPEECH_REGION=eastus                  # Azure 区域
CLERK_SECRET_KEY=your_clerk_secret_key      # Clerk 认证（可选）
DATABASE_URL=./data/coach.db
```

**frontend/.env.local**
```
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
NEXT_PUBLIC_AFDIAN_URL=https://ifdian.net/a/your_page   # Pro 升级链接（可选）
```

> ⚠️ **安全提示**：`.env` / `.env.local` 已在 `.gitignore` 中，**切勿将真实密钥提交到公开仓库**。仓库内仅保留 `.env.example` 占位模板。

---

## 📁 项目结构

```
ai-english-coach/
├── backend/
│   ├── main.py                       # FastAPI 入口 + /api/translate
│   ├── routers/
│   │   ├── session.py                # 会话管理
│   │   ├── ws.py                     # WebSocket 实时对话
│   │   ├── pronunciation.py          # 发音评测 + 用户额度
│   │   ├── report.py / history.py    # 报告 / 历史
│   │   ├── assessment.py             # 能力测评
│   │   └── afdian.py                 # 爱发电支付 Webhook
│   ├── services/
│   │   ├── llm_service.py            # DeepSeek 对话/纠错/报告
│   │   └── pronunciation_service.py  # Azure 发音评测 + 三维度评分
│   ├── models/db.py                  # SQLite
│   └── utils/auth.py                 # Clerk 鉴权
└── frontend/src/
    ├── app/
    │   ├── page.tsx                  # 首页场景选择
    │   ├── practice/[scene]/         # 语音练习页（核心）
    │   ├── report/[sessionId]/       # 课后报告
    │   ├── history/                  # 历史进度
    │   └── sde-interview/            # 程序员面试专项
    └── components/
        └── WordTooltip.tsx           # 选词查义 / 选句翻译 / 朗读
```

---

## 📜 License

本项目为七牛云 × XEngineer 暑期实训营参赛作品，仅供学习交流。
