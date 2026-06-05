// file: src/app/page.tsx — TASK-012/018/021/023
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
  {
    step: 1,
    icon: '🎭',
    title: 'Choose a Scene',
    description: 'Pick a real-life practice scenario',
  },
  {
    step: 2,
    icon: '🎤',
    title: 'Start Speaking',
    description: 'Click the mic and speak in English',
  },
  {
    step: 3,
    icon: '🤖',
    title: 'Get Instant Feedback',
    description: 'AI replies and corrects grammar in real-time',
  },
  {
    step: 4,
    icon: '📊',
    title: 'Review Your Report',
    description: 'See your score and improvement tips after practice',
  },
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
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex flex-col items-center p-8">
      {/* ── Hero ─────────────────────────────────────── */}
      <div className="text-center mt-10 mb-8 max-w-xl">
        <div className="inline-flex items-center gap-2 bg-indigo-100 rounded-full px-4 py-1.5 mb-5">
          <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
          <span className="text-indigo-600 text-sm font-medium">AI-Powered Speaking Coach</span>
        </div>
        <h1 className="text-5xl font-bold text-gray-900 mb-3 tracking-tight">
          Master English Speaking
        </h1>
        <p className="text-lg text-gray-500 max-w-md mx-auto">
          Practice real conversations with AI. Get instant grammar feedback.
        </p>
      </div>

      {/* ── Assessment banner ───────────────────────── */}
      <div className="text-center my-4">
        <Link
          href="/assessment"
          className="inline-flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium bg-indigo-50 hover:bg-indigo-100 px-4 py-2 rounded-xl transition-colors"
        >
          📊 Not sure your level? Take a 5-minute speaking test →
        </Link>
      </div>

      {/* ── Difficulty selector ──────────────────────── */}
      <div className="flex items-center justify-center gap-3 mb-6">
        <p className="text-sm text-gray-500 font-medium">Difficulty:</p>
        {(['easy', 'medium', 'hard'] as const).map((d) => (
          <button
            key={d}
            onClick={() => setDifficulty(d)}
            className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-colors ${
              difficulty === d
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            {d === 'easy' ? '🟢 Beginner' : d === 'medium' ? '🟡 Intermediate' : '🔴 Advanced'}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-6 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm max-w-md w-full">
          ⚠️ {error} — make sure the backend server is running at {API_URL}
        </div>
      )}

      {/* ── Scene cards ──────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl w-full mb-12">
        {SCENES.map((scene) => (
          <button
            key={scene.id}
            onClick={() => handleSceneClick(scene.id)}
            disabled={loading !== null}
            className="relative bg-white rounded-2xl p-7 shadow-md border-2 border-transparent text-left transition-all duration-200 hover:shadow-xl hover:-translate-y-1 hover:border-indigo-300 disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <div className="text-5xl mb-5">{scene.icon}</div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">{scene.title}</h2>
            <p className="text-sm font-semibold text-indigo-500 mb-3">{scene.subtitle}</p>
            <p className="text-sm text-gray-500 leading-relaxed">{scene.description}</p>
            {loading === scene.id && (
              <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-white/80">
                <div className="w-6 h-6 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
              </div>
            )}
          </button>
        ))}
      </div>

      {/* ── SDE Interview Entry ──────────────────────── */}
      <div className="max-w-3xl w-full mb-6">
        <div
          className="cursor-pointer rounded-2xl border border-indigo-500/30 bg-gradient-to-r from-indigo-900/40 to-purple-900/40 p-6 hover:border-indigo-500/60 transition-all"
          onClick={() => router.push('/sde-interview')}
        >
          <div className="flex items-center gap-4">
            <span className="text-4xl">🧑‍💻</span>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-white">SDE Interview Practice</h3>
              <p className="text-sm text-gray-400 mt-0.5">
                Behavioral · Project Deep-Dive · CS Thinking
              </p>
              <p className="text-xs text-indigo-400 mt-1">
                Add your resume &amp; target JD for personalized questions
              </p>
            </div>
            <span className="text-indigo-400 text-lg">→</span>
          </div>
        </div>
      </div>

      {/* ── How to Use ───────────────────────────────── */}
      <div className="max-w-3xl w-full mb-12">
        <h2 className="text-xl font-bold text-gray-800 text-center mb-6">How to Use</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {HOW_TO_USE.map(({ step, icon, title, description }) => (
            <div key={step} className="bg-white rounded-2xl p-5 shadow-sm text-center">
              <div className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm font-bold mx-auto mb-3">
                {step}
              </div>
              <div className="text-3xl mb-2">{icon}</div>
              <h3 className="text-sm font-semibold text-gray-800 mb-1">{title}</h3>
              <p className="text-xs text-gray-400 leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Footer ───────────────────────────────────── */}
      <div className="flex flex-col items-center gap-3 pb-8">
        <Link href="/history" className="text-indigo-400 hover:text-indigo-600 text-xs underline">
          View Progress History →
        </Link>
        <p className="text-gray-400 text-xs">
          Powered by Claude AI · OpenAI Whisper · Web Speech API
        </p>
      </div>
    </main>
  )
}
