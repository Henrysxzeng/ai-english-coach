'use client'
import { useEffect, useState } from 'react'

const THEMES = [
  { id: 'rose', label: '玫瑰', color: '#fb7185' },
  { id: 'blue', label: '天蓝', color: '#60a5fa' },
]

function apply(id: string) {
  if (id === 'rose') delete document.documentElement.dataset.theme
  else document.documentElement.dataset.theme = id
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState('rose')

  useEffect(() => {
    const t = localStorage.getItem('theme') || 'rose'
    setTheme(t)
    apply(t)
  }, [])

  function pick(id: string) {
    setTheme(id)
    localStorage.setItem('theme', id)
    apply(id)
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-1.5 bg-white/85 backdrop-blur border border-gray-200 rounded-full px-2.5 py-1.5 shadow-[0_4px_16px_rgba(0,0,0,0.12)]">
      <span className="text-xs text-gray-400 mr-0.5">主题</span>
      {THEMES.map(t => (
        <button
          key={t.id}
          onClick={() => pick(t.id)}
          title={t.label}
          aria-label={t.label}
          className={`w-6 h-6 rounded-full transition-transform hover:scale-110 ${theme === t.id ? 'ring-2 ring-offset-1 ring-gray-400' : ''}`}
          style={{ backgroundColor: t.color }}
        />
      ))}
    </div>
  )
}
