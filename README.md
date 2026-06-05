# AI English Speaking Coach

> 七牛云 × XEngineer 暑期实训营 第三批次 | 2026-06-05

一款 AI 英语口语陪练 Web 应用，通过场景化对话帮助用户提升英语口语表达能力。

## 核心功能

- **场景化对话练习**：面试 / 点餐 / 会议三种场景，AI 扮演对话角色
- **实时语音识别**：浏览器原生 SpeechRecognition，即说即转文字
- **AI 实时纠错**：每轮对话后检测语法/词汇错误并给出正确表达
- **AI 语音播报**：AI 回复自动朗读（美式英语发音）
- **跨会话记忆**：记住上次练习的薄弱项，下次开场自动回顾并针对性训练
- **课后量化报告**：整体评分、语法错误数、词汇分、表达清晰度、结构分、歧义表达分析
- **历史进度可视化**：折线图记录每次 overall / clarity / structure 三项分数变化

## 技术栈

| 层 | 技术 |
|---|---|
| 前端 | Next.js 14 + TypeScript + Tailwind CSS |
| 后端 | FastAPI + Python 3.11 + aiosqlite |
| 数据库 | SQLite |
| LLM | DeepSeek API（对话生成、纠错、报告分析） |
| ASR | 浏览器原生 Web Speech API（SpeechRecognition） |
| TTS | 浏览器原生 speechSynthesis（Google US English） |
| 实时通信 | WebSocket（FastAPI WebSocket） |

## 快速启动

### 环境要求
- Python 3.11+
- Node.js 18+
- **Chrome 浏览器**（SpeechRecognition 仅 Chrome 支持）

### 1. 配置环境变量

```bash
cd backend
cp .env.example .env
# 编辑 .env，填写 DEEPSEEK_API_KEY
```

`.env` 内容：
```
DEEPSEEK_API_KEY=your_deepseek_api_key_here
DATABASE_URL=./data/coach.db
```

### 2. 启动后端

```bash
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000
```

### 3. 启动前端

```bash
cd frontend
npm install
npm run dev
```

访问 **http://localhost:3000**（必须用 Chrome）

## 使用流程

1. 首页选择练习场景（面试 / 点餐 / 会议）
2. 点击麦克风按钮 → 说英语 → 松开
3. AI 用美式英语回复，同时在右侧显示语法纠错
4. 说完后点 **End Session** → 查看课后报告
5. 下次同场景练习时，AI 会自动回顾上次的薄弱项

## 项目结构

```
ai-english-coach/
├── backend/
│   ├── main.py              # FastAPI 入口
│   ├── routers/
│   │   ├── session.py       # 会话管理 API
│   │   ├── ws.py            # WebSocket 实时对话
│   │   ├── report.py        # 课后报告生成
│   │   └── history.py       # 历史记录 API
│   ├── services/
│   │   └── llm_service.py   # DeepSeek LLM 服务（对话/纠错/报告）
│   ├── models/db.py         # SQLite 数据库初始化
│   └── schemas/             # API 数据结构定义
└── frontend/
    └── src/app/
        ├── page.tsx          # 首页场景选择
        ├── practice/[scene]/ # 语音练习页
        ├── report/[sessionId]/ # 课后报告页
        └── history/          # 历史进度页
```
