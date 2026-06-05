// file: src/app/practice/[scene]/page.tsx — TASK-013
// owner: Frontend Engineer
// version: 1.0
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
  interview: '💼 Job Interview',
  restaurant: '🍽️ Restaurant',
  meeting: '📊 Business Meeting',
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

  const wsRef = useRef<WebSocket | null>(null)
  const recognitionRef = useRef<any>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Pre-load speech synthesis voices so they're ready on first use
  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.getVoices()
      window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices()
    }
  }, [])

  // Connect WebSocket and load initial session messages
  useEffect(() => {
    if (!sessionId) return

    // Fetch initial messages from session
    fetch(`${API_URL}/api/session/${sessionId}`)
      .then(r => r.json())
      .then((data) => {
        // Backend may return `messages` or `turns` array
        const rawMsgs: Array<{ role: string; content?: string; text?: string }> =
          data.messages ?? data.turns ?? []
        const initialMsgs: ChatMessage[] = rawMsgs.map((m) => ({
          role: m.role === 'assistant' || m.role === 'ai' ? 'ai' : 'user',
          text: m.content ?? m.text ?? '',
        }))
        if (initialMsgs.length > 0) setMessages(initialMsgs)
      })
      .catch(() => {})

    // Open WebSocket
    const ws = new WebSocket(`${WS_URL}/ws/${sessionId}`)
    wsRef.current = ws

    ws.onopen = () => {
      setWsStatus('connected')
      setStatusText('Click mic to speak')
    }
    ws.onclose = () => {
      setWsStatus('disconnected')
      setStatusText('Disconnected from server')
    }
    ws.onerror = () => {
      setWsStatus('disconnected')
      setStatusText('Connection error — check backend')
    }
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
            utt.lang = 'en-US'
            utt.rate = 0.9
            utt.pitch = 1.0
            // Pick the best available US English voice (prefer Google US English)
            const voices = window.speechSynthesis.getVoices()
            const preferred = voices.find(v => v.name === 'Google US English')
              || voices.find(v => v.lang === 'en-US' && v.name.toLowerCase().includes('google'))
              || voices.find(v => v.lang === 'en-US' && !v.name.toLowerCase().includes('zira'))
              || voices.find(v => v.lang === 'en-US')
            if (preferred) utt.voice = preferred
            utt.onend = () => {
              setIsSpeaking(false)
              setStatusText('Click mic to speak')
            }
            utt.onerror = () => {
              setIsSpeaking(false)
              setStatusText('Click mic to speak')
            }
            setIsSpeaking(true)
            setStatusText('AI is speaking...')
            window.speechSynthesis.speak(utt)
          } else {
            setStatusText('Click mic to speak')
          }
        } else if (data.type === 'greeting') {
          if (data.has_memory) {
            setHasMemory(true)
            setMemoryGreeting(data.ai_text ?? '')
          }
          if (data.ai_text) {
            setMessages((prev) => [...prev, { role: 'ai', text: data.ai_text }])
          }
          if (data.ai_text && typeof window !== 'undefined' && window.speechSynthesis) {
            window.speechSynthesis.cancel()
            const utt = new SpeechSynthesisUtterance(data.ai_text)
            utt.lang = 'en-US'
            utt.rate = 0.92
            window.speechSynthesis.speak(utt)
          }
          setStatusText('Click mic to speak')
        } else if (data.type === 'error') {
          setIsWaiting(false)
          setStatusText(`Server error: ${data.message}`)
        }
      } catch {
        // Ignore malformed messages
      }
    }

    return () => {
      ws.close()
      if (typeof window !== 'undefined') window.speechSynthesis?.cancel()
    }
  }, [sessionId])

  // Toggle mic — starts/stops SpeechRecognition
  const handleMicClick = useCallback(() => {
    if (isListening) {
      recognitionRef.current?.stop()
      return
    }

    if (typeof window === 'undefined') return
    const SpeechRecognitionAPI: any =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

    if (!SpeechRecognitionAPI) {
      setStatusText('Speech recognition not supported — please use Chrome')
      return
    }

    const recognition: any = new SpeechRecognitionAPI()
    recognition.lang = 'en-US'
    recognition.continuous = false
    recognition.interimResults = false
    recognitionRef.current = recognition

    // Accumulate transcript across multiple onresult firings (Chrome behaviour)
    let accumulatedText = ''

    recognition.onstart = () => {
      accumulatedText = ''
      setIsListening(true)
      setStatusText('Listening… (click to stop)')
    }
    recognition.onend = () => {
      setIsListening(false)
      const text = accumulatedText.trim()
      accumulatedText = ''
      if (!text) return
      // Reject non-English input (CJK characters)
      if (/[一-鿿぀-ヿ가-힯]/.test(text)) {
        setStatusText('Please speak in English 🇬🇧')
        return
      }
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'user_message', text }))
        setIsWaiting(true)
        setStatusText('Waiting for AI...')
      } else {
        setStatusText('WebSocket not connected')
      }
    }
    recognition.onerror = (e: any) => {
      setIsListening(false)
      accumulatedText = ''
      if (e.error !== 'no-speech') setStatusText(`Recognition error: ${e.error}`)
    }
    recognition.onresult = (e: any) => {
      // Collect all final results — Chrome may fire this multiple times
      let text = ''
      for (let i = 0; i < e.results.length; i++) {
        if (e.results[i].isFinal) {
          text += e.results[i][0].transcript
        }
      }
      accumulatedText = text
    }

    try {
      recognition.start()
    } catch {
      setStatusText('Could not start recognition')
    }
  }, [isListening])

  const handleEndPractice = async () => {
    if (isEnding) return
    setIsEnding(true)
    try {
      await fetch(`${API_URL}/api/session/${sessionId}/end`, { method: 'POST' })
    } catch {
      // Continue to report even if end request fails
    }
    router.push(`/report/${sessionId}`)
  }

  if (!sessionId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-red-500 text-sm font-semibold">Invalid session</p>
          <Link href="/" className="text-indigo-600 hover:underline text-sm">
            ← Back to Home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      {/* ── Header ────────────────────────────────── */}
      <header className="bg-white border-b shadow-sm px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold text-gray-900">
            {SCENE_LABELS[scene] ?? scene}
          </h1>
          <div className="flex items-center gap-1.5">
            <div
              className={`w-2 h-2 rounded-full ${
                wsStatus === 'connected'
                  ? 'bg-green-400'
                  : wsStatus === 'connecting'
                  ? 'bg-yellow-400 animate-pulse'
                  : 'bg-red-400'
              }`}
            />
            <span className="text-xs text-gray-400 capitalize">{wsStatus}</span>
          </div>
        </div>
        <button
          onClick={handleEndPractice}
          disabled={isEnding}
          className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50"
        >
          {isEnding ? 'Ending…' : 'End Practice'}
        </button>
      </header>

      {/* ── Memory banner ─────────────────────────── */}
      {hasMemory && (
        <div className="bg-indigo-50 border-b border-indigo-100 px-6 py-2 flex items-center gap-2 text-sm text-indigo-700">
          <span>🧠</span>
          <span>AI remembered your last session and will focus on your weak areas today</span>
          <button
            onClick={() => setHasMemory(false)}
            className="ml-auto text-indigo-400 hover:text-indigo-600"
          >
            ✕
          </button>
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
                <div
                  key={idx}
                  className={`flex items-end gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'ai' && (
                    <div className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      AI
                    </div>
                  )}
                  <div
                    className={`max-w-xs lg:max-w-sm px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                      msg.role === 'ai'
                        ? 'bg-blue-500 text-white rounded-bl-sm'
                        : 'bg-green-500 text-white rounded-br-sm'
                    }`}
                  >
                    {msg.text}
                  </div>
                  {msg.role === 'user' && (
                    <div className="w-7 h-7 rounded-full bg-green-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      Me
                    </div>
                  )}
                </div>
              ))
            )}
            {isWaiting && (
              <div className="flex items-end gap-2 justify-start">
                <div className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  AI
                </div>
                <div className="bg-blue-500 px-4 py-3 rounded-2xl rounded-bl-sm flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Mic button */}
          <div className="border-t bg-white p-5 flex flex-col items-center gap-2">
            <button
              onClick={handleMicClick}
              disabled={wsStatus !== 'connected' || isSpeaking || isWaiting}
              aria-label={isListening ? 'Stop recording' : 'Start recording'}
              className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl transition-all duration-150 shadow-md focus:outline-none focus:ring-4 focus:ring-offset-2 ${
                isListening
                  ? 'bg-red-500 hover:bg-red-600 focus:ring-red-300 scale-110 animate-pulse'
                  : wsStatus !== 'connected' || isSpeaking || isWaiting
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-300 hover:scale-105'
              }`}
            >
              🎤
            </button>
            <p className="text-xs text-gray-400 text-center">{statusText}</p>
          </div>
        </div>

        {/* Right: Correction panel */}
        <div className="w-72 border-l bg-white flex flex-col flex-shrink-0">
          <div className="px-4 py-3 border-b">
            <h2 className="text-sm font-semibold text-gray-600">Grammar Check</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {correction && correction.has_error ? (
              <div className="space-y-3">
                <div className="rounded-xl bg-red-50 border border-red-200 p-3">
                  <p className="text-xs font-semibold text-red-400 uppercase tracking-wide mb-1.5">
                    Original
                  </p>
                  <p className="text-sm text-red-700">&ldquo;{correction.original}&rdquo;</p>
                </div>
                <div className="text-center text-gray-300 text-xl">↓</div>
                <div className="rounded-xl bg-green-50 border border-green-200 p-3">
                  <p className="text-xs font-semibold text-green-500 uppercase tracking-wide mb-1.5">
                    Corrected
                  </p>
                  <p className="text-sm text-green-700 font-medium">
                    &ldquo;{correction.corrected}&rdquo;
                  </p>
                </div>
                <div className="rounded-xl bg-amber-50 border border-amber-200 p-3">
                  <p className="text-xs font-semibold text-amber-500 uppercase tracking-wide mb-1.5">
                    Explanation
                  </p>
                  <p className="text-sm text-amber-800 leading-relaxed">{correction.explanation}</p>
                </div>
                {correction.error_type && (
                  <span className="inline-block px-2.5 py-1 bg-indigo-100 text-indigo-600 text-xs font-medium rounded-full capitalize">
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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
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
