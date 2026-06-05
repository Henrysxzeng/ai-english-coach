// file: src/app/history/page.tsx
// owner: Frontend Engineer
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface HistoryItem {
  session_id: string
  scene: string
  topic?: string
  clarity_score?: number
  structure_score?: number
  overall_score: number
  grammar_errors: number
  vocabulary_score: number
  created_at: string
}

const SCENE_ICONS: Record<string, string> = {
  interview: '💼',
  restaurant: '🍽️',
  meeting: '📊',
}

const TABS = [
  { id: 'all', label: 'All' },
  { id: 'interview', label: 'Interview' },
  { id: 'restaurant', label: 'Restaurant' },
  { id: 'meeting', label: 'Meeting' },
]

// ─── Chart constants ───────────────────────────────────────────────────────────

const W = 560, H = 160, PAD = 40
const SVG_W = W + 2 * PAD   // 640
const SVG_H = H + 2 * PAD   // 240

function toX(i: number, n: number) {
  return PAD + (n <= 1 ? W / 2 : (i / (n - 1)) * W)
}
function toY(score: number) {
  return PAD + H - (Math.max(0, Math.min(100, score)) / 100) * H
}

const CHART_LINES: { key: keyof HistoryItem; label: string; color: string }[] = [
  { key: 'overall_score',  label: 'Overall',   color: '#3b82f6' },
  { key: 'clarity_score',  label: 'Clarity',   color: '#22c55e' },
  { key: 'structure_score', label: 'Structure', color: '#a855f7' },
]

// ─── Line chart ────────────────────────────────────────────────────────────────

function LineChart({ data }: { data: HistoryItem[] }) {
  if (data.length < 2) {
    return (
      <div className="flex items-center justify-center h-36 text-gray-400 text-sm">
        Complete at least 2 sessions to see your progress
      </div>
    )
  }

  const n = data.length

  return (
    <div className="overflow-x-auto">
      <svg width={SVG_W} height={SVG_H} className="block">
        {/* Y grid lines + labels */}
        {[0, 25, 50, 75, 100].map((val) => {
          const y = toY(val)
          return (
            <g key={val}>
              <line x1={PAD} y1={y} x2={PAD + W} y2={y} stroke="#f3f4f6" strokeWidth="1" />
              <text
                x={PAD - 8}
                y={y + 4}
                textAnchor="end"
                fill="#9ca3af"
                style={{ fontSize: '11px', fontFamily: 'system-ui, sans-serif' }}
              >
                {val}
              </text>
            </g>
          )
        })}

        {/* Axes */}
        <line x1={PAD} y1={PAD} x2={PAD} y2={PAD + H} stroke="#e5e7eb" strokeWidth="1" />
        <line x1={PAD} y1={PAD + H} x2={PAD + W} y2={PAD + H} stroke="#e5e7eb" strokeWidth="1" />

        {/* X axis labels */}
        {data.map((_, i) => (
          <text
            key={i}
            x={toX(i, n)}
            y={PAD + H + 16}
            textAnchor="middle"
            fill="#9ca3af"
            style={{ fontSize: '11px', fontFamily: 'system-ui, sans-serif' }}
          >
            {i + 1}
          </text>
        ))}

        {/* Legend */}
        {CHART_LINES.map(({ label, color }, i) => {
          const lx = 180 + i * 120
          const ly = 14
          return (
            <g key={label}>
              <line x1={lx} y1={ly} x2={lx + 16} y2={ly} stroke={color} strokeWidth="2" />
              <circle cx={lx + 8} cy={ly} r="3" fill={color} />
              <text
                x={lx + 22}
                y={ly + 4}
                fill="#6b7280"
                style={{ fontSize: '11px', fontFamily: 'system-ui, sans-serif' }}
              >
                {label}
              </text>
            </g>
          )
        })}

        {/* Lines + dots per metric */}
        {CHART_LINES.map(({ key, color }) => {
          const pts = data
            .map((d, i) => {
              const val = d[key]
              if (val == null || typeof val !== 'number') return null
              return { x: toX(i, n), y: toY(val), score: Math.round(val), num: i + 1 }
            })
            .filter((p): p is NonNullable<typeof p> => p !== null)

          if (pts.length === 0) return null

          return (
            <g key={key}>
              {pts.length >= 2 && (
                <polyline
                  points={pts.map((p) => `${p.x},${p.y}`).join(' ')}
                  fill="none"
                  stroke={color}
                  strokeWidth="2"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              )}
              {pts.map((p) => (
                <circle key={p.num} cx={p.x} cy={p.y} r="4" fill={color} stroke="white" strokeWidth="1.5">
                  <title>{`Session ${p.num}: ${p.score}`}</title>
                </circle>
              ))}
            </g>
          )
        })}
      </svg>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HistoryPage() {
  const [allData, setAllData] = useState<HistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('all')

  useEffect(() => {
    fetch(`${API_URL}/api/history`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then((data: HistoryItem[]) => {
        // Sort newest first for the list; chart will reverse to get oldest-first
        const sorted = [...data].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        )
        setAllData(sorted)
        setLoading(false)
      })
      .catch((e: Error) => {
        setError(e.message)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-red-500 text-sm">Failed to load history: {error}</p>
          <Link href="/" className="text-indigo-600 hover:underline text-sm">
            ← Back to Home
          </Link>
        </div>
      </div>
    )
  }

  // Newest-first for list; reverse for chart (oldest → newest = left → right)
  const filtered = activeTab === 'all' ? allData : allData.filter((d) => d.scene === activeTab)
  const chartData = [...filtered].reverse()

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-10 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Title */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Practice History</h1>
          <p className="text-gray-500 text-sm">
            {allData.length} session{allData.length !== 1 ? 's' : ''} total
          </p>
        </div>

        {/* Scene filter tabs */}
        <div className="flex gap-2 flex-wrap">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-indigo-50 border border-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Line chart */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <h2 className="font-semibold text-gray-800">Score Progress</h2>
            {chartData.length >= 2 && (
              <span className="text-xs text-gray-400">
                sessions 1 → {chartData.length}
              </span>
            )}
          </div>
          <LineChart data={chartData} />
        </div>

        {/* History list */}
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 shadow-sm text-center text-gray-400 text-sm">
            No sessions yet. Start practicing to see your history!
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            {filtered.map((item, i) => (
              <div
                key={item.session_id}
                className={`px-6 py-4 flex items-center gap-4 ${
                  i < filtered.length - 1 ? 'border-b border-gray-50' : ''
                }`}
              >
                <div className="text-2xl flex-shrink-0">
                  {SCENE_ICONS[item.scene] ?? '📝'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-medium text-gray-800 capitalize">
                      {item.scene}
                    </span>
                    {i === 0 && (
                      <span className="px-2 py-0.5 bg-indigo-100 text-indigo-600 text-xs font-semibold rounded-full">
                        Latest
                      </span>
                    )}
                  </div>
                  {item.topic && (
                    <p className="text-xs text-indigo-500 font-medium truncate">
                      📌 {item.topic}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(item.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-4 text-right flex-shrink-0">
                  <div>
                    <p className="text-xs text-gray-400">Overall</p>
                    <p className="text-sm font-bold text-gray-800">
                      {Math.round(item.overall_score)}
                    </p>
                  </div>
                  {item.clarity_score != null && (
                    <div>
                      <p className="text-xs text-gray-400">Clarity</p>
                      <p className="text-sm font-bold text-green-600">
                        {Math.round(item.clarity_score)}
                      </p>
                    </div>
                  )}
                  {item.structure_score != null && (
                    <div>
                      <p className="text-xs text-gray-400">Structure</p>
                      <p className="text-sm font-bold text-purple-600">
                        {Math.round(item.structure_score)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Back to Home */}
        <div className="text-center py-2">
          <Link
            href="/"
            className="inline-block px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-sm transition-colors"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </main>
  )
}
