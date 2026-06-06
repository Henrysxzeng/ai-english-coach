'use client'
import { useEffect, useRef, useState } from 'react'

interface DictEntry {
  phonetic?: string
  meanings: Array<{
    partOfSpeech: string
    definitions: Array<{ definition: string }>
  }>
}

interface TooltipData {
  word: string
  phonetic: string
  partOfSpeech: string
  definition: string
}

interface Props {
  children: React.ReactNode
  className?: string
}

export default function WordTooltip({ children, className }: Props) {
  const [tooltip, setTooltip] = useState<TooltipData | null>(null)
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const [loading, setLoading] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleMouseUp(e: MouseEvent) {
      const sel = window.getSelection()
      const word = sel?.toString().trim().toLowerCase() ?? ''
      if (!word || word.includes(' ') || word.length < 2 || word.length > 30 || !/^[a-zA-Z'-]+$/.test(word)) {
        setTooltip(null)
        return
      }
      const range = sel?.getRangeAt(0)
      const rect = range?.getBoundingClientRect()
      if (!rect) return
      setPos({ x: rect.left + rect.width / 2, y: rect.top + window.scrollY - 8 })
      setLoading(true)
      setTooltip(null)
      fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`)
        .then(r => r.ok ? r.json() : null)
        .then((data: DictEntry[] | null) => {
          if (!data || !data[0]) { setLoading(false); return }
          const entry = data[0]
          const meaning = entry.meanings?.[0]
          setTooltip({
            word,
            phonetic: entry.phonetic ?? '',
            partOfSpeech: meaning?.partOfSpeech ?? '',
            definition: meaning?.definitions?.[0]?.definition ?? '',
          })
          setLoading(false)
        })
        .catch(() => setLoading(false))
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
          className="fixed z-50 pointer-events-none"
          style={{ left: pos.x, top: pos.y, transform: 'translate(-50%, -100%)' }}
        >
          <div className="bg-white/95 backdrop-blur-xl border border-white/60 rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] px-4 py-3 min-w-[180px] max-w-[260px]">
            {loading ? (
              <p className="text-xs text-gray-400">Looking up...</p>
            ) : tooltip ? (
              <>
                <div className="flex items-baseline gap-2 mb-1 flex-wrap">
                  <span className="font-semibold text-gray-800 text-sm">{tooltip.word}</span>
                  {tooltip.phonetic && (
                    <span className="text-rose-400 text-xs font-mono">{tooltip.phonetic}</span>
                  )}
                  {tooltip.partOfSpeech && (
                    <span className="text-gray-400 text-xs italic">{tooltip.partOfSpeech}</span>
                  )}
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">{tooltip.definition}</p>
              </>
            ) : null}
            <div className="absolute left-1/2 -translate-x-1/2 top-full w-2 h-2 bg-white/95 border-r border-b border-white/60 rotate-45 -mt-1" />
          </div>
        </div>
      )}
    </div>
  )
}
