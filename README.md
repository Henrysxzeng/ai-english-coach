# AI English Speaking Coach 🎙️

> 七牛云 × XEngineer 暑期实训营 · 第三批次 · 题目一：AI 英语口语陪练

一款 AI 英语口语陪练 Web 应用，分两条产品主线：  
- **日常英语**：6 个生活场景（面试 / 点餐 / 会议 / 医院 / 电话 / 客服）真实对话训练  
- **求职英语**：SDE / Data Scientist / Product Manager / Project Manager 四条赛道结构化备考

提供**发音评测、语法纠错、地道度反馈**与**量化学习报告**，帮助用户系统性提升英语口语。

## 📺 Demo 视频（完整功能演示，建议先看）

👉 **https://www.bilibili.com/video/BV194E465EPR**

> 视频完整讲解并演示了核心功能。在线体验部署在海外，**国内访问需科学上网**；若打不开网站，看本视频即可了解完整产品。

---

🔗 **在线体验**：https://ai-english-coach-52pn.vercel.app （国内访问需科学上网）  
📖 **使用文档**：[docs/使用文档.md](docs/使用文档.md) · **功能文档**：[docs/功能文档.md](docs/功能文档.md)

---

## ✨ 核心功能

### 🗣️ 对话与语音
| 功能 | 说明 |
|---|---|
| 多场景对话 | 日常 6 场景 + 求职专项（行为/项目/系统设计等）；难度可选 |
| 人格化面试官 | 😊 友好 / 🔥 严厉 / 😐 冷面 三种 AI 风格 |
| 流式 AI 回复 | 回复逐字生成并朗读，首字延迟低 |
| 拟真音色 TTS | Azure 神经网络语音，失败自动回退浏览器 TTS |
| 苏格拉底式追问 | 对空洞回答连环追问，逼出具体细节 |
| 自适应难度 | 按实时表现动态微调 AI 用词难度 |
| 母语桥梁 | 中英混合输入，AI 教你地道英文说法 |
| 对话录音回放 | 回放每句录音 + 重听 AI 句子 |

### 📊 评测与反馈
| 功能 | 说明 |
|---|---|
| 发音三维度评测 | Accuracy / Fluency / Expression + 具体改进建议 |
| 音素级评估 | 定位读错的具体音素（如 th→s、l/r 混淆） |
| 影子跟读 Shadowing | 听标准 → 跟读 → Azure 逐词染色评分 |
| 实时纠错 | 语法/词汇错误「原句 → 改后」对照与解释 |
| 表达升级 + 风格标签 | 地道度改写；标注 Confident / Hesitant 等风格 |
| 能力雷达图 + CEFR | 五维能力雷达 + 欧标等级评定（A1–C2） |
| AI 学习教练 | 报告给个性化下一步（难度建议 + 重点突破） |

### 🎯 求职英语训练地图（北美秋招专项）
| 功能 | 说明 |
|---|---|
| 四条求职赛道 | SDE / Data Scientist / Product Manager / Project Manager |
| 六模块顺序解锁 | 自我介绍 → 简历深挖 → 行为面试 → 专项模块 → 系统设计 → Debug/规划 |
| 三阶段递进 | Learn（背稿）→ Apply（脱稿自选题）→ Master（AI 出题全真模拟） |
| 自我介绍编辑 | AI 生成稿子后可自由编辑，保存个性化版本 |
| 盲背练习 | 遮住稿子背诵，AI 对照评分：内容覆盖度 + 流畅度反馈 |
| 简历驱动深挖 | 上传简历，AI 根据真实经历出追问题 |
| 场景化 AI 角色 | 不同模块 AI 扮演不同角色（面试官 / 客户 / Pair Debug 工程师等） |

### 🔁 学习闭环
| 功能 | 说明 |
|---|---|
| 记忆闭环 | 生词收藏 → AI 在后续对话中自然复现 |
| 生词本 | 收藏生词 + 释义 + 点击发音 |
| 成长仪表盘 | 练习次数 / 平均分 / 连续打卡 + 趋势曲线 |
| 跨会话记忆 | 记住上次薄弱项，下次开场回顾 |
| 选词查义 / 选句翻译 | 选词看音标释义，选句看中文翻译，均可朗读 |
| 用户系统 | Clerk 登录、每日免费额度、Pro 会员（爱发电支付） |

---

## 🎯 发音评测评分逻辑（项目亮点）

口语评测分三个维度，各自来源与含义不同：

| 维度 | 来源 | 评分逻辑 |
|---|---|---|
| **Accuracy** | Azure Speech 发音评测 REST API | 对每个音素打分后按词汇总，反映「读得准不准」 |
| **Fluency** | 后端根据录音时长计算 WPM（每分钟词数） | 110–170 WPM 为自然语速区间，过慢/过快酌情扣分 |
| **Expression** | DeepSeek 大模型评判 | **核心是「地道度」而非「高级词汇」**——衡量是否像母语者的自然说法，并给出「把 X 改成 Y」式具体建议 |

> 💡 设计理念：口语不以堆砌高级词汇为目标，而以**自然、地道、母语者常用的表达**为标准。

---

## 🛠 技术栈

| 层 | 技术 |
|---|---|
| 前端 | Next.js 14 (App Router) + TypeScript + Tailwind CSS |
| 认证 | Clerk |
| 后端 | FastAPI + Python 3.11 |
| 数据库 | PostgreSQL（阿里云 RDS） |
| 对话 / 纠错 / 报告 / 翻译 / 表达评分 | DeepSeek API |
| 语音转写（ASR）+ 发音评测 | Azure Speech Service（REST API） |
| 语音合成（TTS） | Azure 神经网络 TTS（回退：浏览器 speechSynthesis） |
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
  ├─ GET /api/modules/* ───────────► FastAPI（进度 / 稿子 / 推进阶段）
  │
  ├─ GET /api/translate ──────────► DeepSeek（选句翻译）
  │
  └─ Azure TTS（AI 回复朗读）
```

---

## 🚀 本地运行

### 环境要求
- Python 3.11+
- Node.js 18+
- Chrome 浏览器（语音合成体验最佳）

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
DEEPSEEK_API_KEY=your_deepseek_api_key
AZURE_SPEECH_KEY=your_azure_speech_key
AZURE_SPEECH_REGION=eastus
CLERK_SECRET_KEY=your_clerk_secret_key
DATABASE_URL=postgresql://user:pass@host:5432/dbname
```

**frontend/.env.local**
```
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
NEXT_PUBLIC_AFDIAN_URL=https://ifdian.net/a/your_page
```

> ⚠️ **安全提示**：`.env` / `.env.local` 已在 `.gitignore` 中，**切勿将真实密钥提交到公开仓库**。

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
│   │   ├── modules.py                # 求职训练地图（进度/稿子/推进）
│   │   ├── report.py / history.py    # 报告 / 历史
│   │   ├── assessment.py             # 能力测评
│   │   └── afdian.py                 # 爱发电支付 Webhook
│   ├── services/
│   │   ├── llm_service.py            # DeepSeek 场景 prompt / 纠错 / 报告
│   │   └── pronunciation_service.py  # Azure 发音评测 + 三维度评分
│   ├── schemas/api_schemas.py        # Pydantic 请求/响应模型
│   ├── models/                       # DB 初始化 + PostgreSQL 连接
│   └── utils/auth.py                 # Clerk 鉴权
└── frontend/src/
    ├── app/
    │   ├── page.tsx                  # 首页（日常英语 / 求职英语 入口）
    │   ├── daily/                    # 日常英语场景选择
    │   ├── career/                   # 求职英语着陆页（简历管理 + 入口）
    │   ├── modules/                  # 求职训练地图
    │   │   ├── page.tsx              # 四赛道模块总览
    │   │   └── [track]/[module]/     # 单模块阶段页（学/练/考）
    │   ├── practice/[scene]/         # 语音练习页（核心）
    │   ├── report/[sessionId]/       # 课后报告
    │   ├── sde-interview/            # 求职专项自由练习
    │   ├── history/                  # 历史进度
    │   └── assessment/               # 英语水平测试（CEFR）
    └── components/
        └── WordTooltip.tsx           # 选词查义 / 选句翻译 / 朗读
```

---

## 📜 License

本项目为七牛云 × XEngineer 暑期实训营参赛作品，仅供学习交流。
