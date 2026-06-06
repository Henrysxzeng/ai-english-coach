// file: src/app/assessment/page.tsx — TASK-024-FE / TASK-032
// owner: Frontend Engineer
'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000'

interface ChatMessage {
  role: 'user' | 'ai'
  text: string
}

const MAX_TURNS = 5

export default function AssessmentPage() {
  const router = useRouter()
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [turnCount, setTurnCount] = useState(0)
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isWaiting, setIsWaiting] = useState(false)
  const [wsStatus, setWsStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting')
  const [statusText, setStatusText] = useState('Starting assessment...')
  const [isComplete, setIsComplete] = useState(false)
  const [initError, setInitError] = useState<string | null>(null)

  const wsRef = useRef<WebSocket | null>(null)
  const recognitionRef = useRef<any>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const recordingStartRef = useRef<number>(0)
  const isCompleteRef = useRef(false)

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
    fetch(`${API_URL}/api/assessment/start`, { method: 'POST' })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then((data) => {
        if (!data.session_id) throw new Error('No session_id returned')
        setSessionId(data.session_id)
      })
      .catch((e: Error) => {
        setInitError(e.message)
        setStatusText('Failed to start assessment')
      })
  }, [])

  useEffect(() => {
    if (!sessionId) return
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
          setTurnCount((prev) => {
            const next = prev + 1
            if (next >= MAX_TURNS) {
              isCompleteRef.current = true
              setIsComplete(true)
              setStatusText('Assessment complete!')
              setTimeout(() => router.push(`/assessment/result/${sessionId}`), 3000)
            }
            return next
          })
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
            utt.onend = () => { setIsSpeaking(false); if (!isCompleteRef.current) setStatusText('Click mic to speak') }
            utt.onerror = () => setIsSpeaking(false)
            setIsSpeaking(true); setStatusText('AI is speaking...')
            window.speechSynthesis.speak(utt)
          } else {
            if (!isCompleteRef.current) setStatusText('Click mic to speak')
          }
        } else if (data.type === 'greeting') {
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
  }, [sessionId, router])

  const sendMessage = useCallback((text: string) => {
    if (wsRef.current?.readyState !== WebSocket.OPEN) { setStatusText('WebSocket not connected'); return }
    wsRef.current.send(JSON.stringify({ type: 'user_message', text, duration_ms: Date.now() - recordingStartRef.current }))
    setIsWaiting(true); setStatusText('Waiting for AI...')
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
      sendMessage(text)
    }
    recognition.onerror = (e: any) => { setIsListening(false); accumulatedText = ''; if (e.error !== 'no-speech') setStatusText(`Recognition error: ${e.error}`) }
    recognition.onresult = (e: any) => { let text = ''; for (let i = 0; i < e.results.length; i++) { if (e.results[i].isFinal) text += e.results[i][0].transcript } accumulatedText = text }
    try { recognition.start() } catch { setStatusText('Could not start recognition') }
  }, [isListening, sendMessage])

  if (initError) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-[#f0e0eb] flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-rose-500 text-sm font-semibold">Failed to start: {initError}</p>
          <Link href="/" className="text-rose-400 hover:text-rose-500 text-sm">← Back to Home</Link>
        </div>
      </div>
    )
  }

  if (!sessionId) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-[#f0e0eb] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-rose-100 border-t-rose-400 rounded-full animate-spin mx-auto" />
          <p className="text-sm text-gray-400">Preparing your speaking test...</p>
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
          <h1 className="text-base font-semibold text-gray-800">📊 Speaking Test</h1>
          <span className="text-pink-200">|</span>
          <span className="text-sm text-gray-500">Turn {turnCount} of {MAX_TURNS}</span>
          <div className="flex items-center gap-1.5 ml-1">
            <div className={`w-2 h-2 rounded-full ${wsStatus === 'connected' ? 'bg-green-400' : wsStatus === 'connecting' ? 'bg-yellow-400 animate-pulse' : 'bg-red-400'}`} />
            <span className="text-xs text-gray-400 capitalize">{wsStatus}</span>
          </div>
          <div className="ml-auto">
            <Link href="/" className="px-3 py-1.5 border border-rose-200 text-rose-500 bg-white hover:bg-rose-50 rounded-xl text-xs font-medium transition-all duration-200">
              Cancel
            </Link>
          </div>
        </div>
      </header>

      {/* ── Progress bar ──────────────────────────── */}
      <div className="bg-white/70 backdrop-blur-sm border-b border-pink-50 px-6 py-2">
        <div className="flex items-center gap-2 max-w-6xl mx-auto">
          <div className="flex-1 bg-rose-100/50 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-rose-400 to-pink-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${(turnCount / MAX_TURNS) * 100}%` }}
            />
          </div>
          <span className="text-xs text-gray-400 tabular-nums">{turnCount}/{MAX_TURNS}</span>
        </div>
      </div>

      {/* ── Chat area ─────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-gray-400">
                <div className="text-5xl mb-3">🎤</div>
                <p className="text-sm">Click the microphone to begin your speaking test</p>
              </div>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div key={idx} className={`flex items-end gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'ai' && (
                  <div className="w-7 h-7 rounded-full bg-gradient-to-r from-rose-400 to-pink-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    AI
                  </div>
                )}
                <div className={`max-w-xs lg:max-w-sm px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'ai'
                    ? 'bg-white/90 border border-pink-100 text-gray-700 rounded-bl-sm shadow-[0_2px_8px_rgba(244,114,182,0.08)]'
                    : 'bg-gradient-to-r from-rose-400 to-pink-500 text-white rounded-br-sm shadow-[0_2px_12px_rgba(244,63,94,0.2)]'
                }`}>
                  {msg.text}
                </div>
                {msg.role === 'user' && (
                  <div className="w-7 h-7 rounded-full bg-gradient-to-r from-rose-400 to-pink-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    Me
                  </div>
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

        {/* ── Mic area ──────────────────────────────── */}
        <div className="border-t border-pink-100 bg-white/80 backdrop-blur-xl p-5 flex flex-col items-center gap-2">
          <div className="relative flex items-center justify-center">
            {isListening && (
              <>
                <span className="absolute w-16 h-16 rounded-full bg-rose-300/50 animate-ping" />
                <span className="absolute w-20 h-20 rounded-full bg-rose-200/30 animate-ping" style={{ animationDelay: '0.3s' }} />
              </>
            )}
            <button
              onClick={handleMicClick}
              disabled={wsStatus !== 'connected' || isSpeaking || isWaiting || isComplete}
              aria-label={isListening ? 'Stop recording' : 'Start recording'}
              className={`relative z-10 w-14 h-14 rounded-full flex items-center justify-center text-2xl transition-all duration-200 ${
                isListening
                  ? 'bg-gradient-to-r from-rose-400 to-pink-500 shadow-[0_0_32px_rgba(244,63,94,0.45)] scale-110'
                  : wsStatus !== 'connected' || isSpeaking || isWaiting || isComplete
                  ? 'bg-gray-100 text-gray-300 cursor-not-allowed border border-gray-200'
                  : 'bg-white border-2 border-rose-200 text-rose-400 hover:border-rose-300 shadow-[0_4px_16px_rgba(244,114,182,0.15)]'
              }`}
            >
              🎤
            </button>
          </div>
          <p className="text-xs text-gray-400 text-center">{statusText}</p>
        </div>
      </div>

      {/* ── Assessment complete overlay ────────────── */}
      {isComplete && (
        <div className="absolute inset-0 bg-rose-900/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white/90 backdrop-blur-xl border border-pink-100 rounded-2xl p-10 text-center shadow-[0_8px_48px_rgba(244,114,182,0.2)] max-w-sm mx-4">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Assessment Complete!</h2>
            <p className="text-gray-400 text-sm mb-6">Analyzing your responses...</p>
            <div className="w-8 h-8 border-4 border-rose-100 border-t-rose-400 rounded-full animate-spin mx-auto" />
            <p className="text-xs text-gray-400 mt-3">Redirecting in 3 seconds</p>
          </div>
        </div>
      )}
    </div>
  )
}
