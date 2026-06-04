# AI English Speaking Coach

> 七牛云 × XEngineer 暑期实训营 第三批次 | 2026-06-05

一款 AI 英语口语陪练 Web 应用，支持场景化对话训练、实时发音评测、语法纠错与课后总结。

## 功能
- 场景选择：面试 / 点餐 / 会议
- 实时语音对话（语音 → ASR → LLM → TTS）
- 发音评测 & 语法纠错
- 课后量化报告

## 技术栈
- Frontend: Next.js 14 + TypeScript + Tailwind CSS
- Backend: FastAPI + Python 3.11
- ASR: OpenAI Whisper API
- LLM: Claude claude-sonnet-4-6
- TTS: OpenAI TTS API
- DB: SQLite

## 快速启动

### Backend
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env  # 填写 API Keys
uvicorn main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
cp .env.local.example .env.local  # 填写 API URL
npm run dev
```

访问 http://localhost:3000
