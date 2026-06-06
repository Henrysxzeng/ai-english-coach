// file: src/app/report/[sessionId]/page.tsx — TASK-014 / TASK-032
// owner: Frontend Engineer
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
  wpm?: number | null
  wpm_label?: string | null
  wpm_context?: string
  filler_count?: number
  filler_words?: string[]
  key_vocabulary?: Array<{ word: string; definition: string; example: string }>
  interview_feedback?: {
    communication_score: number
    star_coverage: {
      situation: boolean
      task: boolean
      action: boolean
      result: boolean
    }
    star_feedback: string
    strengths: string[]
    improvements: string[]
    sample_rewrite: string
  } | null
}

// ─── SVG ring progress bar ─────────────────────────────────────────────────────

function ScoreRing({ score }: { score: number }) {
  const r = 52
  const circ = 2 * Math.PI * r
  const filled = (Math.max(0, Math.min(100, score)) / 100) * circ

  return (
    <div className="flex flex-col items-center">
      <svg width="144" height="144" viewBox="0 0 144 144">
        <circle cx="72" cy="72" r={r} fill="none" stroke="#fce7f3" strokeWidth="14" />
        <circle
          cx="72" cy="72" r={r} fill="none"
          stroke="#f43f5e" strokeWidth="14" strokeLinecap="round"
          strokeDasharray={`${filled} ${circ - filled}`}
          transform="rotate(-90 72 72)"
          style={{ transition: 'stroke-dasharray 1.2s ease' }}
        />
        <text x="72" y="65" textAnchor="middle" fill="#f43f5e"
          style={{ fontSize: '32px', fontWeight: 700, fontFamily: 'system-ui, sans-serif' }}>
          {Math.round(score)}
        </text>
        <text x="72" y="88" textAnchor="middle" fill="#9ca3af"
          style={{ fontSize: '12px', fontFamily: 'system-ui, sans-serif' }}>
          / 100
        </text>
      </svg>
      <p className="text-sm font-semibold text-gray-400 mt-1">Overall Score</p>
    </div>
  )
}

// ─── Score card ────────────────────────────────────────────────────────────────

function ScoreCard({ label, value, suffix = '' }: { label: string; value: number; suffix?: string }) {
  return (
    <div className="bg-white/80 backdrop-blur-xl border border-pink-100 rounded-2xl p-5 shadow-[0_4px_24px_rgba(244,114,182,0.07)]">
      <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">{label}</p>
      <p className="text-3xl font-bold bg-gradient-to-r from-rose-400 to-pink-500 bg-clip-text text-transparent">
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
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() })
      .then(setReport)
      .catch((e: Error) => setError(e.message))
  }, [sessionId])

  if (error) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-rose-50 via-white to-pink-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-rose-500 text-sm">Failed to load report: {error}</p>
          <Link href="/" className="text-rose-400 hover:text-rose-500 text-sm">← Back to Home</Link>
        </div>
      </div>
    )
  }

  if (!report) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-rose-50 via-white to-pink-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-rose-100 border-t-rose-400 rounded-full animate-spin" />
      </div>
    )
  }

  const durationMin = report.duration_seconds > 0 ? Math.round(report.duration_seconds / 60) : null

  return (
    <main className="relative min-h-screen overflow-hidden py-10 px-4">
      {/* 环境光晕 */}
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[#fdf8fb]">
        <div className="absolute -top-40 left-1/4   w-[700px] h-[700px] rounded-full bg-pink-300/20  blur-[160px]" />
        <div className="absolute bottom-0  right-1/4  w-[600px] h-[600px] rounded-full bg-rose-300/15  blur-[140px]" />
        <div className="absolute top-1/3  -right-32   w-[500px] h-[500px] rounded-full bg-purple-300/20 blur-[130px]" />
        <div className="absolute top-1/4  -left-32    w-[450px] h-[450px] rounded-full bg-pink-300/25  blur-[120px]" />
      </div>

      <div className="max-w-xl mx-auto space-y-6">
        {/* Title */}
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-1">Practice Report</h1>
          <p className="text-gray-400 text-sm capitalize">
            {report.scene}
            {report.total_turns > 0 && ` · ${report.total_turns} turns`}
            {!!durationMin && ` · ${durationMin} min`}
          </p>
          {report.topic && (
            <span className="inline-block mt-2 bg-rose-50 text-rose-500 border border-rose-200 rounded-full px-3 py-0.5 text-xs font-medium">
              📌 {report.topic}
            </span>
          )}
        </div>

        {/* 1. Overall score ring */}
        <div className="bg-white/80 backdrop-blur-xl border border-pink-100 rounded-2xl p-8 shadow-[0_4px_24px_rgba(244,114,182,0.08)] flex justify-center">
          <ScoreRing score={report.overall_score ?? 0} />
        </div>

        {/* 2. Score cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <ScoreCard label="Pronunciation" value={report.pronunciation_score ?? 0} suffix="/100" />
          <ScoreCard label="Fluency"        value={report.fluency_score ?? 0}        suffix="/100" />
          <ScoreCard label="Vocabulary"     value={report.vocabulary_score ?? 0}     suffix="/100" />
          <ScoreCard label="Grammar Errors" value={report.grammar_errors ?? 0}       suffix="errors" />
          {report.clarity_score != null && (
            <ScoreCard label="Expression Clarity" value={report.clarity_score} suffix="/100" />
          )}
          {report.structure_score != null && (
            <ScoreCard label="Response Structure" value={report.structure_score} suffix="/100" />
          )}
        </div>

        {/* 3. Grammar Corrections */}
        <div className="bg-white/80 backdrop-blur-xl border border-pink-100 rounded-2xl p-6 shadow-[0_4px_24px_rgba(244,114,182,0.07)]">
          <h2 className="font-semibold text-gray-800 mb-4">Grammar Corrections</h2>
          {report.corrections?.length > 0 ? (
            <div className="space-y-3">
              {report.corrections.map((c, i) => (
                <div key={i} className="bg-rose-50 border border-rose-100 rounded-xl p-4">
                  <p className="text-xs text-rose-500 font-medium mb-1">Original</p>
                  <p className="text-sm text-gray-600 line-through">{c.original}</p>
                  <p className="text-xs text-green-600 font-medium mt-2 mb-1">✓ Corrected</p>
                  <p className="text-sm text-gray-800 font-medium">{c.corrected}</p>
                  <p className="text-xs text-gray-400 mt-2 leading-relaxed">{c.explanation}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-green-600 font-medium">No grammar errors detected — great job!</p>
          )}
        </div>

        {/* 4. Fluency Analysis */}
        {report.wpm != null && (
          <div className="bg-white/80 backdrop-blur-xl border border-pink-100 rounded-2xl p-6 shadow-[0_4px_24px_rgba(244,114,182,0.07)]">
            <h2 className="font-semibold text-gray-800 mb-3">🎙️ Fluency Analysis</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Speaking Speed</p>
                <p className="text-2xl font-bold bg-gradient-to-r from-rose-400 to-pink-500 bg-clip-text text-transparent">
                  {report.wpm} <span className="text-sm font-normal text-gray-400">WPM</span>
                </p>
                {report.wpm_label && <p className="text-sm text-rose-400 font-medium mt-0.5">{report.wpm_label}</p>}
                {report.wpm_context && <p className="text-xs text-gray-400 mt-1">{report.wpm_context}</p>}
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Filler Words</p>
                <p className="text-2xl font-bold bg-gradient-to-r from-rose-400 to-pink-500 bg-clip-text text-transparent">
                  {report.filler_count ?? 0}
                </p>
                {report.filler_words && report.filler_words.length > 0 && (
                  <p className="text-xs text-gray-400 mt-1">Detected: {report.filler_words.join(', ')}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 5. Ambiguous expressions */}
        {report.ambiguous_expressions && report.ambiguous_expressions.length > 0 && (
          <div className="bg-white/80 backdrop-blur-xl border border-pink-100 rounded-2xl p-6 shadow-[0_4px_24px_rgba(244,114,182,0.07)]">
            <h2 className="font-semibold text-gray-800 mb-4">💬 Clearer Ways to Say It</h2>
            <div className="space-y-3">
              {report.ambiguous_expressions.map((item, i) => (
                <div key={i} className="bg-rose-50 border border-rose-100 rounded-xl p-4">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="text-gray-500 text-sm line-through">{item.original}</span>
                    <span className="text-rose-300 text-sm">→</span>
                    <span className="text-rose-500 text-sm font-semibold">{item.better}</span>
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed">{item.explanation}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 6. Improvement suggestions */}
        {report.suggestions?.length > 0 && (
          <div className="bg-white/80 backdrop-blur-xl border border-pink-100 rounded-2xl p-6 shadow-[0_4px_24px_rgba(244,114,182,0.07)]">
            <h2 className="font-semibold text-gray-800 mb-4">Improvement Suggestions</h2>
            <ul className="space-y-2">
              {report.suggestions.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                  <span className="text-rose-400 font-bold mt-0.5 flex-shrink-0">•</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 7. Key Vocabulary */}
        {report.key_vocabulary && report.key_vocabulary.length > 0 && (
          <div className="bg-white/80 backdrop-blur-xl border border-pink-100 rounded-2xl p-6 shadow-[0_4px_24px_rgba(244,114,182,0.07)]">
            <h2 className="font-semibold text-gray-800 mb-4">📚 Key Vocabulary</h2>
            <div className="space-y-3">
              {report.key_vocabulary.map((item, i) => (
                <div key={i} className="border border-pink-100 bg-white/60 rounded-xl p-4">
                  <p className="font-semibold text-gray-800 text-sm">{item.word}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{item.definition}</p>
                  <p className="text-xs text-rose-400 italic mt-1">&ldquo;{item.example}&rdquo;</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 8. STAR Interview Feedback (sde_* scenes) */}
        {report.interview_feedback && (
          <div className="bg-white/80 backdrop-blur-xl border border-pink-100 rounded-2xl p-6 shadow-[0_4px_24px_rgba(244,114,182,0.08)]">
            <h2 className="font-semibold text-gray-800 mb-4">🎯 Interview Performance</h2>

            {/* Communication Score + STAR Coverage */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div className="bg-rose-50 border border-rose-100 rounded-xl p-4 text-center">
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Communication Score</p>
                <p className="text-4xl font-bold bg-gradient-to-r from-rose-400 to-pink-500 bg-clip-text text-transparent">
                  {report.interview_feedback.communication_score}
                </p>
                <p className="text-xs text-gray-400 mt-1">/ 100</p>
              </div>
              <div className="bg-rose-50 border border-rose-100 rounded-xl p-4">
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">STAR Coverage</p>
                <div className="grid grid-cols-2 gap-1">
                  {(['situation', 'task', 'action', 'result'] as const).map((key) => (
                    <div key={key} className="flex items-center gap-1">
                      <span className={report.interview_feedback!.star_coverage[key] ? 'text-green-500' : 'text-rose-400'}>
                        {report.interview_feedback!.star_coverage[key] ? '✓' : '✗'}
                      </span>
                      <span className="text-xs text-gray-600 capitalize">{key}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Star Feedback */}
            {report.interview_feedback.star_feedback && (
              <div className="bg-rose-50/60 border border-rose-100 rounded-xl p-4 italic text-gray-600 text-sm mb-4">
                &ldquo;{report.interview_feedback.star_feedback}&rdquo;
              </div>
            )}

            {/* Strengths + Improvements */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm font-medium text-green-600 mb-2">✅ Strengths</p>
                <ul className="space-y-1">
                  {report.interview_feedback.strengths.map((s, i) => (
                    <li key={i} className="text-sm text-gray-600">• {s}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-sm font-medium text-rose-500 mb-2">⚠️ Areas to Improve</p>
                <ul className="space-y-1">
                  {report.interview_feedback.improvements.map((s, i) => (
                    <li key={i} className="text-sm text-gray-600">• {s}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Sample Rewrite */}
            {report.interview_feedback.sample_rewrite && (
              <div className="border-l-4 border-rose-300 pl-4 mt-4">
                <p className="text-xs text-rose-400 font-medium mb-1">💡 Try saying it like this:</p>
                <p className="text-sm text-gray-600 italic">{report.interview_feedback.sample_rewrite}</p>
              </div>
            )}
          </div>
        )}

        {/* 9. Highlights */}
        {report.highlights?.length > 0 && (
          <div className="bg-white/80 backdrop-blur-xl border border-pink-100 rounded-2xl p-6 shadow-[0_4px_24px_rgba(244,114,182,0.07)]">
            <h2 className="font-semibold text-gray-800 mb-4">Highlights</h2>
            <ul className="space-y-2">
              {report.highlights.map((h, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                  <span className="text-rose-400 mt-0.5 flex-shrink-0">★</span>
                  <span>{h}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 10. Actions */}
        <div className="flex items-center justify-center gap-4 py-4 print:hidden">
          <Link
            href="/"
            className="inline-block px-8 py-3 bg-gradient-to-r from-rose-400 to-pink-500 text-white font-semibold rounded-xl shadow-[0_4px_16px_rgba(244,63,94,0.28)] hover:shadow-[0_6px_24px_rgba(244,63,94,0.38)] hover:scale-[1.02] transition-all duration-200"
          >
            Practice Again
          </Link>
          <button
            onClick={() => window.print()}
            className="inline-block px-6 py-3 border border-rose-200 text-rose-500 bg-white hover:bg-rose-50 font-semibold rounded-xl transition-all duration-200"
          >
            🖨️ Print / Save PDF
          </button>
        </div>
      </div>
    </main>
  )
}
