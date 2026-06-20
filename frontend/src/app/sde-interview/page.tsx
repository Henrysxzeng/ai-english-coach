// file: src/app/sde-interview/page.tsx — TASK-028 / TASK-031 / TASK-032
// owner: Frontend Engineer
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import { SDE_QUESTIONS, CATEGORY_LABELS, type QuestionCategory } from './questions'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

const SUB_SCENES = [
  {
    id: 'sde_behavioral',
    icon: '🗣',
    title: 'Behavioral',
    description: 'STAR framework behavioral questions',
  },
  {
    id: 'sde_project',
    icon: '💼',
    title: 'Project Deep-Dive',
    description: 'Discuss your architecture & decisions',
  },
  {
    id: 'sde_thinking',
    icon: '🧠',
    title: 'Thinking & CS',
    description: 'System design & conceptual thinking',
  },
]

export default function SdeInterviewPage() {
  const router = useRouter()
  const { isSignedIn, getToken } = useAuth()
  const [selectedScene, setSelectedScene] = useState('')
  const [resumeContext, setResumeContext] = useState('')
  const [jdContext, setJdContext] = useState('')
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<QuestionCategory | 'all'>('all')
  const [showQuestions, setShowQuestions] = useState(false)
  const [expandedExample, setExpandedExample] = useState<string | null>(null)

  // 简历/JD 跟训练地图共用同一份资料(user_profiles)，登录后自动带出已保存的内容。
  useEffect(() => {
    if (!isSignedIn) return
    ;(async () => {
      const token = await getToken()
      const res = await fetch(`${API_URL}/api/modules/profile?track=sde`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (res.ok) {
        const p = await res.json()
        if (p.resume_text) setResumeContext(p.resume_text)
        if (p.jd_text) setJdContext(p.jd_text)
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSignedIn])

  async function saveJd() {
    if (!isSignedIn) return
    const token = await getToken()
    await fetch(`${API_URL}/api/modules/profile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ resume_text: resumeContext, jd_text: jdContext, track_focus: 'sde' }),
    })
  }

  async function handleStart() {
    if (!selectedScene || isLoading) return
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_URL}/api/session/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scene: selectedScene, difficulty, resume_context: resumeContext, jd_context: jdContext }),
      })
      if (!res.ok) throw new Error(`Server error ${res.status}`)
      const data = await res.json()
      if (!data.session_id) throw new Error('No session_id returned')
      router.push(`/practice/${selectedScene}?session_id=${data.session_id}`)
    } catch {
      setError('Failed to start session. Is the backend running?')
      setIsLoading(false)
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden flex flex-col items-center py-12 px-4">
      {/* 环境光晕 */}
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[#fdf8fb]">
        <div className="absolute -top-40 left-1/4   w-[700px] h-[700px] rounded-full bg-pink-300/20  blur-[160px]" />
        <div className="absolute bottom-0  right-1/4  w-[600px] h-[600px] rounded-full bg-rose-300/15  blur-[140px]" />
        <div className="absolute top-1/3  -right-32   w-[500px] h-[500px] rounded-full bg-purple-300/20 blur-[130px]" />
        <div className="absolute top-1/4  -left-32    w-[450px] h-[450px] rounded-full bg-pink-300/25  blur-[120px]" />
      </div>

      <div className="w-full max-w-2xl space-y-8">
        {/* Title */}
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-rose-500 to-pink-500 bg-clip-text text-transparent mb-2">
            SDE Interview Practice
          </h1>
          <p className="text-gray-400">Ace your software engineering interviews</p>
        </div>

        {/* Sub-scene cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {SUB_SCENES.map((scene) => (
            <button
              key={scene.id}
              onClick={() => setSelectedScene(scene.id)}
              className={`rounded-2xl p-5 text-left transition-all duration-200 ${
                selectedScene === scene.id
                  ? 'border-2 border-rose-300 bg-rose-50/80 shadow-[0_4px_20px_rgba(244,63,94,0.12)]'
                  : 'bg-white/80 backdrop-blur-xl border border-pink-100 shadow-[0_4px_24px_rgba(244,114,182,0.07)] hover:shadow-[0_8px_32px_rgba(244,114,182,0.12)] hover:-translate-y-0.5'
              }`}
            >
              <div className="text-3xl mb-3">{scene.icon}</div>
              <h3 className="text-sm font-semibold text-gray-800 mb-1">{scene.title}</h3>
              <p className="text-xs text-gray-400 leading-relaxed">{scene.description}</p>
            </button>
          ))}
        </div>

        {/* Optional context */}
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium text-gray-700 mb-0.5">Add Context (Optional)</p>
            <p className="text-xs text-gray-400">Helps AI personalize interview questions</p>
          </div>

          {/* Resume — managed centrally on /career, shown here read-only */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">Your Resume</label>
            <div className="bg-white border border-pink-100 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
              <p className="text-sm text-gray-500 truncate">
                {resumeContext ? resumeContext.slice(0, 80) + (resumeContext.length > 80 ? '…' : '') : '还没有保存的简历'}
              </p>
              <Link href="/career?track=sde" className="text-xs text-rose-400 hover:text-rose-500 whitespace-nowrap">
                管理简历 →
              </Link>
            </div>
          </div>

          {/* JD textarea */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">
              Job Description
            </label>
            <div className="relative">
              <textarea
                value={jdContext}
                onChange={(e) => setJdContext(e.target.value)}
                onBlur={() => saveJd()}
                maxLength={2000}
                rows={4}
                placeholder="Paste job description (optional) — AI will tailor questions to the role..."
                className="w-full bg-white border border-pink-100 focus:border-rose-300 focus:ring-2 focus:ring-rose-100 rounded-xl px-4 py-3 text-sm text-gray-700 placeholder-gray-300 resize-none transition-all outline-none"
              />
              <span className="absolute bottom-2 right-3 text-xs text-gray-400">
                {jdContext.length}/2000
              </span>
            </div>
          </div>
        </div>

        {/* Difficulty selector */}
        <div className="flex items-center justify-center gap-2">
          <span className="text-sm text-gray-400 font-medium mr-1">Difficulty:</span>
          {(['easy', 'medium', 'hard'] as const).map((d) => (
            <button
              key={d}
              onClick={() => setDifficulty(d)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                difficulty === d
                  ? 'bg-gradient-to-r from-rose-400 to-pink-500 text-white shadow-[0_2px_10px_rgba(244,63,94,0.25)]'
                  : 'bg-white border border-pink-100 text-gray-500 hover:border-rose-200 hover:text-rose-400'
              }`}
            >
              {d === 'easy' ? '🌸 Beginner' : d === 'medium' ? '🌺 Intermediate' : '🔥 Advanced'}
            </button>
          ))}
        </div>

        {/* Question Bank */}
        <div className="bg-white/80 backdrop-blur-xl border border-pink-100 rounded-2xl shadow-[0_4px_24px_rgba(244,114,182,0.07)] overflow-hidden">
          <button
            onClick={() => setShowQuestions(v => !v)}
            className="w-full flex items-center justify-between px-6 py-4 text-left"
          >
            <div>
              <p className="font-semibold text-gray-800">📋 Question Bank</p>
              <p className="text-xs text-gray-400 mt-0.5">28 common SDE behavioral questions to prepare with</p>
            </div>
            <span className={`text-rose-400 transition-transform duration-200 ${showQuestions ? 'rotate-180' : ''}`}>▾</span>
          </button>

          {showQuestions && (
            <div className="border-t border-pink-100 px-6 pb-6">
              <div className="flex flex-wrap gap-2 mt-4 mb-4">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                    selectedCategory === 'all'
                      ? 'bg-gradient-to-r from-rose-400 to-pink-500 text-white'
                      : 'bg-white border border-pink-100 text-gray-500 hover:border-rose-200'
                  }`}
                >All</button>
                {(Object.keys(CATEGORY_LABELS) as QuestionCategory[]).map(cat => (
                  <button key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                      selectedCategory === cat
                        ? 'bg-gradient-to-r from-rose-400 to-pink-500 text-white'
                        : 'bg-white border border-pink-100 text-gray-500 hover:border-rose-200'
                    }`}
                  >{CATEGORY_LABELS[cat]}</button>
                ))}
              </div>

              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {SDE_QUESTIONS
                  .filter(q => selectedCategory === 'all' || q.category === selectedCategory)
                  .map(q => (
                    <div key={q.id} className="bg-rose-50/60 border border-rose-100 rounded-xl p-3">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm text-gray-700 leading-snug">{q.question}</p>
                        <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${
                          q.difficulty === 'easy'   ? 'bg-green-50 text-green-600 border border-green-100' :
                          q.difficulty === 'medium' ? 'bg-yellow-50 text-yellow-600 border border-yellow-100' :
                                                     'bg-rose-50 text-rose-600 border border-rose-100'
                        }`}>{q.difficulty}</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1.5 italic">💡 {q.hint}</p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setExpandedExample(expandedExample === q.id ? null : q.id)
                        }}
                        className="text-xs text-rose-400 hover:text-rose-500 mt-1.5 transition-colors"
                      >
                        {expandedExample === q.id ? '▲ Hide example' : '▾ Show example answer'}
                      </button>
                      {expandedExample === q.id && (
                        <div className="mt-2 p-3 bg-white/40 border border-white/60 rounded-xl text-xs text-gray-600 leading-relaxed">
                          {q.starExample}
                        </div>
                      )}
                    </div>
                  ))
                }
              </div>
            </div>
          )}
        </div>

        {/* Error banner */}
        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-500 rounded-xl p-3 text-sm">{error}</div>
        )}

        {/* Start button */}
        <button
          onClick={handleStart}
          disabled={!selectedScene || isLoading}
          className={`w-full py-3.5 rounded-xl font-semibold text-base transition-all duration-200 ${
            !selectedScene || isLoading
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
              : 'bg-gradient-to-r from-rose-400 to-pink-500 text-white shadow-[0_4px_16px_rgba(244,63,94,0.28)] hover:shadow-[0_6px_24px_rgba(244,63,94,0.38)] hover:scale-[1.02]'
          }`}
        >
          {isLoading ? 'Starting...' : !selectedScene ? 'Select an interview type above' : 'Start Practice →'}
        </button>

        {/* Back link */}
        <div className="text-center">
          <Link href="/" className="text-rose-400 hover:text-rose-500 text-sm transition-colors">
            ← Back to Home
          </Link>
        </div>
      </div>
    </main>
  )
}
