// file: src/app/report/[sessionId]/page.tsx — TASK-014
// owner: Frontend Engineer
// version: 1.0
'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface CorrectionItem {
  original: string
  corrected: string
  explanation: string
}

interface AmbiguousExpression {
  original: string
  better: string
  explanation: string
}

interface Report {
  session_id: string
  scene: string
  duration_seconds: number
  total_turns: number
  pronunciation_score: number
  grammar_errors: number
  fluency_score: number
  vocabulary_score: number
  overall_score: number
  corrections: CorrectionItem[]
  suggestions: string[]
  highlights: string[]
  topic?: string
  clarity_score?: number
  structure_score?: number
  ambiguous_expressions?: AmbiguousExpression[]
  weak_areas?: string[]
}

// ─── SVG ring progress bar ─────────────────────────────────────────────────────

function ScoreRing({ score }: { score: number }) {
  const r = 52
  const circ = 2 * Math.PI * r
  const filled = (Math.max(0, Math.min(100, score)) / 100) * circ
  const color = score >= 80 ? '#22c55e' : score >= 60 ? '#f59e0b' : '#ef4444'

  return (
    <div className="flex flex-col items-center">
      <svg width="144" height="144" viewBox="0 0 144 144">
        {/* Track */}
        <circle cx="72" cy="72" r={r} fill="none" stroke="#e5e7eb" strokeWidth="14" />
        {/* Progress */}
        <circle
          cx="72"
          cy="72"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={`${filled} ${circ - filled}`}
          transform="rotate(-90 72 72)"
          style={{ transition: 'stroke-dasharray 1.2s ease' }}
        />
        {/* Score text */}
        <text
          x="72"
          y="65"
          textAnchor="middle"
          fill={color}
          style={{ fontSize: '32px', fontWeight: 700, fontFamily: 'system-ui, sans-serif' }}
        >
          {Math.round(score)}
        </text>
        <text
          x="72"
          y="88"
          textAnchor="middle"
          fill="#9ca3af"
          style={{ fontSize: '12px', fontFamily: 'system-ui, sans-serif' }}
        >
          / 100
        </text>
      </svg>
      <p className="text-sm font-semibold text-gray-500 mt-1">Overall Score</p>
    </div>
  )
}

// ─── Score card ────────────────────────────────────────────────────────────────

function ScoreCard({
  label,
  value,
  suffix = '',
  accent,
}: {
  label: string
  value: number
  suffix?: string
  accent: string
}) {
  return (
    <div className={`bg-white rounded-2xl p-5 shadow-sm border-l-4 ${accent}`}>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{label}</p>
      <p className="text-3xl font-bold text-gray-800">
        {Math.round(value)}
        <span className="text-base font-normal text-gray-400 ml-1">{suffix}</span>
      </p>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ReportPage() {
  const params = useParams()
  const sessionId = params.sessionId as string
  const [report, setReport] = useState<Report | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`${API_URL}/api/report/${sessionId}`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then(setReport)
      .catch((e: Error) => setError(e.message))
  }, [sessionId])

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-red-500 text-sm">Failed to load report: {error}</p>
          <Link href="/" className="text-indigo-600 hover:underline text-sm">
            ← Back to Home
          </Link>
        </div>
      </div>
    )
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    )
  }

  const durationMin = report.duration_seconds > 0 ? Math.round(report.duration_seconds / 60) : null

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-10 px-4">
      <div className="max-w-xl mx-auto space-y-6">
        {/* Title */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Practice Report</h1>
          <p className="text-gray-500 text-sm capitalize">
            {report.scene}
            {report.total_turns > 0 && ` · ${report.total_turns} turns`}
            {!!durationMin && ` · ${durationMin} min`}
          </p>
          {report.topic && (
            <p className="text-xs text-indigo-500 font-medium mt-1">📌 {report.topic}</p>
          )}
        </div>

        {/* 1. Overall score ring */}
        <div className="bg-white rounded-2xl p-8 shadow-sm flex justify-center">
          <ScoreRing score={report.overall_score ?? 0} />
        </div>

        {/* 2. Four score cards */}
        <div className="grid grid-cols-2 gap-3">
          <ScoreCard
            label="Pronunciation"
            value={report.pronunciation_score ?? 0}
            suffix="/100"
            accent="border-blue-400"
          />
          <ScoreCard
            label="Fluency"
            value={report.fluency_score ?? 0}
            suffix="/100"
            accent="border-green-400"
          />
          <ScoreCard
            label="Vocabulary"
            value={report.vocabulary_score ?? 0}
            suffix="/100"
            accent="border-purple-400"
          />
          <ScoreCard
            label="Grammar Errors"
            value={report.grammar_errors ?? 0}
            suffix="errors"
            accent="border-red-400"
          />
          {report.clarity_score != null && (
            <ScoreCard
              label="Expression Clarity"
              value={report.clarity_score}
              suffix="/100"
              accent="border-teal-400"
            />
          )}
          {report.structure_score != null && (
            <ScoreCard
              label="Response Structure"
              value={report.structure_score}
              suffix="/100"
              accent="border-orange-400"
            />
          )}
        </div>

        {/* 3. Corrections list */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="font-semibold text-gray-800 mb-4">Grammar Corrections</h2>
          {report.corrections?.length > 0 ? (
            <div className="space-y-4">
              {report.corrections.map((c, i) => (
                <div key={i} className="border border-gray-100 rounded-xl p-4">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <span className="text-red-500 text-sm line-through">{c.original}</span>
                    <span className="text-gray-300 text-sm">→</span>
                    <span className="text-green-600 text-sm font-semibold">{c.corrected}</span>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed">{c.explanation}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-green-600 font-medium">No grammar errors detected — great job!</p>
          )}
        </div>

        {/* 4. Ambiguous expressions */}
        {report.ambiguous_expressions && report.ambiguous_expressions.length > 0 && (
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="font-semibold text-gray-800 mb-4">💬 Clearer Ways to Say It</h2>
            <div className="space-y-4">
              {report.ambiguous_expressions.map((item, i) => (
                <div key={i} className="border border-gray-100 rounded-xl p-4">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="text-gray-500 text-sm line-through">{item.original}</span>
                    <span className="text-gray-300 text-sm">→</span>
                    <span className="text-teal-600 text-sm font-semibold">{item.better}</span>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed">{item.explanation}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 6. Improvement suggestions */}
        {report.suggestions?.length > 0 && (
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="font-semibold text-gray-800 mb-4">Improvement Suggestions</h2>
            <ul className="space-y-2">
              {report.suggestions.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                  <span className="text-indigo-500 font-bold mt-0.5 flex-shrink-0">•</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 7. Highlights */}
        {report.highlights?.length > 0 && (
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="font-semibold text-gray-800 mb-4">Highlights</h2>
            <ul className="space-y-2">
              {report.highlights.map((h, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                  <span className="text-yellow-500 mt-0.5 flex-shrink-0">★</span>
                  <span>{h}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 8. Practice Again */}
        <div className="text-center py-4">
          <Link
            href="/"
            className="inline-block px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-sm transition-colors"
          >
            Practice Again
          </Link>
        </div>
      </div>
    </main>
  )
}
