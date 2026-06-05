// file: src/app/assessment/result/[sessionId]/page.tsx — TASK-024-FE
// owner: Frontend Engineer
'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface AssessmentResult {
  session_id: string
  cefr_level: string
  level_label: string
  strengths: string[]
  areas_to_improve: string[]
  recommended_difficulty: string
}

const LEVEL_COLORS: Record<string, { bg: string; text: string; ring: string }> = {
  A2: { bg: 'bg-red-50',    text: 'text-red-600',    ring: 'ring-red-300' },
  B1: { bg: 'bg-yellow-50', text: 'text-yellow-600', ring: 'ring-yellow-300' },
  B2: { bg: 'bg-blue-50',   text: 'text-blue-600',   ring: 'ring-blue-300' },
  C1: { bg: 'bg-green-50',  text: 'text-green-600',  ring: 'ring-green-300' },
}

const DIFFICULTY_LABEL: Record<string, string> = {
  easy:   'Beginner',
  medium: 'Intermediate',
  hard:   'Advanced',
}

export default function AssessmentResultPage() {
  const params = useParams()
  const sessionId = params.sessionId as string
  const [result, setResult] = useState<AssessmentResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`${API_URL}/api/assessment/${sessionId}/result`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then(setResult)
      .catch((e: Error) => setError(e.message))
  }, [sessionId])

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-red-500 text-sm">Failed to load result: {error}</p>
          <Link href="/" className="text-indigo-600 hover:underline text-sm">
            ← Back to Home
          </Link>
        </div>
      </div>
    )
  }

  if (!result) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto" />
          <p className="text-sm text-gray-400">Calculating your level...</p>
        </div>
      </div>
    )
  }

  const colors = LEVEL_COLORS[result.cefr_level] ?? LEVEL_COLORS['B1']
  const diffLabel =
    DIFFICULTY_LABEL[result.recommended_difficulty] ?? result.recommended_difficulty

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-10 px-4">
      <div className="max-w-lg mx-auto space-y-6">
        {/* Title */}
        <div className="text-center">
          <p className="text-sm text-gray-400 mb-2">Speaking Test Result</p>
          <h1 className="text-3xl font-bold text-gray-900">Your CEFR Level</h1>
        </div>

        {/* CEFR level card */}
        <div
          className={`${colors.bg} rounded-2xl p-10 text-center shadow-sm ring-4 ${colors.ring}`}
        >
          <div className={`text-8xl font-black ${colors.text} mb-2 tracking-tight`}>
            {result.cefr_level}
          </div>
          <div className={`text-xl font-semibold ${colors.text}`}>{result.level_label}</div>
        </div>

        {/* Recommended level */}
        <div className="bg-white rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-xl flex-shrink-0">
            🎯
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">
              Recommended Practice Level
            </p>
            <p className="text-lg font-bold text-gray-800">{diffLabel}</p>
          </div>
        </div>

        {/* Strengths */}
        {result.strengths?.length > 0 && (
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="font-semibold text-gray-800 mb-4">Strengths</h2>
            <ul className="space-y-2">
              {result.strengths.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="text-green-500 mt-0.5 flex-shrink-0">✅</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Areas to improve */}
        {result.areas_to_improve?.length > 0 && (
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="font-semibold text-gray-800 mb-4">Areas to Improve</h2>
            <ul className="space-y-2">
              {result.areas_to_improve.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="text-indigo-500 mt-0.5 flex-shrink-0">📈</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* CTA */}
        <div className="text-center py-4">
          <Link
            href="/"
            className="inline-block px-10 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-sm transition-colors text-base"
          >
            Start Practicing →
          </Link>
        </div>
      </div>
    </main>
  )
}
