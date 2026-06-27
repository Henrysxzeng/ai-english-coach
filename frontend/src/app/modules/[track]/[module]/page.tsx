// file: src/app/modules/[track]/[module]/page.tsx
// 单个模块的阶段页：learn(背稿/背语料) -> apply(自选题目脱稿) -> master(AI出题/简历驱动脱稿)
'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { SignInButton, useAuth } from '@clerk/nextjs'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

type StageStatus = 'locked' | 'in_progress' | 'completed'
interface StageInfo { stage: string; status: StageStatus; completed_at: string | null }
type SelfIntroDual = { tech: string; hr: string }

type ChunkScore = { accuracy: number; words: Array<{ word: string; accuracy: number }> }

function ScriptWithChunks({
  text,
  onEdit,
  apiUrl,
  getToken,
}: {
  text: string
  onEdit?: () => void
  apiUrl: string
  getToken: () => Promise<string | null>
}) {
  const [playing, setPlaying] = useState<number | null>(null)
  const [recState, setRecState] = useState<Record<number, 'idle' | 'recording' | 'loading'>>({})
  const [scores, setScores] = useState<Record<number, ChunkScore>>({})
  const recorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const activeIdxRef = useRef<number>(-1)

  const rawChunks = text.split(/\n\n+/).filter((p) => p.trim())
  const chunks = rawChunks.length > 1 ? rawChunks : text.split(/\n/).filter((s) => s.trim())

  function speak(t: string, idx: number) {
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(t)
    u.lang = 'en-US'
    u.rate = 0.9
    u.onend = () => setPlaying(null)
    setPlaying(idx)
    window.speechSynthesis.speak(u)
  }

  function speakWord(word: string) {
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(word)
    u.lang = 'en-US'
    window.speechSynthesis.speak(u)
  }

  async function startRecord(idx: number) {
    if (recorderRef.current && recState[activeIdxRef.current] === 'recording') {
      recorderRef.current.stop()
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : 'audio/webm'
      const recorder = new MediaRecorder(stream, { mimeType })
      audioChunksRef.current = []
      activeIdxRef.current = idx
      recorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data) }
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop())
        setRecState((s) => ({ ...s, [idx]: 'loading' }))
        const blob = new Blob(audioChunksRef.current, { type: mimeType })
        const form = new FormData()
        form.append('audio', blob, 'recording.webm')
        form.append('reference_text', chunks[idx])
        try {
          const token = await getToken()
          const headers: Record<string, string> = {}
          if (token) headers['Authorization'] = `Bearer ${token}`
          const res = await fetch(`${apiUrl}/api/shadowing-assess`, { method: 'POST', headers, body: form })
          if (res.ok) {
            const data = await res.json()
            setScores((s) => ({
              ...s,
              [idx]: { accuracy: data?.overall?.accuracy ?? 0, words: data?.words ?? [] },
            }))
          }
        } catch (_) { /* non-critical */ }
        setRecState((s) => ({ ...s, [idx]: 'idle' }))
      }
      recorderRef.current = recorder
      recorder.start()
      setRecState((s) => ({ ...s, [idx]: 'recording' }))
    } catch (_) {
      alert('请允许麦克风权限后再使用跟读功能')
    }
  }

  function stopRecord(idx: number) {
    if (recorderRef.current && recState[idx] === 'recording') recorderRef.current.stop()
  }

  return (
    <div className="space-y-2.5">
      {chunks.map((chunk, i) => {
        const state = recState[i] ?? 'idle'
        const score = scores[i]
        return (
          <div key={i} className="bg-rose-50/40 border border-rose-100 rounded-xl p-4 space-y-2">
            <div className="flex items-start gap-3">
              <span className="shrink-0 w-5 h-5 rounded-full bg-rose-100 text-rose-500 text-xs flex items-center justify-center font-bold mt-0.5">
                {i + 1}
              </span>
              <p className="text-sm text-gray-700 leading-relaxed flex-1">
                {chunk.split(/(\s+)/).map((part, j) => {
                  const word = part.replace(/[^a-zA-Z''-]/g, '')
                  if (!word) return <span key={j}>{part}</span>
                  return (
                    <span
                      key={j}
                      onClick={() => speakWord(word)}
                      className="cursor-pointer hover:text-rose-500 hover:bg-rose-100 rounded px-0.5 transition-colors"
                      title={`点击听 "${word}" 的发音`}
                    >
                      {part}
                    </span>
                  )
                })}
              </p>
            </div>

            {/* 跟读评分结果 */}
            {score && (
              <div className="ml-8 p-2.5 bg-white rounded-lg border border-pink-100 space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-bold ${score.accuracy >= 80 ? 'text-green-500' : score.accuracy >= 60 ? 'text-amber-500' : 'text-rose-500'}`}>
                    {Math.round(score.accuracy)} 分
                  </span>
                  <span className="text-xs text-gray-400">发音准确度</span>
                </div>
                {score.words.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {score.words.map((w, j) => (
                      <span
                        key={j}
                        className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                          w.accuracy >= 80
                            ? 'text-gray-500 bg-gray-50'
                            : w.accuracy >= 60
                            ? 'text-amber-600 bg-amber-50'
                            : 'text-rose-600 bg-rose-50'
                        }`}
                        title={`${w.word}: ${Math.round(w.accuracy)}分`}
                      >
                        {w.word}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end gap-2 mt-0.5">
              <button
                onClick={() => playing === i ? (window.speechSynthesis.cancel(), setPlaying(null)) : speak(chunk, i)}
                className="text-xs text-rose-400 hover:text-rose-500 flex items-center gap-1 px-2 py-1 rounded hover:bg-rose-50"
              >
                {playing === i ? '⏹ 停止' : '▶ 播放整段'}
              </button>
              <button
                onClick={() => state === 'recording' ? stopRecord(i) : startRecord(i)}
                disabled={state === 'loading'}
                className={`text-xs flex items-center gap-1 px-2 py-1 rounded transition-colors disabled:opacity-50 ${
                  state === 'recording'
                    ? 'text-white bg-rose-400 hover:bg-rose-500 animate-pulse'
                    : 'text-rose-400 hover:text-rose-500 hover:bg-rose-50'
                }`}
              >
                {state === 'recording' ? '⏹ 停止录音' : state === 'loading' ? '评分中…' : '🎙 跟读评分'}
              </button>
            </div>
          </div>
        )
      })}
      <p className="text-xs text-gray-400 text-center pt-1">点击单词听发音 · 播放整段 · 跟读后看逐词准确度</p>
    </div>
  )
}

const MODULE_STAGES: Record<string, string[]> = {
  self_intro: ['learn'],
  resume_deep_dive: ['learn', 'master'],
  behavioral: ['learn', 'master'],
  technical_explain: ['learn', 'apply', 'master'],
  system_design: ['learn', 'apply', 'master'],
  debug: ['learn', 'apply', 'master'],
}
const PROBLEM_BACKED = new Set(['technical_explain', 'system_design', 'debug'])
const NEEDS_PROFILE = new Set(['self_intro', 'resume_deep_dive'])

const MODULE_META: Record<string, { icon: string; title: Record<string, string> }> = {
  self_intro: { icon: '🙋', title: { sde: '自我介绍', ds: '自我介绍', pm: '自我介绍', proj: '自我介绍' } },
  resume_deep_dive: { icon: '📄', title: { sde: '简历深挖', ds: '简历深挖', pm: '产品复盘', proj: '项目经历深挖' } },
  behavioral: { icon: '🗣️', title: { sde: '行为面试 (STAR)', ds: '行为面试 (STAR)', pm: '行为面试 (STAR)', proj: '行为面试 (STAR)' } },
  technical_explain: { icon: '🧩', title: { sde: '算法讲解', ds: 'SQL讲解', pm: 'Product Sense', proj: '客户沟通' } },
  system_design: { icon: '🏗️', title: { sde: '系统设计', ds: '实验设计', pm: '指标与执行', proj: '情景危机' } },
  debug: { icon: '🐛', title: { sde: 'Debug', ds: 'Debug', pm: '估算与排序', proj: '规划与敏捷' } },
}

export default function ModuleStagePage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { getToken, isSignedIn, isLoaded } = useAuth()
  const track = params.track as string
  const moduleName = params.module as string
  const stages = MODULE_STAGES[moduleName] ?? []
  const meta = MODULE_META[moduleName]

  const [stageInfos, setStageInfos] = useState<StageInfo[] | null>(null)
  const [selectedStage, setSelectedStage] = useState<string>('')
  const [profile, setProfile] = useState({ resume_text: '', jd_text: '' })
  const [scriptContent, setScriptContent] = useState<string | Array<{ question: string; suggested_answer: string }> | SelfIntroDual | null>(null)
  const versionParam = searchParams.get('version')
  const [activeIntroVersion, setActiveIntroVersion] = useState<'tech' | 'hr'>(versionParam === 'hr' ? 'hr' : 'tech')
  const [contentType, setContentType] = useState<string>('')
  const [scriptLoading, setScriptLoading] = useState(false)
  const [advancing, setAdvancing] = useState(false)
  const [problemTitle, setProblemTitle] = useState('')
  const [problemDesc, setProblemDesc] = useState('')
  const [problemSaving, setProblemSaving] = useState(false)
  const [hasProblem, setHasProblem] = useState(false)
  const [startingPractice, setStartingPractice] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [editContent, setEditContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [startingRecall, setStartingRecall] = useState(false)
  const [error, setError] = useState('')

  async function authHeaders(): Promise<Record<string, string>> {
    const token = await getToken()
    return token ? { Authorization: `Bearer ${token}` } : {}
  }

  async function loadProgress() {
    const headers = await authHeaders()
    const res = await fetch(`${API_URL}/api/modules?track=${track}`, { headers })
    if (!res.ok) return
    const data = await res.json()
    const mod = data.modules.find((m: { module: string; stages: StageInfo[] }) => m.module === moduleName)
    if (!mod) return
    setStageInfos(mod.stages)
    if (!selectedStage) {
      const firstActive = mod.stages.find((s: StageInfo) => s.status !== 'completed') ?? mod.stages[mod.stages.length - 1]
      setSelectedStage(firstActive.stage)
    }
  }

  useEffect(() => {
    if (!isSignedIn) return
    loadProgress()
    if (NEEDS_PROFILE.has(moduleName)) {
      authHeaders().then((headers) =>
        fetch(`${API_URL}/api/modules/profile?track=${track}`, { headers }).then((r) => r.ok && r.json()).then((d) => d && setProfile(d))
      )
    }
    if (PROBLEM_BACKED.has(moduleName)) {
      authHeaders().then((headers) =>
        fetch(`${API_URL}/api/modules/problem/latest?track=${track}&module=${moduleName}`, { headers })
          .then((r) => r.ok && r.json())
          .then((d) => setHasProblem(!!d))
      )
    }
    // 自动加载已缓存的稿子（不触发 LLM 生成）
    authHeaders().then(async (headers) => {
      const res = await fetch(`${API_URL}/api/modules/script?track=${track}&module=${moduleName}`, { headers })
      if (res.ok) {
        const data = await res.json()
        if (data && data.content) {
          setContentType(data.content_type)
          setScriptContent(data.content)
        }
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [track, moduleName, isSignedIn])

  useEffect(() => {
    setScriptContent(null)
    setContentType('')
    setEditMode(false)
  }, [selectedStage])

  const stageInfo = stageInfos?.find((s) => s.stage === selectedStage)
  const isLocked = stageInfo?.status === 'locked'

  async function submitProblem() {
    if (!problemTitle.trim()) return
    setProblemSaving(true)
    setError('')
    try {
      const headers = await authHeaders()
      const res = await fetch(`${API_URL}/api/modules/problem`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ track, module: moduleName, title: problemTitle, description: problemDesc }),
      })
      if (res.ok) setHasProblem(true)
    } finally {
      setProblemSaving(false)
    }
  }

  async function generateScript(regenerate = false) {
    setScriptLoading(true)
    setError('')
    try {
      const headers = await authHeaders()
      const res = await fetch(`${API_URL}/api/modules/script`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ track, module: moduleName, regenerate }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.detail ?? '生成失败，请重试')
        return
      }
      const data = await res.json()
      setContentType(data.content_type)
      setScriptContent(data.content)
    } finally {
      setScriptLoading(false)
    }
  }

  async function markComplete() {
    setAdvancing(true)
    try {
      const headers = await authHeaders()
      const res = await fetch(`${API_URL}/api/modules/advance`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ track, module: moduleName, stage: selectedStage }),
      })
      if (res.ok) {
        await loadProgress()
        const idx = stages.indexOf(selectedStage)
        if (idx + 1 < stages.length) setSelectedStage(stages[idx + 1])
      }
    } finally {
      setAdvancing(false)
    }
  }

  async function startPractice() {
    setStartingPractice(true)
    setError('')
    try {
      const headers = await authHeaders()
      const sceneRes = await fetch(`${API_URL}/api/modules/scene?track=${track}&module=${moduleName}&stage=${selectedStage}`)
      if (!sceneRes.ok) { setError('找不到对应的练习场景'); return }
      const { scene } = await sceneRes.json()

      // Resume/JD context follows the candidate through every module in the career
      // track — not just self_intro/resume_deep_dive — so the AI can ground technical
      // follow-ups in their real background too.
      let resumeContext = '', jdContext = '', problemContext = ''
      const pRes = await fetch(`${API_URL}/api/modules/profile?track=${track}`, { headers })
      if (pRes.ok) {
        const p = await pRes.json()
        resumeContext = p.resume_text ?? ''
        jdContext = p.jd_text ?? ''
      }
      // Only "apply" reuses the candidate's self-selected problem. "master" leaves
      // problem_context empty so the AI invents a fresh problem itself (see SCENE_PROMPTS).
      if (PROBLEM_BACKED.has(moduleName) && selectedStage === 'apply') {
        const probRes = await fetch(`${API_URL}/api/modules/problem/latest?track=${track}&module=${moduleName}`, { headers })
        if (probRes.ok) {
          const prob = await probRes.json()
          if (prob) problemContext = `${prob.title}\n${prob.description ?? ''}`.trim()
        }
      }

      const res = await fetch(`${API_URL}/api/session/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scene, resume_context: resumeContext, jd_context: jdContext, problem_context: problemContext }),
      })
      if (!res.ok) { setError('创建练习会话失败'); return }
      const data = await res.json()
      router.push(`/practice/${scene}?session_id=${data.session_id}&track=${track}&module=${moduleName}&stage=${selectedStage}`)
    } finally {
      setStartingPractice(false)
    }
  }

  async function saveScript() {
    if (!editContent.trim()) return
    setSaving(true)
    setError('')
    try {
      const headers = await authHeaders()
      const body: Record<string, string> = { track, module: moduleName, content: editContent }
      if (contentType === 'self_intro_dual') body.version = activeIntroVersion
      const res = await fetch(`${API_URL}/api/modules/script`, {
        method: 'PUT',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        if (contentType === 'self_intro_dual') {
          setScriptContent({ ...(scriptContent as SelfIntroDual), [activeIntroVersion]: editContent })
        } else {
          setScriptContent(editContent)
        }
        setEditMode(false)
      } else {
        setError('保存失败，请重试')
      }
    } finally {
      setSaving(false)
    }
  }

  async function startRecall() {
    const script = contentType === 'self_intro_dual'
      ? (scriptContent as SelfIntroDual)[activeIntroVersion]
      : scriptContent as string
    if (!script) return
    setStartingRecall(true)
    setError('')
    try {
      const headers = await authHeaders()
      let resumeContext = '', jdContext = ''
      const pRes = await fetch(`${API_URL}/api/modules/profile?track=${track}`, { headers })
      if (pRes.ok) {
        const p = await pRes.json()
        resumeContext = p.resume_text ?? ''
        jdContext = p.jd_text ?? ''
      }
      const versionLabel = contentType === 'self_intro_dual'
        ? (activeIntroVersion === 'tech' ? ' (1-minute technical version)' : ' (3-5 minute HR version)')
        : ''
      const res = await fetch(`${API_URL}/api/session/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scene: 'self_intro_recall', resume_context: resumeContext, jd_context: jdContext, problem_context: `[Saved Script${versionLabel}]\n${script}` }),
      })
      if (!res.ok) { setError('创建练习会话失败'); return }
      const data = await res.json()
      router.push(`/practice/self_intro_recall?session_id=${data.session_id}&track=${track}&module=${moduleName}&stage=learn`)
    } finally {
      setStartingRecall(false)
    }
  }

  if (!meta) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-rose-500">未知模块</p>
      </main>
    )
  }

  if (isLoaded && !isSignedIn) {
    return (
      <main className="relative min-h-screen overflow-hidden flex items-center justify-center px-4">
        <div className="pointer-events-none fixed inset-0 -z-10 bg-[#fdf8fb]">
          <div className="absolute -top-40 left-1/4 w-[700px] h-[700px] rounded-full bg-pink-300/20 blur-[160px]" />
        </div>
        <div className="bg-white/80 backdrop-blur-xl border border-pink-100 rounded-2xl p-10 text-center max-w-sm shadow-[0_4px_24px_rgba(244,114,182,0.08)]">
          <p className="text-3xl mb-3">🗺️</p>
          <h1 className="text-lg font-bold text-gray-800 mb-2">训练进度需要登录</h1>
          <SignInButton mode="modal">
            <button className="px-8 py-3 bg-gradient-to-r from-rose-400 to-pink-500 text-white font-semibold rounded-xl shadow-[0_4px_16px_rgba(244,63,94,0.28)]">
              登录
            </button>
          </SignInButton>
        </div>
      </main>
    )
  }

  const needsProblemFirst = PROBLEM_BACKED.has(moduleName) && (selectedStage === 'learn' || selectedStage === 'apply') && !hasProblem

  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-12">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[#fdf8fb]">
        <div className="absolute -top-40 left-1/4 w-[700px] h-[700px] rounded-full bg-pink-300/20 blur-[160px]" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] rounded-full bg-rose-300/15 blur-[140px]" />
      </div>

      <div className="max-w-2xl mx-auto space-y-5">
        <Link href="/modules" className="text-sm text-rose-400 hover:text-rose-500">← 模块地图</Link>

        <div className="bg-white/80 backdrop-blur-xl border border-pink-100 rounded-2xl p-6 shadow-[0_4px_24px_rgba(244,114,182,0.08)]">
          <div className="flex items-center gap-3 mb-1">
            <span className="text-3xl">{meta.icon}</span>
            <h1 className="text-xl font-bold text-gray-800">{meta.title[track] ?? meta.title.sde}</h1>
            <span className="text-xs bg-rose-50 border border-rose-100 text-rose-500 px-2 py-0.5 rounded-full">{track.toUpperCase()}</span>
          </div>
        </div>

        {/* Stage tabs */}
        <div className="flex gap-2">
          {stages.map((stage) => {
            const info = stageInfos?.find((s) => s.stage === stage)
            const locked = info?.status === 'locked'
            return (
              <button
                key={stage}
                disabled={locked}
                onClick={() => setSelectedStage(stage)}
                className={`flex-1 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  selectedStage === stage
                    ? 'bg-gradient-to-r from-rose-400 to-pink-500 text-white shadow-[0_2px_10px_rgba(244,63,94,0.25)]'
                    : locked
                    ? 'bg-white/40 border border-white/50 text-gray-300 cursor-not-allowed'
                    : 'bg-white border border-pink-100 text-gray-500 hover:border-rose-200'
                }`}
              >
                {info?.status === 'completed' ? '✓ ' : locked ? '🔒 ' : ''}
                {stage === 'learn' ? 'Learn 背稿' : stage === 'apply' ? 'Apply 自选脱稿' : 'Master AI出题'}
              </button>
            )
          })}
        </div>

        {error && <p className="text-sm text-rose-500 text-center">{error}</p>}

        {isLocked ? (
          <div className="bg-white/60 border border-white/50 rounded-2xl p-8 text-center text-gray-400 text-sm">
            🔒 这个阶段还没解锁，先完成前面的阶段
          </div>
        ) : (
          <>
            {/* resume display: only for resume_deep_dive, not self_intro (script generation uses it silently) */}
            {selectedStage === 'learn' && NEEDS_PROFILE.has(moduleName) && moduleName !== 'self_intro' && (
              <div className="bg-white/80 backdrop-blur-xl border border-pink-100 rounded-2xl p-6 shadow-[0_4px_24px_rgba(244,114,182,0.07)] space-y-2">
                <p className="text-sm font-medium text-gray-700">你的简历（AI 会根据这个生成稿子）</p>
                <div className="bg-white border border-pink-100 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
                  <p className="text-sm text-gray-500 truncate">
                    {profile.resume_text ? profile.resume_text.slice(0, 80) + (profile.resume_text.length > 80 ? '…' : '') : '还没有保存的简历'}
                  </p>
                  <Link href={`/career?track=${track}`} className="text-xs text-rose-400 hover:text-rose-500 whitespace-nowrap">
                    管理简历 →
                  </Link>
                </div>
              </div>
            )}

            {/* learn/apply stage: problem submission for technical modules */}
            {PROBLEM_BACKED.has(moduleName) && (selectedStage === 'learn' || selectedStage === 'apply') && (
              <div className="bg-white/80 backdrop-blur-xl border border-pink-100 rounded-2xl p-6 shadow-[0_4px_24px_rgba(244,114,182,0.07)] space-y-3">
                <p className="text-sm font-medium text-gray-700">
                  {selectedStage === 'learn' ? '提交一道你已经会的题目，AI 会给你讲解稿' : '换一道你已经会的题目（脱稿练习，不给稿）'}
                </p>
                <input
                  value={problemTitle}
                  onChange={(e) => setProblemTitle(e.target.value)}
                  placeholder="题目标题，比如 Two Sum"
                  className="w-full bg-white border border-pink-100 focus:border-rose-300 focus:ring-2 focus:ring-rose-100 rounded-xl px-4 py-2.5 text-sm text-gray-700 placeholder-gray-300 transition-all outline-none"
                />
                <textarea
                  value={problemDesc}
                  onChange={(e) => setProblemDesc(e.target.value)}
                  rows={3}
                  placeholder="题目描述（可选）"
                  className="w-full bg-white border border-pink-100 focus:border-rose-300 focus:ring-2 focus:ring-rose-100 rounded-xl px-4 py-2.5 text-sm text-gray-700 placeholder-gray-300 resize-none transition-all outline-none"
                />
                <button
                  onClick={submitProblem}
                  disabled={problemSaving || !problemTitle.trim()}
                  className="px-5 py-2 bg-white border border-rose-200 text-rose-500 hover:bg-rose-50 rounded-xl text-sm font-medium disabled:opacity-50"
                >
                  {problemSaving ? '保存中…' : hasProblem ? '✓ 已提交，更新题目' : '提交题目'}
                </button>
              </div>
            )}

            {/* learn stage content */}
            {selectedStage === 'learn' && (
              <div className="bg-white/80 backdrop-blur-xl border border-pink-100 rounded-2xl p-6 shadow-[0_4px_24px_rgba(244,114,182,0.07)] space-y-4">
                {editMode ? (
                  <div className="space-y-3">
                    {contentType === 'self_intro_dual' && (
                      <p className="text-xs text-rose-400 font-medium">
                        正在编辑：{activeIntroVersion === 'tech' ? '⚡ 1分钟技术轮版本' : '🗣️ 3-5分钟HR轮版本'}
                      </p>
                    )}
                    <p className="text-xs text-gray-400">自由编辑稿子内容，保存后会替换 AI 生成版本</p>
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      rows={12}
                      className="w-full bg-white border border-pink-100 focus:border-rose-300 focus:ring-2 focus:ring-rose-100 rounded-xl px-4 py-3 text-sm text-gray-700 resize-y transition-all outline-none"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={saveScript}
                        disabled={saving || !editContent.trim()}
                        className="px-5 py-2 bg-gradient-to-r from-rose-400 to-pink-500 text-white rounded-xl text-sm font-medium disabled:opacity-50"
                      >
                        {saving ? '保存中…' : '保存'}
                      </button>
                      <button
                        onClick={() => setEditMode(false)}
                        className="px-5 py-2 bg-white border border-pink-100 text-gray-500 hover:border-rose-200 rounded-xl text-sm font-medium"
                      >
                        取消
                      </button>
                    </div>
                  </div>
                ) : moduleName === 'behavioral' && (track === 'sde' || track === 'ds') ? (
                  <div className="text-center space-y-3">
                    <p className="text-sm text-gray-500">行为面试用现成的题库 + STAR 范例答案来背</p>
                    <Link href="/sde-interview" className="inline-block px-5 py-2 bg-white border border-rose-200 text-rose-500 hover:bg-rose-50 rounded-xl text-sm font-medium">
                      📋 去题库学习 →
                    </Link>
                  </div>
                ) : needsProblemFirst ? (
                  <p className="text-sm text-gray-400 text-center">先提交一道题目，再生成讲解稿</p>
                ) : !scriptContent ? (
                  <div className="text-center">
                    <button
                      onClick={() => generateScript(false)}
                      disabled={scriptLoading}
                      className="px-6 py-2.5 bg-gradient-to-r from-rose-400 to-pink-500 text-white font-semibold rounded-xl shadow-[0_4px_16px_rgba(244,63,94,0.28)] disabled:opacity-60"
                    >
                      {scriptLoading ? '生成中…' : '✨ 生成稿子'}
                    </button>
                  </div>
                ) : contentType === 'self_intro_dual' ? (
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      {(['tech', 'hr'] as const).map((v) => (
                        <button
                          key={v}
                          onClick={() => setActiveIntroVersion(v)}
                          className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                            activeIntroVersion === v
                              ? 'bg-gradient-to-r from-rose-400 to-pink-500 text-white'
                              : 'bg-white border border-pink-100 text-gray-500 hover:border-rose-200'
                          }`}
                        >
                          {v === 'tech' ? '⚡ 1分钟 · 技术轮' : '🗣️ 3-5分钟 · HR轮'}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-gray-400">
                      {activeIntroVersion === 'tech'
                        ? '技术面开场，高度概括基本信息 + 最匹配岗位的技能，1分钟内说完'
                        : 'HR轮，结合岗位JD用story-telling展开2-3段经历，不要照本宣科'}
                    </p>
                    <ScriptWithChunks
                      text={(scriptContent as SelfIntroDual)[activeIntroVersion]}
                      onEdit={() => { setEditContent((scriptContent as SelfIntroDual)[activeIntroVersion]); setEditMode(true) }}
                      apiUrl={API_URL}
                      getToken={getToken}
                    />
                    <div className="flex items-center gap-4 pt-1">
                      <button
                        onClick={() => { setEditContent((scriptContent as SelfIntroDual)[activeIntroVersion]); setEditMode(true) }}
                        className="text-xs text-rose-400 hover:text-rose-500"
                      >
                        ✏️ 编辑稿子
                      </button>
                      <button onClick={() => generateScript(true)} className="text-xs text-rose-400 hover:text-rose-500">🔄 重新生成两份</button>
                    </div>
                    <div className="border-t border-pink-100 pt-3">
                      <button
                        onClick={startRecall}
                        disabled={startingRecall}
                        className="w-full px-5 py-2.5 bg-white border border-rose-200 text-rose-500 hover:bg-rose-50 rounded-xl text-sm font-medium disabled:opacity-50"
                      >
                        {startingRecall ? '准备中…' : '🙈 盲背练习 — 遮住稿子，AI帮你对照评分'}
                      </button>
                    </div>
                  </div>
                ) : contentType === 'corpus' ? (
                  <div className="space-y-3">
                    {(scriptContent as Array<{ question: string; suggested_answer: string }>).map((qa, i) => (
                      <div key={i} className="bg-rose-50/60 border border-rose-100 rounded-xl p-4">
                        <p className="text-sm font-medium text-gray-700 mb-1">Q: {qa.question}</p>
                        <p className="text-sm text-gray-500">A: {qa.suggested_answer}</p>
                      </div>
                    ))}
                    <button onClick={() => generateScript(true)} className="text-xs text-rose-400 hover:text-rose-500">🔄 重新生成</button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {moduleName === 'self_intro' ? (
                      <ScriptWithChunks
                        text={scriptContent as string}
                        onEdit={() => { setEditContent(scriptContent as string); setEditMode(true) }}
                        apiUrl={API_URL}
                        getToken={getToken}
                      />
                    ) : (
                      <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{scriptContent as string}</p>
                    )}
                    <div className="flex items-center gap-4">
                      {moduleName === 'self_intro' && (
                        <button
                          onClick={() => { setEditContent(scriptContent as string); setEditMode(true) }}
                          className="text-xs text-rose-400 hover:text-rose-500"
                        >
                          ✏️ 编辑稿子
                        </button>
                      )}
                      <button onClick={() => generateScript(true)} className="text-xs text-rose-400 hover:text-rose-500">🔄 重新生成</button>
                    </div>
                    {moduleName === 'self_intro' && (
                      <div className="border-t border-pink-100 pt-3">
                        <button
                          onClick={startRecall}
                          disabled={startingRecall}
                          className="w-full px-5 py-2.5 bg-white border border-rose-200 text-rose-500 hover:bg-rose-50 rounded-xl text-sm font-medium disabled:opacity-50"
                        >
                          {startingRecall ? '准备中…' : '🙈 盲背练习 — 遮住稿子，AI帮你对照评分'}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {(scriptContent || moduleName === 'behavioral') && stageInfo?.status !== 'completed' && !editMode && (
                  <div className="text-center pt-2">
                    <button
                      onClick={markComplete}
                      disabled={advancing}
                      className="px-6 py-2.5 bg-white border border-rose-200 text-rose-500 hover:bg-rose-50 rounded-xl text-sm font-medium disabled:opacity-50"
                    >
                      {advancing ? '提交中…' : '✅ 我背熟了，可以脱稿讲了'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* apply / master stage: start live practice */}
            {(selectedStage === 'apply' || selectedStage === 'master') && (
              <div className="bg-white/80 backdrop-blur-xl border border-pink-100 rounded-2xl p-6 shadow-[0_4px_24px_rgba(244,114,182,0.07)] text-center space-y-3">
                <p className="text-sm text-gray-500">
                  {selectedStage === 'apply' ? '不给稿子了，用你刚提交的题目脱稿练习' : 'AI 会主导对话（出新题/根据简历深挖），全真模拟'}
                </p>
                {needsProblemFirst ? (
                  <p className="text-sm text-gray-400">先在上面提交一道题目</p>
                ) : (
                  <button
                    onClick={startPractice}
                    disabled={startingPractice}
                    className="px-8 py-3 bg-gradient-to-r from-rose-400 to-pink-500 text-white font-semibold rounded-xl shadow-[0_4px_16px_rgba(244,63,94,0.28)] disabled:opacity-60"
                  >
                    {startingPractice ? '准备中…' : '🎙️ 开始练习'}
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  )
}
