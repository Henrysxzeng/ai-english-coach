// file: src/app/page.tsx — TASK-012/018/021/023/028/032
// owner: Frontend Engineer
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

const SCENES = [
  {
    id: 'interview',
    icon: '💼',
    title: 'Job Interview',
    subtitle: '面试练习',
    description: 'Practice with a professional HR interviewer at a top tech company.',
  },
  {
    id: 'restaurant',
    icon: '🍽️',
    title: 'Restaurant Ordering',
    subtitle: '餐厅点餐',
    description: 'Order food and chat naturally with a friendly English waiter.',
  },
  {
    id: 'meeting',
    icon: '📊',
    title: 'Business Meeting',
    subtitle: '商务会议',
    description: 'Discuss project updates and share ideas in a team meeting.',
  },
  {
    id: 'hospital',
    icon: '🏥',
    title: 'Hospital Visit',
    subtitle: '医院就诊',
    description: 'Talk to a doctor about your symptoms and treatment options.',
  },
  {
    id: 'phone_call',
    icon: '📞',
    title: 'Phone Call',
    subtitle: '电话沟通',
    description: 'Handle a business or personal call with confidence.',
  },
  {
    id: 'customer_service',
    icon: '🎧',
    title: 'Customer Service',
    subtitle: '客户服务',
    description: 'Resolve complaints or answer questions professionally.',
  },
]

const HOW_TO_USE = [
  { step: 1, icon: '🎭', title: 'Choose a Scene',       description: 'Pick a real-life practice scenario' },
  { step: 2, icon: '🎤', title: 'Start Speaking',       description: 'Click the mic and speak in English' },
  { step: 3, icon: '🤖', title: 'Get Instant Feedback', description: 'AI replies and corrects grammar in real-time' },
  { step: 4, icon: '📊', title: 'Review Your Report',   description: 'See your score and improvement tips after practice' },
]

export default function HomePage() {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium')

  async function handleSceneClick(sceneId: string) {
    if (loading) return
    setLoading(sceneId)
    setError(null)
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)
    try {
      const res = await fetch(`${API_URL}/api/session/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scene: sceneId, difficulty }),
        signal: controller.signal,
      })
      clearTimeout(timeoutId)
      if (!res.ok) throw new Error(`Server error ${res.status}`)
      const data = await res.json()
      const sessionId = data.session_id
      if (!sessionId) throw new Error('No session ID in response')
      router.push(`/practice/${sceneId}?session_id=${sessionId}`)
    } catch (err) {
      clearTimeout(timeoutId)
      if (err instanceof Error && err.name === 'AbortError') {
        setError('Connection timed out — is the backend running?')
      } else {
        setError(err instanceof Error ? err.message : 'Failed to connect')
      }
      setLoading(null)
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-rose-50 via-white to-pink-50">
      {/* 环境光晕 */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-rose-200/40 blur-[100px]" />
        <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-pink-200/30 blur-[120px]" />
      </div>

      <div className="max-w-5xl mx-auto px-6 py-16">
        {/* ── Hero ─────────────────────────────────────── */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-xl border border-pink-100 rounded-full px-4 py-1.5 mb-6 shadow-[0_2px_12px_rgba(244,114,182,0.1)]">
            <span className="w-2 h-2 bg-rose-400 rounded-full animate-pulse" />
            <span className="text-rose-500 text-sm font-medium">AI-Powered Speaking Coach</span>
          </div>
          <h1 className="text-5xl font-bold tracking-tight bg-gradient-to-r from-rose-500 to-pink-500 bg-clip-text text-transparent mb-4">
            Master English Speaking
          </h1>
          <p className="text-lg text-gray-400 max-w-md mx-auto">
            Practice real conversations with AI. Get instant grammar feedback.
          </p>
        </div>

        {/* ── Assessment 横幅 ──────────────────────────── */}
        <div className="flex justify-center mb-10">
          <Link
            href="/assessment"
            className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-xl border border-pink-100 rounded-full px-5 py-2 text-sm text-rose-500 font-medium shadow-[0_2px_12px_rgba(244,114,182,0.1)] hover:shadow-[0_4px_20px_rgba(244,114,182,0.18)] hover:-translate-y-0.5 transition-all duration-200"
          >
            📊 Not sure your level? Take a 5-minute speaking test →
          </Link>
        </div>

        {/* ── Difficulty selector ──────────────────────── */}
        <div className="flex items-center justify-center gap-2 mb-8">
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

        {error && (
          <div className="mb-6 px-4 py-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-500 text-sm max-w-md mx-auto">
            ⚠️ {error} — make sure the backend server is running at {API_URL}
          </div>
        )}

        {/* ── Scene cards ──────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          {SCENES.map((scene) => (
            <div
              key={scene.id}
              onClick={() => handleSceneClick(scene.id)}
              className={`relative bg-white/80 backdrop-blur-xl border border-pink-100 rounded-2xl p-6 cursor-pointer shadow-[0_4px_24px_rgba(244,114,182,0.07)] hover:shadow-[0_8px_32px_rgba(244,114,182,0.14)] hover:-translate-y-1 transition-all duration-300 ${
                loading === scene.id ? 'opacity-60 pointer-events-none' : ''
              }`}
            >
              <div className="text-3xl mb-3">{scene.icon}</div>
              <h3 className="font-semibold text-gray-800 mb-0.5">{scene.title}</h3>
              <p className="text-xs text-gray-400">{scene.subtitle}</p>
              <p className="text-xs text-gray-500 mt-2 leading-relaxed">{scene.description}</p>
              {loading === scene.id && (
                <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-white/70 backdrop-blur-sm">
                  <div className="w-5 h-5 border-2 border-rose-200 border-t-rose-500 rounded-full animate-spin" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* ── SDE Interview Entry ──────────────────────── */}
        <div
          onClick={() => router.push('/sde-interview')}
          className="mt-2 cursor-pointer bg-gradient-to-r from-rose-50 to-pink-50 border border-rose-200 rounded-2xl p-6 shadow-[0_4px_24px_rgba(244,114,182,0.1)] hover:shadow-[0_8px_32px_rgba(244,114,182,0.18)] hover:-translate-y-0.5 transition-all duration-300 mb-12"
        >
          <div className="flex items-center gap-4">
            <span className="text-4xl">🧑‍💻</span>
            <div className="flex-1">
              <h3 className="font-bold text-gray-800 text-lg">SDE Interview Practice</h3>
              <p className="text-sm text-gray-400 mt-0.5">Behavioral · Project Deep-Dive · CS Thinking</p>
              <p className="text-xs text-rose-400 mt-1">Add your resume &amp; JD for personalized questions</p>
            </div>
            <span className="text-rose-400 text-xl">→</span>
          </div>
        </div>

        {/* ── How to Use ───────────────────────────────── */}
        <div className="mb-10">
          <h2 className="text-xl font-bold text-gray-800 text-center mb-6">How to Use</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {HOW_TO_USE.map(({ step, icon, title, description }) => (
              <div key={step} className="bg-white/60 backdrop-blur-xl border border-pink-100 rounded-2xl p-5 text-center">
                <div className="w-10 h-10 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-xl mx-auto mb-3">
                  {icon}
                </div>
                <p className="text-xs font-semibold text-gray-700 mb-1">{title}</p>
                <p className="text-xs text-gray-400 leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Footer ───────────────────────────────────── */}
        <div className="text-center mt-8 space-y-2">
          <Link href="/history" className="text-sm text-rose-400 hover:text-rose-500 transition-colors">
            View Progress History →
          </Link>
          <p className="text-gray-400 text-xs">Powered by Claude AI · OpenAI Whisper · Web Speech API</p>
        </div>
      </div>
    </main>
  )
}
