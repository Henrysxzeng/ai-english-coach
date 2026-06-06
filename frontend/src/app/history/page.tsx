// file: src/app/history/page.tsx — TASK-033-B pink redesign
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
  interview:        '💼',
  restaurant:       '🍽️',
  meeting:          '📊',
  hospital:         '🏥',
  phone_call:       '📞',
  customer_service: '🎧',
  sde_behavioral:   '🗣',
  sde_project:      '💼',
  sde_thinking:     '🧠',
}

const TABS = [
  { id: 'all',              label: 'All' },
  { id: 'interview',        label: 'Interview' },
  { id: 'restaurant',       label: 'Restaurant' },
  { id: 'meeting',          label: 'Meeting' },
  { id: 'hospital',         label: 'Hospital' },
  { id: 'phone_call',       label: 'Phone Call' },
  { id: 'customer_service', label: 'Customer Service' },
  { id: 'sde_behavioral',   label: 'SDE Behavioral' },
  { id: 'sde_project',      label: 'SDE Project' },
  { id: 'sde_thinking',     label: 'SDE Thinking' },
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
  { key: 'overall_score',   label: 'Overall',   color: '#f43f5e' },
  { key: 'clarity_score',   label: 'Clarity',   color: '#fb7185' },
  { key: 'structure_score', label: 'Structure', color: '#fda4af' },
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
              <line x1={PAD} y1={y} x2={PAD + W} y2={y} stroke="#fce7f3" strokeWidth="1" />
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
        <line x1={PAD} y1={PAD} x2={PAD} y2={PAD + H} stroke="#fce7f3" strokeWidth="1" />
        <line x1={PAD} y1={PAD + H} x2={PAD + W} y2={PAD + H} stroke="#fce7f3" strokeWidth="1" />

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

  const GlowBg = () => (
    <div className="pointer-events-none fixed inset-0 -z-10 bg-[#f0e0eb]">
      <div className="absolute -top-40 left-1/4   w-[700px] h-[700px] rounded-full bg-pink-400/35  blur-[160px]" />
      <div className="absolute bottom-0  right-1/4  w-[600px] h-[600px] rounded-full bg-rose-400/30  blur-[140px]" />
      <div className="absolute top-1/3  -right-32   w-[500px] h-[500px] rounded-full bg-purple-300/20 blur-[130px]" />
      <div className="absolute top-1/4  -left-32    w-[450px] h-[450px] rounded-full bg-pink-300/25  blur-[120px]" />
    </div>
  )

  if (loading) {
    return (
      <div className="relative min-h-screen overflow-hidden flex items-center justify-center">
        <GlowBg />
        <div className="w-8 h-8 border-4 border-rose-100 border-t-rose-400 rounded-full animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="relative min-h-screen overflow-hidden flex items-center justify-center">
        <GlowBg />
        <div className="text-center space-y-4">
          <p className="text-rose-500 text-sm">Failed to load history: {error}</p>
          <Link href="/" className="text-rose-400 hover:text-rose-500 text-sm transition-colors">
            ← Back to Home
          </Link>
        </div>
      </div>
    )
  }

  // 成长汇总统计（纯前端基于历史数据计算）
  const totalSessions = allData.length
  const avgScore = totalSessions ? Math.round(allData.reduce((s, d) => s + (d.overall_score || 0), 0) / totalSessions) : 0
  const bestScore = totalSessions ? Math.round(Math.max(...allData.map((d) => d.overall_score || 0))) : 0
  const practiceDays = new Set(allData.map((d) => new Date(d.created_at).toDateString()))
  let streak = 0
  {
    const d = new Date()
    if (!practiceDays.has(d.toDateString())) d.setDate(d.getDate() - 1)
    while (practiceDays.has(d.toDateString())) { streak++; d.setDate(d.getDate() - 1) }
  }

  const filtered = activeTab === 'all' ? allData : allData.filter((d) => d.scene === activeTab)
  const chartData = [...filtered].reverse()

  return (
    <main className="relative min-h-screen overflow-hidden py-10 px-4">
      <GlowBg />

      <div className="max-w-3xl mx-auto space-y-6">
        {/* Title */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Growth Dashboard</h1>
          <p className="text-gray-400 text-sm">
            {allData.length} session{allData.length !== 1 ? 's' : ''} total
          </p>
        </div>

        {/* 成长汇总 KPI */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: '📚', label: 'Sessions', value: totalSessions },
            { icon: '⭐', label: 'Avg Score', value: avgScore },
            { icon: '🏆', label: 'Best', value: bestScore },
            { icon: '🔥', label: 'Day Streak', value: streak },
          ].map((s) => (
            <div key={s.label} className="bg-white/80 backdrop-blur-xl border border-pink-100 rounded-2xl p-4 text-center shadow-[0_4px_24px_rgba(244,114,182,0.07)]">
              <div className="text-2xl mb-1">{s.icon}</div>
              <div className="text-2xl font-bold text-rose-500">{s.value}</div>
              <div className="text-xs text-gray-400 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Scene filter tabs */}
        <div className="flex gap-2 flex-wrap">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-rose-400 to-pink-500 text-white shadow-[0_2px_10px_rgba(244,63,94,0.25)]'
                  : 'bg-white border border-pink-100 text-gray-500 hover:border-rose-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Line chart */}
        <div className="bg-white/80 backdrop-blur-xl border border-pink-100 rounded-2xl p-6 shadow-[0_4px_24px_rgba(244,114,182,0.07)]">
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
          <div className="bg-white/80 backdrop-blur-xl border border-pink-100 rounded-2xl p-8 shadow-[0_4px_24px_rgba(244,114,182,0.07)] text-center text-gray-400 text-sm">
            No sessions yet. Start practicing to see your history!
          </div>
        ) : (
          <div className="bg-white/80 backdrop-blur-xl border border-pink-100 rounded-2xl shadow-[0_4px_24px_rgba(244,114,182,0.07)] overflow-hidden">
            {filtered.map((item, i) => (
              <div
                key={item.session_id}
                className={`px-6 py-4 flex items-center gap-4 ${
                  i < filtered.length - 1 ? 'border-b border-pink-100/60' : ''
                }`}
              >
                <div className="text-2xl flex-shrink-0">
                  {SCENE_ICONS[item.scene] ?? '📝'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-medium text-gray-800 capitalize">
                      {item.scene.replace(/_/g, ' ')}
                    </span>
                    {i === 0 && (
                      <span className="px-2 py-0.5 bg-rose-50 text-rose-500 border border-rose-200 text-xs font-semibold rounded-full">
                        Latest
                      </span>
                    )}
                  </div>
                  {item.topic && (
                    <p className="text-xs text-rose-400 font-medium truncate">
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
                    <p className="text-sm font-bold text-rose-500">
                      {Math.round(item.overall_score)}
                    </p>
                  </div>
                  {item.clarity_score != null && (
                    <div className="hidden sm:block">
                      <p className="text-xs text-gray-400">Clarity</p>
                      <p className="text-sm font-bold text-rose-400">
                        {Math.round(item.clarity_score)}
                      </p>
                    </div>
                  )}
                  {item.structure_score != null && (
                    <div className="hidden sm:block">
                      <p className="text-xs text-gray-400">Structure</p>
                      <p className="text-sm font-bold text-pink-400">
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
        <div className="text-center py-2 flex items-center justify-center gap-4">
          <Link
            href="/vocabulary"
            className="text-rose-400 hover:text-rose-500 text-sm font-medium transition-colors"
          >
            📒 My Vocabulary
          </Link>
          <Link
            href="/"
            className="text-rose-400 hover:text-rose-500 text-sm font-medium transition-colors"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </main>
  )
}
