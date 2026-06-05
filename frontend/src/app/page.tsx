// file: src/app/page.tsx — TASK-012
// owner: Frontend Engineer
// version: 1.0
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
]

export default function HomePage() {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

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
        body: JSON.stringify({ scene: sceneId }),
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
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex flex-col items-center justify-center p-8">
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 bg-indigo-100 rounded-full px-4 py-1.5 mb-5">
          <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
          <span className="text-indigo-600 text-sm font-medium">AI-Powered Speaking Coach</span>
        </div>
        <h1 className="text-5xl font-bold text-gray-900 mb-3 tracking-tight">
          AI English Coach
        </h1>
        <p className="text-lg text-gray-500 max-w-sm mx-auto">
          Select a scenario and start a real conversation with AI
        </p>
      </div>

      {error && (
        <div className="mb-6 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm max-w-md">
          ⚠️ {error} — make sure the backend server is running at {API_URL}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl w-full">
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

      <div className="mt-10 flex flex-col items-center gap-3">
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
