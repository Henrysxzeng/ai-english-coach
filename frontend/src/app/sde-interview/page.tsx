// file: src/app/sde-interview/page.tsx — TASK-028
// owner: Frontend Engineer
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

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
  const [selectedScene, setSelectedScene] = useState('')
  const [resumeContext, setResumeContext] = useState('')
  const [jdContext, setJdContext] = useState('')
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleStart() {
    if (!selectedScene || isLoading) return
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_URL}/api/session/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scene: selectedScene,
          difficulty,
          resume_context: resumeContext,
          jd_context: jdContext,
        }),
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
    <main className="min-h-screen bg-gray-900 flex flex-col items-center py-12 px-4">
      <div className="w-full max-w-2xl space-y-8">
        {/* Title */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-2">SDE Interview Practice</h1>
          <p className="text-gray-400">Ace your software engineering interviews</p>
        </div>

        {/* Sub-scene cards */}
        <div className="grid grid-cols-3 gap-4">
          {SUB_SCENES.map((scene) => (
            <button
              key={scene.id}
              onClick={() => setSelectedScene(scene.id)}
              className={`rounded-2xl p-5 text-left transition-all ${
                selectedScene === scene.id
                  ? 'border-2 border-blue-500 bg-blue-900/20'
                  : 'border border-gray-600 hover:border-gray-500 bg-gray-800/50'
              }`}
            >
              <div className="text-3xl mb-3">{scene.icon}</div>
              <h3 className="text-sm font-semibold text-white mb-1">{scene.title}</h3>
              <p className="text-xs text-gray-400 leading-relaxed">{scene.description}</p>
            </button>
          ))}
        </div>

        {/* Optional context */}
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium text-gray-300 mb-0.5">Add Context (Optional)</p>
            <p className="text-xs text-gray-500">Helps AI personalize interview questions</p>
          </div>

          {/* Resume textarea */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">
              Your Resume
            </label>
            <div className="relative">
              <textarea
                value={resumeContext}
                onChange={(e) => setResumeContext(e.target.value)}
                maxLength={2000}
                rows={6}
                placeholder="Paste your resume here (optional) — AI will ask relevant project questions..."
                className="w-full bg-gray-800 border border-gray-600 rounded-xl px-4 py-3 text-sm text-gray-200 placeholder-gray-600 resize-none focus:outline-none focus:border-blue-500 transition-colors"
              />
              <span className="absolute bottom-2 right-3 text-xs text-gray-500">
                {resumeContext.length}/2000
              </span>
            </div>
          </div>

          {/* JD textarea */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">
              Job Description
            </label>
            <div className="relative">
              <textarea
                value={jdContext}
                onChange={(e) => setJdContext(e.target.value)}
                maxLength={2000}
                rows={4}
                placeholder="Paste job description (optional) — AI will tailor questions to the role..."
                className="w-full bg-gray-800 border border-gray-600 rounded-xl px-4 py-3 text-sm text-gray-200 placeholder-gray-600 resize-none focus:outline-none focus:border-blue-500 transition-colors"
              />
              <span className="absolute bottom-2 right-3 text-xs text-gray-500">
                {jdContext.length}/2000
              </span>
            </div>
          </div>
        </div>

        {/* Difficulty selector */}
        <div className="flex items-center justify-center gap-3">
          <p className="text-sm text-gray-400 font-medium">Difficulty:</p>
          {(['easy', 'medium', 'hard'] as const).map((d) => (
            <button
              key={d}
              onClick={() => setDifficulty(d)}
              className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-colors ${
                difficulty === d
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
              }`}
            >
              {d === 'easy' ? '🟢 Beginner' : d === 'medium' ? '🟡 Intermediate' : '🔴 Advanced'}
            </button>
          ))}
        </div>

        {/* Error banner */}
        {error && (
          <div className="bg-red-900/50 text-red-300 rounded-xl p-3 text-sm">{error}</div>
        )}

        {/* Start button */}
        <button
          onClick={handleStart}
          disabled={!selectedScene || isLoading}
          className={`w-full py-3.5 rounded-xl font-semibold text-base transition-all ${
            !selectedScene || isLoading
              ? 'bg-gray-700 text-gray-500 opacity-50 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg'
          }`}
        >
          {isLoading
            ? 'Starting...'
            : !selectedScene
            ? 'Select an interview type above'
            : 'Start Practice →'}
        </button>

        {/* Back link */}
        <div className="text-center">
          <Link href="/" className="text-gray-400 hover:text-gray-200 text-sm transition-colors">
            ← Back to Home
          </Link>
        </div>
      </div>
    </main>
  )
}
