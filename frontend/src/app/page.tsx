// file: src/app/page.tsx — TASK-035 sidebar layout + real glassmorphism
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { SignInButton, UserButton, useAuth } from '@clerk/nextjs'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

const SCENES = [
  {
    id: 'interview',
    icon: '💼',
    title: 'Job Interview',
    desc: 'Practice with a professional HR interviewer. Get grilled on your experience, strengths, and situational questions.',
    tips: ['Use STAR method for behavioral questions', 'Speak at a steady pace', 'Ask thoughtful questions at the end'],
  },
  {
    id: 'restaurant',
    icon: '🍽️',
    title: 'Restaurant',
    desc: 'Order food and have natural conversations with a friendly English-speaking waiter.',
    tips: ['Practice polite requests', 'Learn food vocabulary', 'Handle dietary restrictions'],
  },
  {
    id: 'meeting',
    icon: '📊',
    title: 'Business Meeting',
    desc: 'Discuss project updates, share ideas, and present your views confidently in a team meeting.',
    tips: ['Use transition phrases', 'Practice interrupting politely', 'Summarize action items'],
  },
  {
    id: 'hospital',
    icon: '🏥',
    title: 'Hospital Visit',
    desc: 'Describe your symptoms, ask the doctor questions, and understand medical instructions in English.',
    tips: ['Describe symptoms precisely', 'Ask about side effects', 'Confirm follow-up steps'],
  },
  {
    id: 'phone_call',
    icon: '📞',
    title: 'Phone Call',
    desc: 'Handle business or personal calls with confidence — without seeing the other person.',
    tips: ['Speak clearly and slowly', 'Confirm spellings phonetically', 'Practice hold phrases'],
  },
  {
    id: 'customer_service',
    icon: '🎧',
    title: 'Customer Service',
    desc: 'Resolve complaints, answer questions, and de-escalate difficult situations professionally.',
    tips: ['Empathize before solving', 'Use solution-focused language', 'Stay calm under pressure'],
  },
]

const HOW_TO_USE = [
  { icon: '🎭', title: 'Pick a Scene', desc: 'Choose a real-world scenario from the left panel.' },
  { icon: '🎤', title: 'Speak Freely', desc: 'Click the mic and talk naturally — no scripts needed.' },
  { icon: '🤖', title: 'AI Responds', desc: 'Your AI partner replies and gently corrects mistakes.' },
  { icon: '📊', title: 'Get Your Report', desc: 'Review your score, fluency, and vocabulary after each session.' },
]

export default function HomePage() {
  const router = useRouter()
  const { isSignedIn } = useAuth()
  const [selected, setSelected] = useState(SCENES[0])
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleStart() {
    if (loading) return
    setLoading(true)
    setError('')
    const controller = new AbortController()
    const tid = setTimeout(() => controller.abort(), 6000)
    try {
      const res = await fetch(`${API_URL}/api/session/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scene: selected.id, difficulty }),
        signal: controller.signal,
      })
      clearTimeout(tid)
      if (!res.ok) throw new Error(`Server error ${res.status}`)
      const data = await res.json()
      if (!data.session_id) throw new Error('No session ID')
      router.push(`/practice/${selected.id}?session_id=${data.session_id}`)
    } catch (err) {
      clearTimeout(tid)
      setError(err instanceof Error && err.name === 'AbortError' ? 'Connection timed out.' : 'Could not reach server.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen">

      {/* ── Rich background for real glassmorphism ── */}
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[#fdf8fb]">
        <div className="absolute -top-40 left-1/4   w-[700px] h-[700px] rounded-full bg-pink-300/20  blur-[160px]" />
        <div className="absolute bottom-0  right-1/4  w-[650px] h-[650px] rounded-full bg-rose-300/15  blur-[150px]" />
        <div className="absolute top-1/3  -right-32   w-[500px] h-[500px] rounded-full bg-purple-300/20 blur-[130px]" />
        <div className="absolute top-1/4  -left-32    w-[450px] h-[450px] rounded-full bg-pink-300/25  blur-[120px]" />
        <div className="absolute bottom-1/4 left-1/2  w-[300px] h-[300px] rounded-full bg-rose-300/15  blur-[100px]" />
      </div>

      {/* ── Sticky glass header ── */}
      <header className="sticky top-0 z-20 bg-white/12 backdrop-blur-2xl border-b border-white/30">
        <div className="max-w-6xl mx-auto px-6 py-3.5 flex items-center gap-3">
          <span className="text-2xl">🎙️</span>
          <span className="text-lg font-bold bg-gradient-to-r from-rose-500 to-pink-500 bg-clip-text text-transparent">
            AI English Coach
          </span>
          <div className="ml-auto flex items-center gap-4">
            <Link href="/history"
              className="text-sm text-gray-500 hover:text-rose-500 transition-colors">
              History
            </Link>
            {isSignedIn && (
              <Link href="/settings" className="text-sm text-gray-500 hover:text-rose-500 transition-colors">
                Pro
              </Link>
            )}
            <Link href="/assessment"
              className="text-sm bg-white/30 backdrop-blur-xl border border-white/50 text-rose-500 font-medium px-4 py-1.5 rounded-full hover:bg-white/50 transition-all">
              📊 Speaking Test
            </Link>
            {!isSignedIn && (
              <SignInButton mode="modal">
                <button className="text-sm bg-white/30 backdrop-blur-xl border border-white/50 text-rose-500 font-medium px-4 py-1.5 rounded-full hover:bg-white/50 transition-all">
                  登录
                </button>
              </SignInButton>
            )}
            {isSignedIn && (
              <UserButton appearance={{ elements: { avatarBox: 'w-8 h-8' } }} />
            )}
          </div>
        </div>
      </header>

      {/* ── Main two-column layout ── */}
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-8 flex flex-col md:flex-row gap-5 items-start">

        {/* ── Left sidebar ── */}
        <aside className="w-full md:w-56 shrink-0 md:sticky md:top-24">
          <nav className="bg-white/22 backdrop-blur-2xl border border-white/40 rounded-2xl overflow-hidden
            shadow-[0_8px_32px_rgba(236,72,153,0.10),inset_0_1px_0_rgba(255,255,255,0.55)]">

            <div className="p-2 pt-3">
              <p className="text-[10px] font-semibold text-rose-400/80 uppercase tracking-widest px-3 mb-1">
                Practice
              </p>
              {SCENES.map(scene => {
                const active = selected.id === scene.id
                return (
                  <button key={scene.id}
                    onClick={() => setSelected(scene)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all duration-200 ${
                      active
                        ? 'bg-gradient-to-r from-rose-400/20 to-pink-400/20 border border-rose-300/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]'
                        : 'hover:bg-white/30 border border-transparent'
                    }`}>
                    <span className="text-[18px] leading-none">{scene.icon}</span>
                    <span className={`text-sm font-medium truncate ${active ? 'text-rose-600' : 'text-gray-600'}`}>
                      {scene.title}
                    </span>
                  </button>
                )
              })}
            </div>

            <div className="mx-3 border-t border-white/40 my-1.5" />

            <div className="p-2 pb-3">
              <p className="text-[10px] font-semibold text-rose-400/80 uppercase tracking-widest px-3 mb-1">
                Special
              </p>
              <Link href="/sde-interview"
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-white/30 border border-transparent transition-all duration-200 group">
                <span className="text-[18px] leading-none">🧑‍💻</span>
                <span className="text-sm font-medium text-gray-600 group-hover:text-rose-500 transition-colors">SDE Interview</span>
              </Link>
              <Link href="/assessment"
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-white/30 border border-transparent transition-all duration-200 group">
                <span className="text-[18px] leading-none">📊</span>
                <span className="text-sm font-medium text-gray-600 group-hover:text-rose-500 transition-colors">Speaking Test</span>
              </Link>
              <Link href="/history"
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-white/30 border border-transparent transition-all duration-200 group">
                <span className="text-[18px] leading-none">📈</span>
                <span className="text-sm font-medium text-gray-600 group-hover:text-rose-500 transition-colors">My History</span>
              </Link>
            </div>
          </nav>
        </aside>

        {/* ── Right content area ── */}
        <div className="flex-1 space-y-4">

          {/* Scene hero */}
          <div className="bg-white/22 backdrop-blur-2xl border border-white/40 rounded-2xl p-8
            shadow-[0_8px_32px_rgba(236,72,153,0.10),inset_0_1px_0_rgba(255,255,255,0.55)]">
            <div className="flex items-start gap-6">
              <div className="text-6xl leading-none shrink-0">{selected.icon}</div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-2xl font-bold text-gray-800">{selected.title}</h2>
                  <span className="text-xs bg-rose-400/15 border border-rose-300/40 text-rose-500 px-2.5 py-0.5 rounded-full font-medium">
                    AI Role-play
                  </span>
                </div>
                <p className="text-gray-500 leading-relaxed mb-5">{selected.desc}</p>
                <div className="flex flex-wrap gap-2">
                  {selected.tips.map((tip, i) => (
                    <span key={i}
                      className="text-xs bg-white/40 border border-white/60 text-gray-500 px-3 py-1 rounded-full">
                      ✦ {tip}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Difficulty + Start */}
          <div className="bg-white/22 backdrop-blur-2xl border border-white/40 rounded-2xl p-6
            shadow-[0_8px_32px_rgba(236,72,153,0.10),inset_0_1px_0_rgba(255,255,255,0.55)]">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-600 mb-2.5">Difficulty</p>
                <div className="flex gap-2">
                  {(['easy', 'medium', 'hard'] as const).map(d => (
                    <button key={d} onClick={() => setDifficulty(d)}
                      className={`px-3.5 py-1.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                        difficulty === d
                          ? 'bg-gradient-to-r from-rose-400 to-pink-500 text-white shadow-[0_4px_16px_rgba(244,63,94,0.30)]'
                          : 'bg-white/40 border border-white/60 text-gray-500 hover:bg-white/60'
                      }`}>
                      {d === 'easy' ? '🌸 Beginner' : d === 'medium' ? '🌺 Intermediate' : '🔥 Advanced'}
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={handleStart} disabled={loading}
                className="sm:self-end px-7 py-3 rounded-xl font-semibold text-white text-sm
                bg-gradient-to-r from-rose-400 to-pink-500
                shadow-[0_4px_20px_rgba(244,63,94,0.35)] hover:shadow-[0_6px_28px_rgba(244,63,94,0.45)]
                hover:scale-[1.02] transition-all duration-200 disabled:opacity-60 whitespace-nowrap">
                {loading ? 'Starting...' : `Start →`}
              </button>
            </div>
            {error && <p className="text-rose-400 text-sm mt-3">{error}</p>}
          </div>

          {/* How it works */}
          <div className="bg-white/22 backdrop-blur-2xl border border-white/40 rounded-2xl p-6
            shadow-[0_8px_32px_rgba(236,72,153,0.10),inset_0_1px_0_rgba(255,255,255,0.55)]">
            <p className="text-sm font-semibold text-gray-600 mb-4">How It Works</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {HOW_TO_USE.map((s, i) => (
                <div key={i}
                  className="bg-white/30 border border-white/50 rounded-xl p-4 text-center
                  shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]">
                  <div className="text-2xl mb-2">{s.icon}</div>
                  <p className="text-xs font-semibold text-gray-700 mb-1">{s.title}</p>
                  <p className="text-xs text-gray-400 leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
