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
| 测试日期 | 待填写 |

---

## 测试用例

| # | 测试项 | 预期结果 | 状态 | 备注 |
|---|--------|----------|------|------|
| 1 | 场景选择页面正常显示3个卡片 | 页面显示 interview / restaurant / meeting 3张卡片，每张有标题和描述 | [ ] PASS [ ] FAIL | |
| 2 | 点击 interview 卡片成功跳转练习页 | URL 跳转至 /practice/interview?session_id=xxx，页面加载成功 | [ ] PASS [ ] FAIL | |
| 3 | 麦克风按钮点击后开始录音 | 按钮状态切换（颜色/图标变化），浏览器顶部出现麦克风使用标志 | [ ] PASS [ ] FAIL | |
| 4 | 说一句英文后 AI 有回复且语音播放 | 对话区显示用户文字气泡和 AI 回复气泡，自动播放 TTS 语音 | [ ] PASS [ ] FAIL | |
| 5 | 故意说错语法（如 "I goes to school"），纠错面板有提示 | 侧边纠错面板出现，显示原文 → 纠正 → 解释三部分内容 | [ ] PASS [ ] FAIL | |
| 6 | 点击 End Practice 跳转报告页 | 调用 POST /api/session/{id}/end，URL 跳转至 /report/{session_id} | [ ] PASS [ ] FAIL | |
| 7 | 报告页显示分数和纠错列表 | 显示总分（0-100）、4项子分（发音/语法/流利度/词汇）、纠错列表、改进建议 | [ ] PASS [ ] FAIL | |
| 8 | Practice Again 按钮跳回首页 | 点击后 URL 返回 /（场景选择首页） | [ ] PASS [ ] FAIL | |

---

## 汇总

- **通过**: ___ / 8
- **失败**: ___
- **阻塞问题**: 无 / （如有，描述如下）

---

## 阻塞问题列表

_（如无请填写"无"）_

| # | 问题描述 | 严重程度 | 相关 Task |
|---|----------|----------|-----------|
| | | | |
