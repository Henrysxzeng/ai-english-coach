// file: src/app/assessment/result/[sessionId]/page.tsx — TASK-024-FE / TASK-032
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
      <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-rose-50 via-white to-pink-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-rose-500 text-sm">Failed to load result: {error}</p>
          <Link href="/" className="text-rose-400 hover:text-rose-500 text-sm">← Back to Home</Link>
        </div>
      </div>
    )
  }

  if (!result) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-rose-50 via-white to-pink-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-rose-100 border-t-rose-400 rounded-full animate-spin mx-auto" />
          <p className="text-sm text-gray-400">Calculating your level...</p>
        </div>
      </div>
    )
  }

  const diffLabel = DIFFICULTY_LABEL[result.recommended_difficulty] ?? result.recommended_difficulty

  return (
    <main className="relative min-h-screen overflow-hidden py-10 px-4">
      {/* 环境光晕 */}
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[#f0e0eb]">
        <div className="absolute -top-40 left-1/4   w-[700px] h-[700px] rounded-full bg-pink-400/35  blur-[160px]" />
        <div className="absolute bottom-0  right-1/4  w-[600px] h-[600px] rounded-full bg-rose-400/30  blur-[140px]" />
        <div className="absolute top-1/3  -right-32   w-[500px] h-[500px] rounded-full bg-purple-300/20 blur-[130px]" />
        <div className="absolute top-1/4  -left-32    w-[450px] h-[450px] rounded-full bg-pink-300/25  blur-[120px]" />
      </div>

      <div className="max-w-lg mx-auto space-y-6">
        {/* Title */}
        <div className="text-center">
          <p className="text-sm text-gray-400 mb-2">Speaking Test Result</p>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Your CEFR Level</h1>
        </div>

        {/* CEFR level card */}
        <div className="bg-white/80 backdrop-blur-xl border border-pink-100 rounded-2xl p-10 text-center shadow-[0_4px_24px_rgba(244,114,182,0.08)]">
          <div className="text-7xl font-bold bg-gradient-to-r from-rose-400 to-pink-500 bg-clip-text text-transparent mb-2 tracking-tight">
            {result.cefr_level}
          </div>
          <div className="text-xl font-semibold text-gray-600">{result.level_label}</div>
        </div>

        {/* Recommended level */}
        <div className="bg-white/80 backdrop-blur-xl border border-pink-100 rounded-2xl p-5 shadow-[0_4px_24px_rgba(244,114,182,0.07)] flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-xl flex-shrink-0">
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
          <div className="bg-white/80 backdrop-blur-xl border border-pink-100 rounded-2xl p-6 shadow-[0_4px_24px_rgba(244,114,182,0.07)]">
            <h2 className="font-semibold text-gray-800 mb-4">Strengths</h2>
            <div className="bg-green-50 border border-green-100 rounded-xl p-4 space-y-2">
              {result.strengths.map((s, i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="text-green-500 mt-0.5 flex-shrink-0">✅</span>
                  <span>{s}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Areas to improve */}
        {result.areas_to_improve?.length > 0 && (
          <div className="bg-white/80 backdrop-blur-xl border border-pink-100 rounded-2xl p-6 shadow-[0_4px_24px_rgba(244,114,182,0.07)]">
            <h2 className="font-semibold text-gray-800 mb-4">Areas to Improve</h2>
            <div className="bg-rose-50 border border-rose-100 rounded-xl p-4 space-y-2">
              {result.areas_to_improve.map((s, i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="text-rose-400 mt-0.5 flex-shrink-0">📈</span>
                  <span>{s}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="text-center py-4">
          <Link
            href="/"
            className="inline-block px-10 py-3 bg-gradient-to-r from-rose-400 to-pink-500 text-white font-semibold rounded-xl shadow-[0_4px_16px_rgba(244,63,94,0.28)] hover:shadow-[0_6px_24px_rgba(244,63,94,0.38)] hover:scale-[1.02] transition-all duration-200"
          >
            Start Practicing →
          </Link>
        </div>
      </div>
    </main>
  )
}
