// file: src/app/vocabulary/page.tsx — 生词本（记忆闭环可视化）
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@clerk/nextjs'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface VocabItem {
  word: string
  definition: string
  created_at: string
}

function speak(text: string) {
  if (typeof window === 'undefined') return
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.lang = 'en-US'; u.rate = 0.85
  const voices = window.speechSynthesis.getVoices()
  const preferred = voices.find(v => v.name === 'Google US English') || voices.find(v => v.lang === 'en-US')
  if (preferred) u.voice = preferred
  setTimeout(() => window.speechSynthesis.speak(u), 50)
}

function GlowBg() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 bg-[#f0e0eb]">
      <div className="absolute -top-40 left-1/4   w-[700px] h-[700px] rounded-full bg-pink-400/35  blur-[160px]" />
      <div className="absolute bottom-0  right-1/4  w-[600px] h-[600px] rounded-full bg-rose-400/30  blur-[140px]" />
      <div className="absolute top-1/3  -right-32   w-[500px] h-[500px] rounded-full bg-purple-300/20 blur-[130px]" />
      <div className="absolute top-1/4  -left-32    w-[450px] h-[450px] rounded-full bg-pink-300/25  blur-[120px]" />
    </div>
  )
}

export default function VocabularyPage() {
  const [items, setItems] = useState<VocabItem[]>([])
  const [loading, setLoading] = useState(true)
  const { getToken } = useAuth()

  useEffect(() => {
    (async () => {
      try {
        const token = await getToken()
        const headers: Record<string, string> = {}
        if (token) headers['Authorization'] = `Bearer ${token}`
        const res = await fetch(`${API_URL}/api/vocab`, { headers })
        if (res.ok) setItems(await res.json())
      } catch { /* ignore */ }
      setLoading(false)
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <main className="relative min-h-screen overflow-hidden py-10 px-4">
      <GlowBg />
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-1">📒 My Vocabulary</h1>
          <p className="text-gray-400 text-sm">
            {items.length} word{items.length !== 1 ? 's' : ''} collected · AI 会在后续对话中自然复现
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-rose-100 border-t-rose-400 rounded-full animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-xl border border-pink-100 rounded-2xl p-10 text-center shadow-[0_4px_24px_rgba(244,114,182,0.07)]">
            <div className="text-4xl mb-3">📭</div>
            <p className="text-gray-500 text-sm">还没有收藏生词。</p>
            <p className="text-gray-400 text-xs mt-1">练习时选中 AI 回复里的单词，点 ⭐ 即可收藏。</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {items.map((it, i) => (
              <div key={i} className="bg-white/80 backdrop-blur-xl border border-pink-100 rounded-2xl p-4 shadow-[0_4px_24px_rgba(244,114,182,0.07)]">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-gray-800 truncate">{it.word}</span>
                  <button onClick={() => speak(it.word)} className="text-rose-400 hover:text-rose-600 text-base shrink-0" title="发音">🔊</button>
                </div>
                {it.definition && (
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed line-clamp-2">{it.definition}</p>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="text-center py-2 flex items-center justify-center gap-4">
          <Link href="/history" className="text-rose-400 hover:text-rose-500 text-sm font-medium">📈 Dashboard</Link>
          <Link href="/" className="text-rose-400 hover:text-rose-500 text-sm font-medium">← Back to Home</Link>
        </div>
      </div>
    </main>
  )
}
