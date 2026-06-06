'use client'
import { useEffect, useRef, useState } from 'react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface TooltipData {
  word: string
  phonetic?: string
  partOfSpeech?: string
  definition?: string
  translation?: string
  isPhrase: boolean
}

interface Props {
  children: React.ReactNode
  className?: string
}

function speak(text: string) {
  if (typeof window === 'undefined') return
  window.speechSynthesis.cancel()
  const utt = new SpeechSynthesisUtterance(text)
  utt.lang = 'en-US'; utt.rate = 0.85
  const voices = window.speechSynthesis.getVoices()
  const preferred = voices.find(v => v.name === 'Google US English')
    || voices.find(v => v.lang === 'en-US' && v.name.toLowerCase().includes('google'))
    || voices.find(v => v.lang === 'en-US')
  if (preferred) utt.voice = preferred
  // Chrome bug: cancel() + speak() in same tick can silently fail
  setTimeout(() => window.speechSynthesis.speak(utt), 50)
}

export default function WordTooltip({ children, className }: Props) {
  const [tooltip, setTooltip] = useState<TooltipData | null>(null)
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const [loading, setLoading] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function handleMouseUp(e: MouseEvent) {
      // Clicks inside the tooltip popup must not re-trigger lookup
      if ((e.target as HTMLElement).closest('[data-tooltip-popup]')) return
      const sel = window.getSelection()
      const raw = sel?.toString().trim() ?? ''
      if (!raw || raw.length < 2) { setTooltip(null); return }

      const range = sel?.getRangeAt(0)
      const rect = range?.getBoundingClientRect()
      if (!rect) return
      setPos({ x: rect.left + rect.width / 2, y: rect.top + window.scrollY - 8 })

      const isPhrase = raw.includes(' ')

      if (isPhrase) {
        // Multi-word: translate via backend
        if (raw.split(' ').length > 30) { setTooltip(null); return }
        setLoading(true); setTooltip(null)
        try {
          const res = await fetch(`${API_URL}/api/translate?text=${encodeURIComponent(raw)}`)
          const data = await res.json()
          setTooltip({ word: raw, translation: data.translation, isPhrase: true })
        } catch { setTooltip(null) }
        setLoading(false)
      } else {
        // Single word: dictionary lookup
        const word = raw.toLowerCase()
        if (!/^[a-zA-Z'-]+$/.test(word) || word.length > 30) { setTooltip(null); return }
        setLoading(true); setTooltip(null)
        try {
          const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`)
          if (!res.ok) {
            // fallback: translate single word
            const tr = await fetch(`${API_URL}/api/translate?text=${encodeURIComponent(word)}`)
            const trData = await tr.json()
            setTooltip({ word, translation: trData.translation, isPhrase: false })
          } else {
            const data = await res.json()
            const entry = data[0]
            const meaning = entry.meanings?.[0]
            setTooltip({
              word,
              phonetic: entry.phonetic ?? '',
              partOfSpeech: meaning?.partOfSpeech ?? '',
              definition: meaning?.definitions?.[0]?.definition ?? '',
              isPhrase: false,
            })
          }
        } catch { setTooltip(null) }
        setLoading(false)
      }
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setTooltip(null)
    }

    const el = containerRef.current
    el?.addEventListener('mouseup', handleMouseUp)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      el?.removeEventListener('mouseup', handleMouseUp)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  return (
    <div ref={containerRef} className={className} style={{ position: 'relative' }}>
      {children}
      {(loading || tooltip) && (
        <div
          data-tooltip-popup
          className="fixed z-50"
          style={{ left: pos.x, top: pos.y, transform: 'translate(-50%, -100%)' }}
        >
          <div className="bg-white/95 backdrop-blur-xl border border-white/60 rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] px-4 py-3 min-w-[180px] max-w-[280px]">
            {loading ? (
              <p className="text-xs text-gray-400">Loading...</p>
            ) : tooltip ? (
              <>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="font-semibold text-gray-800 text-sm truncate">{tooltip.word}</span>
                  <button
                    onMouseDown={e => e.stopPropagation()}
                    onMouseUp={e => e.stopPropagation()}
                    onClick={() => speak(tooltip.word)}
                    className="text-rose-400 hover:text-rose-600 text-base shrink-0"
                    title="Play pronunciation"
                  >🔊</button>
                </div>
                {tooltip.phonetic && (
                  <p className="text-rose-400 text-xs font-mono mb-1">{tooltip.phonetic}</p>
                )}
                {tooltip.partOfSpeech && (
                  <p className="text-gray-400 text-xs italic mb-1">{tooltip.partOfSpeech}</p>
                )}
                {tooltip.definition && (
                  <p className="text-xs text-gray-600 leading-relaxed mb-1">{tooltip.definition}</p>
                )}
                {tooltip.translation && (
                  <p className="text-xs text-blue-500 font-medium">{tooltip.translation}</p>
                )}
              </>
            ) : null}
            <div className="absolute left-1/2 -translate-x-1/2 top-full w-2 h-2 bg-white/95 border-r border-b border-white/60 rotate-45 -mt-1" />
          </div>
        </div>
      )}
    </div>
  )
}
