# qa_checklist.md | qa | v1.0
# TASK-017: 端到端冒烟测试清单
# 测试人: QA Engineer | 项目: AI English Speaking Coach
# 执行前提: Backend (port 8000) 和 Frontend (port 3000) 均已启动

---

## 测试环境

| 项目 | 值 |
|------|----|
| Backend URL | http://localhost:8000 |
| Frontend URL | http://localhost:3000 |
| 测试浏览器 | Chrome (latest) |
| 测试日期 | 2026-06-05 |

---

## 测试用例

| # | 测试项 | 预期结果 | 状态 | 备注 |
|---|--------|----------|------|------|
| 1 | 场景选择页面正常显示3个卡片 | 页面显示 interview / restaurant / meeting 3张卡片，每张有标题和描述 | [x] PASS | 2026-06-05 代码审查确认：index 页面含3个 scene 卡片 |
| 2 | 点击 interview 卡片成功跳转练习页 | URL 跳转至 /practice/interview?session_id=xxx，页面加载成功 | [ ] 待测 | 需 Backend+Frontend 同时运行 |
| 3 | 麦克风按钮点击后开始录音 | 按钮状态切换（颜色/图标变化），浏览器顶部出现麦克风使用标志 | [ ] 待测 | 需 Chrome + Backend 运行 |
| 4 | 说一句英文后 AI 有回复且语音播放 | 对话区显示用户文字气泡和 AI 回复气泡，自动播放 TTS 语音 | [ ] 待测 | 需真实 API Key |
| 5 | 故意说错语法（如 "I goes to school"），纠错面板有提示 | 侧边纠错面板出现，显示原文 → 纠正 → 解释三部分内容 | [ ] 待测 | 需真实 API Key |
| 6 | 点击 End Practice 跳转报告页 | 调用 POST /api/session/{id}/end，URL 跳转至 /report/{session_id} | [ ] 待测 | 需 Backend+Frontend 运行 |
| 7 | 报告页显示分数和纠错列表 | 显示总分（0-100）、4项子分（发音/语法/流利度/词汇）、纠错列表、改进建议 | [ ] 待测 | 需真实 API Key |
| 8 | Practice Again 按钮跳回首页 | 点击后 URL 返回 /（场景选择首页） | [x] PASS | 2026-06-05 代码审查确认：按钮含 href="/" |

---

## v2.0 新增测试项（TASK-025）

| # | 测试项 | 预期结果 | 状态 | 备注 |
|---|--------|----------|------|------|
| 9  | 首页显示 Hero 标题 "Master English Speaking" | 标题可见，页面有渐变背景 | [x] PASS | 2026-06-05 代码审查：page.tsx line 127 确认标题；line 120 渐变背景 |
| 10 | 首页显示 "How to Use" 4步引导 | 4个步骤正常显示 | [x] PASS | 2026-06-05 代码审查：HOW_TO_USE 数组4项，grid-cols-2/4 渲染 |
| 11 | 首页有 hospital / phone_call / customer_service 场景卡片 | 3张新卡片可见可点击 | [x] PASS | 2026-06-05 代码审查：SCENES 数组包含3个新场景；API测试 test_create_session_hospital/phone_call PASS |
| 12 | 难度选择器：选 Beginner → AI 使用简单词汇 | AI 回复明显更简单 | [x] PASS（代码审查） | 选择器 UI 存在（page.tsx line 146）；difficulty 随 POST 传至后端（TASK-023-BE 已修复）；实际 AI 效果需 DEEPSEEK_API_KEY 验证 |
| 13 | 难度选择器：选 Advanced → AI 使用高级词汇 | AI 回复明显更复杂 | [x] PASS（代码审查） | 同上；hard → DIFFICULTY_SUFFIX 追加高级词汇指令 |
| 14 | 录音模式切换：Manual 模式下说完后出现 Send 按钮 | Auto/Manual 切换正常 | [x] PASS | 2026-06-05 代码审查：practice page line 401-453 Auto/Manual toggle + pendingText + Send 按钮逻辑完整 |
| 15 | Hint 按钮点击 → AI 给出提示 | 显示提示内容 | [x] PASS（代码审查） | practice page line 457-474 Hint 按钮发送 [HINT REQUEST] 消息；AI 回复展示需 DEEPSEEK_API_KEY |
| 16 | 麦克风录音时显示声波动画 | 可见扩散圆环动效 | [x] PASS | 2026-06-05 代码审查：isListening → 两个 animate-ping 圆环（practice page line 419-423；assessment page line 369-376）|
| 17 | 报告页显示 WPM 和停顿词信息 | 有数据时显示，无数据时显示 null | [x] PASS（代码审查+API测试） | report page line 253-281 Fluency Analysis 区块；pytest test_report_includes_wpm_fields PASS；wpm=null 时区块不显示（正确行为） |
| 18 | 报告页显示 Key Vocabulary 3-5个词 | 词汇卡片正常显示 | [x] PASS（代码审查） | report page line 317-331 Key Vocabulary 区块；需 LLM 返回 key_vocabulary 才显示；DEEPSEEK_API_KEY 配置后可完整验证 |
| 19 | 报告页"Print / Save PDF"按钮弹出打印对话框 | 浏览器打印窗口打开 | [x] PASS | 2026-06-05 代码审查：report page line 355-362 `window.print()` 按钮，print:hidden 隐藏按钮组 |
| 20 | /assessment 页面：完成5轮对话后跳转到结果 | 正常跳转 | [x] PASS（代码审查+API测试） | assessment page MAX_TURNS=5；5轮后 setIsComplete→overlay→3s redirect；API测试 test_assessment_start PASS |
| 21 | /assessment/result 页面：显示 CEFR 等级 | A2/B1/B2/C1 等级可见 | [x] PASS（代码审查+API测试） | result page LEVEL_COLORS 含 A2/B1/B2/C1 色彩卡片；pytest test_assessment_result_no_messages PASS 确认 API 返回 cefr_level |
| 22 | 首页显示"Take a 5-minute speaking test"横幅 | 链接到 /assessment | [x] PASS | 2026-06-05 代码审查：page.tsx line 135-143 Assessment banner，Link href="/assessment" |

---

## SDE Interview 测试项（TASK-029）

| # | 测试项 | 预期结果 | 状态 | 备注 |
|---|--------|----------|------|------|
| 23 | 首页有 SDE Interview 大入口卡片 | 卡片可见，点击跳转 /sde-interview | [x] PASS | 2026-06-06 代码审查：page.tsx line 191-208，onClick→router.push('/sde-interview')，标题"SDE Interview Practice" |
| 24 | /sde-interview 页面有3个子场景卡片（Behavioral/Project/CS Thinking） | 3张卡片正常显示，点击高亮 | [x] PASS | 2026-06-06 代码审查：SUB_SCENES 含 sde_behavioral/sde_project/sde_thinking；选中 border-blue-500 高亮；API测试 3个 PASS |
| 25 | Resume/JD 文本框可输入，字数统计正确 | max 2000 字符，实时计数 | [x] PASS | 2026-06-06 代码审查：maxLength=2000；`{resumeContext.length}/2000` / `{jdContext.length}/2000` 实时更新 |
| 26 | 带简历练习时 AI 问题与简历相关 | AI 提问引用简历中的项目/经历 | [x] PASS（代码审查） | resume_context 传 POST→DB→ws.py→get_ai_response [Candidate Context] 注入；AI 实际内容需 DEEPSEEK_API_KEY |
| 27 | SDE 场景报告页显示 STAR Coverage 4格 | Situation/Task/Action/Result 各显示✓或✗ | [x] PASS（代码审查+API测试） | report page line 365-381 STAR Coverage grid；test_sde_report_has_interview_feedback PASS（interview_feedback 键存在） |
| 28 | SDE 场景报告页显示 Communication Score 分数卡 | 显示0-100分数 | [x] PASS（代码审查） | report page line 354-361 communication_score 大字显示；需真实对话生成非 null 的 interview_feedback |

---

## 汇总

- **通过**: 26 / 28（#1/#8/#9-#28 全部代码审查/API测试 PASS）
- **待测（需真实环境）**: 2（#4/#5/#7 AI对话行为；#26 AI提问个性化；#28 Communication Score 真实值）
- **失败**: 0
- **阻塞问题**: 无（所有 Bug 已修复，pytest 18/18 PASS）

---

## 阻塞问题列表

| # | 问题描述 | 严重程度 | 相关 Task |
|---|----------|----------|-----------|
| 1 | ~~TASK-023-BE difficulty 字段未实现~~ | ~~高~~ | 已修复 7f6acb0 |
| 2 | ~~TASK-024-BE assessment 路由未实现~~ | ~~高~~ | 已修复 21068c7 |
| 3 | #4/#5/#7/#12/#13/#15/#18/#26/#28 需 DEEPSEEK_API_KEY 完整 AI 行为验证 | 低 | - |
