// file: src/app/practice/[scene]/page.tsx — TASK-013 / TASK-032
// owner: Frontend Engineer
'use client'

import { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000'

interface ChatMessage {
  role: 'user' | 'ai'
  text: string
}

interface Correction {
  has_error: boolean
  original: string
  corrected: string
  explanation: string
  error_type: string
}

const SCENE_LABELS: Record<string, string> = {
  interview:        '💼 Job Interview',
  restaurant:       '🍽️ Restaurant',
  meeting:          '📊 Business Meeting',
  hospital:         '🏥 Hospital Visit',
  phone_call:       '📞 Phone Call',
  customer_service: '🎧 Customer Service',
  sde_behavioral:   '🗣 Behavioral',
  sde_project:      '💼 Project Deep-Dive',
  sde_thinking:     '🧠 Thinking & CS',
}

// ─── Inner client component that needs useSearchParams ───────────────────────

function PracticeContent({ scene }: { scene: string }) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const sessionId = searchParams.get('session_id') ?? ''

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [correction, setCorrection] = useState<Correction | null>(null)
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isWaiting, setIsWaiting] = useState(false)
  const [wsStatus, setWsStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting')
  const [statusText, setStatusText] = useState('Connecting to server...')
  const [isEnding, setIsEnding] = useState(false)
  const [hasMemory, setHasMemory] = useState(false)
  const [memoryGreeting, setMemoryGreeting] = useState('')
  const [recordingMode, setRecordingMode] = useState<'auto' | 'manual'>('auto')
  const [pendingText, setPendingText] = useState('')
  const [difficulty, setDifficulty] = useState<string>('')

  const wsRef = useRef<WebSocket | null>(null)
  const recognitionRef = useRef<any>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const recordingStartRef = useRef<number>(0)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.getVoices()
      window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices()
    }
  }, [])

  useEffect(() => {
    if (!sessionId) return
    fetch(`${API_URL}/api/session/${sessionId}`)
      .then(r => r.json())
      .then((data) => {
        const rawMsgs: Array<{ role: string; content?: string; text?: string }> = data.messages ?? data.turns ?? []
        const initialMsgs: ChatMessage[] = rawMsgs.map((m) => ({
          role: m.role === 'assistant' || m.role === 'ai' ? 'ai' : 'user',
          text: m.content ?? m.text ?? '',
        }))
        if (initialMsgs.length > 0) setMessages(initialMsgs)
        if (data.difficulty) setDifficulty(data.difficulty)
      })
      .catch(() => {})

    const ws = new WebSocket(`${WS_URL}/ws/${sessionId}`)
    wsRef.current = ws

    ws.onopen = () => { setWsStatus('connected'); setStatusText('Click mic to speak') }
    ws.onclose = () => { setWsStatus('disconnected'); setStatusText('Disconnected from server') }
    ws.onerror = () => { setWsStatus('disconnected'); setStatusText('Connection error — check backend') }
    ws.onmessage = (event) => {
      try {
        const data: any = JSON.parse(event.data)
        if (data.type === 'response') {
          setIsWaiting(false)
          setMessages((prev) => {
            const next = [...prev]
            if (data.user_text) next.push({ role: 'user', text: data.user_text })
            if (data.ai_text) next.push({ role: 'ai', text: data.ai_text })
            return next
          })
          if (data.correction) setCorrection(data.correction)
          if (data.ai_text && typeof window !== 'undefined' && window.speechSynthesis) {
            window.speechSynthesis.cancel()
            const utt = new SpeechSynthesisUtterance(data.ai_text)
            utt.lang = 'en-US'; utt.rate = 0.9; utt.pitch = 1.0
            const voices = window.speechSynthesis.getVoices()
            const preferred = voices.find(v => v.name === 'Google US English')
              || voices.find(v => v.lang === 'en-US' && v.name.toLowerCase().includes('google'))
              || voices.find(v => v.lang === 'en-US' && !v.name.toLowerCase().includes('zira'))
              || voices.find(v => v.lang === 'en-US')
            if (preferred) utt.voice = preferred
            utt.onend = () => { setIsSpeaking(false); setStatusText('Click mic to speak') }
            utt.onerror = () => { setIsSpeaking(false); setStatusText('Click mic to speak') }
            setIsSpeaking(true); setStatusText('AI is speaking...')
            window.speechSynthesis.speak(utt)
          } else {
            setStatusText('Click mic to speak')
          }
        } else if (data.type === 'greeting') {
          if (data.has_memory) { setHasMemory(true); setMemoryGreeting(data.ai_text ?? '') }
          if (data.ai_text) {
            setMessages((prev) => [...prev, { role: 'ai', text: data.ai_text }])
            if (typeof window !== 'undefined' && window.speechSynthesis) {
              window.speechSynthesis.cancel()
              const utt = new SpeechSynthesisUtterance(data.ai_text)
              utt.lang = 'en-US'; utt.rate = 0.92
              window.speechSynthesis.speak(utt)
            }
          }
          setStatusText('Click mic to speak')
        } else if (data.type === 'error') {
          setIsWaiting(false); setStatusText(`Server error: ${data.message}`)
        }
      } catch { /* Ignore malformed messages */ }
    }

    return () => { ws.close(); if (typeof window !== 'undefined') window.speechSynthesis?.cancel() }
  }, [sessionId])

  const sendMessage = useCallback((text: string) => {
    if (wsRef.current?.readyState !== WebSocket.OPEN) { setStatusText('WebSocket not connected'); return }
    wsRef.current.send(JSON.stringify({ type: 'user_message', text, duration_ms: Date.now() - recordingStartRef.current }))
    setIsWaiting(true); setPendingText(''); setStatusText('Waiting for AI...')
  }, [])

  const handleMicClick = useCallback(() => {
    if (isListening) { recognitionRef.current?.stop(); return }
    if (typeof window === 'undefined') return
    const SpeechRecognitionAPI: any = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognitionAPI) { setStatusText('Speech recognition not supported — please use Chrome'); return }
    const recognition: any = new SpeechRecognitionAPI()
    recognition.lang = 'en-US'; recognition.continuous = false; recognition.interimResults = false
    recognitionRef.current = recognition
    let accumulatedText = ''
    recognition.onstart = () => { accumulatedText = ''; recordingStartRef.current = Date.now(); setIsListening(true); setStatusText('Listening… (click to stop)') }
    recognition.onend = () => {
      setIsListening(false)
      const text = accumulatedText.trim(); accumulatedText = ''
      if (!text) return
      if (/[一-鿿぀-ヿ가-힯]/.test(text)) { setStatusText('Please speak in English 🇬🇧'); return }
      if (recordingMode === 'manual') { setPendingText(text); setStatusText('Review your message, then click Send ✉️'); return }
      sendMessage(text)
    }
    recognition.onerror = (e: any) => { setIsListening(false); accumulatedText = ''; if (e.error !== 'no-speech') setStatusText(`Recognition error: ${e.error}`) }
    recognition.onresult = (e: any) => {
      let text = ''
      for (let i = 0; i < e.results.length; i++) { if (e.results[i].isFinal) text += e.results[i][0].transcript }
      accumulatedText = text
    }
    try { recognition.start() } catch { setStatusText('Could not start recognition') }
  }, [isListening, recordingMode, sendMessage])

  const handleEndPractice = async () => {
    if (isEnding) return
    setIsEnding(true)
    try { await fetch(`${API_URL}/api/session/${sessionId}/end`, { method: 'POST' }) } catch { /* Continue even if end fails */ }
    router.push(`/report/${sessionId}`)
  }

  if (!sessionId) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-[#f0e0eb] flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-rose-500 text-sm font-semibold">Invalid session</p>
          <Link href="/" className="text-rose-400 hover:text-rose-500 text-sm">← Back to Home</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* 环境光晕 */}
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[#f0e0eb]">
        <div className="absolute -top-40 left-1/4   w-[700px] h-[700px] rounded-full bg-pink-400/35  blur-[160px]" />
        <div className="absolute bottom-0  right-1/4  w-[600px] h-[600px] rounded-full bg-rose-400/30  blur-[140px]" />
        <div className="absolute top-1/3  -right-32   w-[500px] h-[500px] rounded-full bg-purple-300/20 blur-[130px]" />
        <div className="absolute top-1/4  -left-32    w-[450px] h-[450px] rounded-full bg-pink-300/25  blur-[120px]" />
      </div>

      {/* ── Header ────────────────────────────────── */}
      <header className="bg-white/15 backdrop-blur-2xl border-b border-white/30 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center gap-3">
          <Link href="/" className="text-gray-400 hover:text-rose-400 transition-colors text-sm">← Home</Link>
          <span className="text-pink-200">|</span>
          <span className="text-gray-700 font-medium text-sm">{SCENE_LABELS[scene] ?? scene}</span>
          {difficulty && (
            <span className="bg-rose-50 text-rose-500 border border-rose-200 rounded-full px-3 py-0.5 text-xs font-medium">
              {difficulty === 'easy' ? 'Beginner' : difficulty === 'hard' ? 'Advanced' : 'Intermediate'}
            </span>
          )}
          <div className="flex items-center gap-1.5 ml-1">
            <div className={`w-2 h-2 rounded-full ${wsStatus === 'connected' ? 'bg-green-400' : wsStatus === 'connecting' ? 'bg-yellow-400 animate-pulse' : 'bg-red-400'}`} />
            <span className="text-xs text-gray-400 capitalize">{wsStatus}</span>
          </div>
          <button
            onClick={handleEndPractice}
            disabled={isEnding}
            className="ml-auto px-4 py-1.5 border border-rose-200 text-rose-500 bg-white hover:bg-rose-50 text-sm font-medium rounded-xl transition-all duration-200 disabled:opacity-50"
          >
            {isEnding ? 'Ending…' : 'End Practice'}
          </button>
        </div>
      </header>

      {/* ── Memory banner ─────────────────────────── */}
      {hasMemory && (
        <div className="bg-rose-50 border-b border-rose-100 px-6 py-2 flex items-center gap-2 text-sm text-rose-500">
          <span>🧠</span>
          <span>AI remembered your last session and will focus on your weak areas today</span>
          <button onClick={() => setHasMemory(false)} className="ml-auto text-rose-300 hover:text-rose-500">✕</button>
        </div>
      )}

      {/* ── Body ──────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Chat bubbles */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-gray-400">
                  <div className="text-5xl mb-3">🎤</div>
                  <p className="text-sm">Click the microphone to start speaking</p>
                </div>
              </div>
            ) : (
              messages.map((msg, idx) => (
                <div key={idx} className={`flex items-end gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'ai' && (
                    <div className="w-7 h-7 rounded-full bg-gradient-to-r from-rose-400 to-pink-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">AI</div>
                  )}
                  <div className={`max-w-xs lg:max-w-sm px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'ai'
                      ? 'bg-white/90 border border-pink-100 text-gray-700 rounded-bl-sm shadow-[0_2px_8px_rgba(244,114,182,0.08)]'
                      : 'bg-gradient-to-r from-rose-400 to-pink-500 text-white rounded-br-sm shadow-[0_2px_12px_rgba(244,63,94,0.2)]'
                  }`}>
                    {msg.text}
                  </div>
                  {msg.role === 'user' && (
                    <div className="w-7 h-7 rounded-full bg-gradient-to-r from-rose-400 to-pink-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">Me</div>
                  )}
                </div>
              ))
            )}
            {isWaiting && (
              <div className="flex items-end gap-2 justify-start">
                <div className="w-7 h-7 rounded-full bg-gradient-to-r from-rose-400 to-pink-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">AI</div>
                <div className="bg-white/90 border border-pink-100 px-4 py-3 rounded-2xl rounded-bl-sm flex items-center gap-1.5 shadow-[0_2px_8px_rgba(244,114,182,0.08)]">
                  <span className="w-1.5 h-1.5 bg-rose-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-rose-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-rose-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Mic button area */}
          <div className="border-t border-white/40 bg-white/22 backdrop-blur-2xl p-5 flex flex-col items-center gap-2">
            {/* Recording mode toggle */}
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <button
                onClick={() => setRecordingMode('auto')}
                className={`px-2 py-1 rounded ${recordingMode === 'auto' ? 'bg-rose-50 text-rose-500 font-semibold border border-rose-200' : 'hover:bg-gray-50'}`}
              >Auto</button>
              <span>/</span>
              <button
                onClick={() => setRecordingMode('manual')}
                className={`px-2 py-1 rounded ${recordingMode === 'manual' ? 'bg-rose-50 text-rose-500 font-semibold border border-rose-200' : 'hover:bg-gray-50'}`}
              >Manual</button>
            </div>

            {/* Mic button with sound-wave rings */}
            <div className="relative flex items-center justify-center">
              {isListening && (
                <>
                  <span className="absolute w-16 h-16 rounded-full bg-rose-300/50 animate-ping" />
                  <span className="absolute w-20 h-20 rounded-full bg-rose-200/30 animate-ping" style={{ animationDelay: '0.3s' }} />
                </>
              )}
              <button
                onClick={handleMicClick}
                disabled={wsStatus !== 'connected' || isSpeaking || isWaiting}
                aria-label={isListening ? 'Stop recording' : 'Start recording'}
                className={`relative z-10 w-14 h-14 rounded-full flex items-center justify-center text-2xl transition-all duration-200 ${
                  isListening
                    ? 'bg-gradient-to-r from-rose-400 to-pink-500 shadow-[0_0_32px_rgba(244,63,94,0.45)] scale-110'
                    : wsStatus !== 'connected' || isSpeaking || isWaiting
                    ? 'bg-gray-100 text-gray-300 cursor-not-allowed border border-gray-200'
                    : 'bg-white border-2 border-rose-200 text-rose-400 hover:border-rose-300 shadow-[0_4px_16px_rgba(244,114,182,0.15)]'
                }`}
              >
                🎤
              </button>
            </div>

            {/* Pending message + Send button (manual mode) */}
            {pendingText && recordingMode === 'manual' && (
              <div className="flex items-center gap-2 max-w-xs w-full mt-1">
                <p className="text-xs text-gray-600 flex-1 truncate bg-rose-50 rounded-lg px-3 py-1.5 border border-rose-100">
                  {pendingText}
                </p>
                <button
                  onClick={() => sendMessage(pendingText)}
                  className="px-3 py-1.5 bg-gradient-to-r from-rose-400 to-pink-500 text-white text-xs font-semibold rounded-lg shadow-[0_2px_8px_rgba(244,63,94,0.2)] whitespace-nowrap"
                >
                  Send ✉️
                </button>
              </div>
            )}

            <p className="text-xs text-gray-400 text-center">{statusText}</p>

            {/* Hint button */}
            {wsStatus === 'connected' && !isListening && !isWaiting && (
              <button
                onClick={() => {
                  if (wsRef.current?.readyState === WebSocket.OPEN) {
                    wsRef.current.send(JSON.stringify({
                      type: 'user_message',
                      text: "[HINT REQUEST] I'm not sure what to say next. Please give me a simple hint or a starter phrase I can use.",
                      duration_ms: 0,
                    }))
                    setIsWaiting(true); setStatusText('Getting hint...')
                  }
                }}
                className="text-xs text-rose-400 hover:text-rose-500 underline mt-1"
              >
                💡 Need a hint?
              </button>
            )}
          </div>
        </div>

        {/* Right: Correction panel */}
        <div className="w-72 border-l border-pink-100 bg-white/70 backdrop-blur-xl flex flex-col flex-shrink-0">
          <div className="px-4 py-3 border-b border-pink-100">
            <h2 className="text-sm font-semibold text-gray-600">Grammar Check</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {correction && correction.has_error ? (
              <div className="space-y-3">
                <div className="bg-rose-50 border border-rose-100 rounded-xl p-3">
                  <p className="text-xs font-semibold text-rose-400 uppercase tracking-wide mb-1.5">Original</p>
                  <p className="text-sm text-gray-600">&ldquo;{correction.original}&rdquo;</p>
                </div>
                <div className="text-center text-rose-200 text-xl">↓</div>
                <div className="bg-green-50 border border-green-100 rounded-xl p-3">
                  <p className="text-xs font-semibold text-green-500 uppercase tracking-wide mb-1.5">Corrected</p>
                  <p className="text-sm text-gray-700 font-medium">&ldquo;{correction.corrected}&rdquo;</p>
                </div>
                <div className="bg-white border border-pink-100 rounded-xl p-3">
                  <p className="text-xs font-semibold text-rose-400 uppercase tracking-wide mb-1.5">Explanation</p>
                  <p className="text-sm text-gray-600 leading-relaxed">{correction.explanation}</p>
                </div>
                {correction.error_type && (
                  <span className="inline-block bg-rose-50 text-rose-500 border border-rose-200 rounded-full px-2.5 py-1 text-xs font-medium capitalize">
                    {correction.error_type}
                  </span>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-36 text-gray-300">
                <div className="text-4xl mb-2">✓</div>
                <p className="text-sm text-gray-400">No errors detected</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Loading fallback ──────────────────────────────────────────────────────────

function LoadingSpinner() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f0e0eb] flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-rose-100 border-t-rose-400 rounded-full animate-spin" />
    </div>
  )
}

// ─── Page export (wraps with Suspense for useSearchParams) ────────────────────

export default function PracticePage({ params }: { params: { scene: string } }) {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <PracticeContent scene={params.scene} />
    </Suspense>
  )
}
