// file: src/app/career/page.tsx — 求职英语主线着陆页
'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { SignInButton, UserButton, useAuth } from '@clerk/nextjs'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface ResumeItem {
  id: number
  label: string
  created_at: string
  preview?: string
}

type ResumeTrack = 'sde' | 'ds' | 'pm' | 'proj'
const RESUME_TRACKS: { id: ResumeTrack; label: string }[] = [
  { id: 'sde', label: '💻 SDE' },
  { id: 'ds', label: '📊 Data Scientist' },
  { id: 'pm', label: '📋 Product Manager' },
  { id: 'proj', label: '🗂️ Project Manager' },
]

function ResumeManager({ initialTrack }: { initialTrack: ResumeTrack }) {
  const { getToken } = useAuth()
  const [track, setTrack] = useState<ResumeTrack>(initialTrack)
  const [resumes, setResumes] = useState<ResumeItem[] | null>(null)
  const [activeId, setActiveId] = useState<number | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [previewId, setPreviewId] = useState<number | null>(null)
  const [pasteOpen, setPasteOpen] = useState(false)
  const [pasteLabel, setPasteLabel] = useState('')
  const [pasteText, setPasteText] = useState('')

  async function authHeaders(): Promise<Record<string, string>> {
    const token = await getToken()
    return token ? { Authorization: `Bearer ${token}` } : {}
  }

  async function load() {
    const headers = await authHeaders()
    const res = await fetch(`${API_URL}/api/modules/resumes?track=${track}`, { headers })
    if (res.ok) {
      const data = await res.json()
      setResumes(data.resumes)
      setActiveId(data.active_resume_id)
    }
  }

  useEffect(() => {
    setResumes(null)
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [track])

  async function saveResume(label: string, resumeText: string) {
    const headers = await authHeaders()
    const res = await fetch(`${API_URL}/api/modules/resumes`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ track, label, resume_text: resumeText }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data.detail ?? '保存失败')
    }
    await load()
  }

  async function handleFile(file: File) {
    setUploading(true)
    setError('')
    try {
      const formData = new FormData()
      formData.append('file', file)
      const resp = await fetch(`${API_URL}/api/parse-resume-pdf`, { method: 'POST', body: formData })
      if (!resp.ok) {
        const data = await resp.json()
        throw new Error(data.detail || '解析失败')
      }
      const data = await resp.json()
      const label = file.name.replace(/\.(pdf|docx?|DOCX?|PDF)$/, '') || `简历 ${new Date().toLocaleDateString()}`
      await saveResume(label, data.text)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '上传失败，试试直接粘贴文本')
    } finally {
      setUploading(false)
    }
  }

  async function setActive(id: number) {
    const headers = await authHeaders()
    await fetch(`${API_URL}/api/modules/resumes/active`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ track, resume_id: id }),
    })
    setActiveId(id)
  }

  async function deleteResume(id: number) {
    const headers = await authHeaders()
    await fetch(`${API_URL}/api/modules/resumes/${id}`, { method: 'DELETE', headers })
    await load()
  }

  return (
    <div className="bg-white/22 backdrop-blur-2xl border border-white/40 rounded-2xl p-6 mb-8
      shadow-[0_8px_32px_rgba(236,72,153,0.10),inset_0_1px_0_rgba(255,255,255,0.55)]">
      <p className="text-sm font-semibold text-gray-700 mb-3">📄 我的简历</p>

      <div className="flex gap-1.5 mb-4">
        {RESUME_TRACKS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTrack(t.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
              track === t.id
                ? 'bg-gradient-to-r from-rose-400 to-pink-500 text-white'
                : 'bg-white/40 border border-white/50 text-gray-500 hover:bg-white/60'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-gray-400">这份简历会用在 {RESUME_TRACKS.find((t) => t.id === track)?.label} 赛道的所有练习里</p>
        <label className={`cursor-pointer text-xs px-3 py-1.5 rounded-lg border transition-all duration-200 whitespace-nowrap ${
          uploading ? 'border-gray-200 text-gray-400 cursor-not-allowed' : 'border-rose-200 text-rose-400 hover:bg-rose-50'
        }`}>
          {uploading ? '解析中…' : '+ 上传简历 (PDF/Word)'}
          <input
            type="file"
            accept=".pdf,.doc,.docx"
            className="hidden"
            disabled={uploading}
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleFile(file)
              e.target.value = ''
            }}
          />
        </label>
      </div>

      {error && <p className="text-xs text-rose-500 mb-2">{error}</p>}

      {resumes && resumes.length === 0 && (
        <p className="text-xs text-gray-400 mb-2">还没有简历，上传一份，或者直接粘贴文本。</p>
      )}

      {resumes && resumes.length > 0 && (
        <div className="space-y-1.5 mb-2">
          {resumes.map((r) => (
            <div key={r.id}>
              <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all ${
                activeId === r.id ? 'bg-rose-50/80 border-rose-200' : 'bg-white/30 border-white/50'
              }`}>
                <button onClick={() => setActive(r.id)} className="flex items-center gap-2 flex-1 text-left">
                  <span className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${
                    activeId === r.id ? 'border-rose-400 bg-rose-400' : 'border-gray-300'
                  }`} />
                  <span className="text-sm text-gray-700">{r.label}</span>
                  {activeId === r.id && <span className="text-xs text-rose-500">本次训练使用</span>}
                </button>
                <button
                  onClick={() => setPreviewId(previewId === r.id ? null : r.id)}
                  className="text-xs text-gray-400 hover:text-rose-400 px-1"
                  title="查看解析出的文本"
                >
                  {previewId === r.id ? '收起' : '查看文本'}
                </button>
                <button onClick={() => deleteResume(r.id)} className="text-xs text-gray-300 hover:text-rose-400">🗑</button>
              </div>
              {previewId === r.id && (
                <div className="mt-1 mx-1 p-3 bg-gray-50 rounded-lg border border-gray-100">
                  {r.preview ? (
                    <>
                      <p className="text-xs text-gray-500 whitespace-pre-wrap font-mono leading-relaxed">{r.preview}</p>
                      {(r.preview.length ?? 0) >= 300 && (
                        <p className="text-xs text-gray-400 mt-1">（显示前300字符）</p>
                      )}
                    </>
                  ) : (
                    <p className="text-xs text-rose-500">⚠️ 文本为空 — PDF 可能解析失败，建议直接粘贴文本</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <button onClick={() => setPasteOpen((v) => !v)} className="text-xs text-rose-400 hover:text-rose-500">
        {pasteOpen ? '收起' : '或者直接粘贴文本 →'}
      </button>
      {pasteOpen && (
        <div className="mt-3 space-y-2">
          <input
            value={pasteLabel}
            onChange={(e) => setPasteLabel(e.target.value)}
            placeholder="给这份简历起个名字，比如 SDE Resume"
            className="w-full bg-white border border-pink-100 focus:border-rose-300 rounded-xl px-3 py-2 text-sm outline-none"
          />
          <textarea
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            rows={5}
            maxLength={4000}
            placeholder="粘贴简历文本..."
            className="w-full bg-white border border-pink-100 focus:border-rose-300 rounded-xl px-3 py-2 text-sm outline-none resize-none"
          />
          <button
            onClick={async () => {
              if (!pasteLabel.trim() || !pasteText.trim()) return
              try {
                await saveResume(pasteLabel.trim(), pasteText.trim())
                setPasteLabel(''); setPasteText(''); setPasteOpen(false); setError('')
              } catch (e: unknown) {
                setError(e instanceof Error ? e.message : '保存失败')
              }
            }}
            className="px-4 py-2 bg-gradient-to-r from-rose-400 to-pink-500 text-white text-sm font-medium rounded-xl"
          >
            保存
          </button>
        </div>
      )}
    </div>
  )
}

function CareerContent() {
  const router = useRouter()
  const { isSignedIn } = useAuth()
  const searchParams = useSearchParams()
  const initialTrack = (searchParams.get('track') as ResumeTrack) || 'sde'

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[#fdf8fb]">
        <div className="absolute -top-40 left-1/4   w-[700px] h-[700px] rounded-full bg-pink-300/20  blur-[160px]" />
        <div className="absolute bottom-0  right-1/4  w-[650px] h-[650px] rounded-full bg-rose-300/15  blur-[150px]" />
        <div className="absolute top-1/3  -right-32   w-[500px] h-[500px] rounded-full bg-purple-300/20 blur-[130px]" />
      </div>

      <header className="sticky top-0 z-20 bg-white/12 backdrop-blur-2xl border-b border-white/30">
        <div className="max-w-6xl mx-auto px-6 py-3.5 flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">🎙️</span>
            <span className="text-lg font-bold bg-gradient-to-r from-rose-500 to-pink-500 bg-clip-text text-transparent">
              AI English Coach
            </span>
          </Link>
          <span className="text-xs bg-rose-400/15 border border-rose-300/40 text-rose-500 px-2.5 py-0.5 rounded-full font-medium">
            求职英语
          </span>
          <div className="ml-auto flex items-center gap-4">
            <Link href="/daily" className="text-sm text-gray-500 hover:text-rose-500 transition-colors">
              🗣️ 日常英语 →
            </Link>
            <Link href="/history" className="text-sm text-gray-500 hover:text-rose-500 transition-colors">
              History
            </Link>
            {isSignedIn && (
              <Link href="/settings" className="text-sm text-gray-500 hover:text-rose-500 transition-colors">
                Pro
              </Link>
            )}
            {!isSignedIn && (
              <SignInButton mode="modal">
                <button className="text-sm bg-white/30 backdrop-blur-xl border border-white/50 text-rose-500 font-medium px-4 py-1.5 rounded-full hover:bg-white/50 transition-all">
                  登录
                </button>
              </SignInButton>
            )}
            {isSignedIn && <UserButton appearance={{ elements: { avatarBox: 'w-8 h-8' } }} />}
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 md:px-6 py-14">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-rose-500 to-pink-500 bg-clip-text text-transparent mb-2">
            北美求职英语
          </h1>
          <p className="text-gray-400 text-sm">SDE / DS / PM / Project Manager 面试口语，挑一种方式开始</p>
        </div>

        {isSignedIn && <ResumeManager initialTrack={initialTrack} />}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <button
            onClick={() => router.push('/modules')}
            className="text-left bg-white/22 backdrop-blur-2xl border border-white/40 rounded-2xl p-7
              shadow-[0_8px_32px_rgba(236,72,153,0.10),inset_0_1px_0_rgba(255,255,255,0.55)]
              hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(236,72,153,0.16)] transition-all duration-200"
          >
            <span className="text-xs bg-rose-400/15 border border-rose-300/40 text-rose-500 px-2.5 py-0.5 rounded-full font-medium">
              推荐起点
            </span>
            <div className="text-4xl mt-4 mb-3">🗺️</div>
            <h2 className="text-lg font-bold text-gray-800 mb-1.5">训练地图</h2>
            <p className="text-sm text-gray-500 leading-relaxed">
              自我介绍 → 简历深挖 → 行为面试 → 算法/SQL讲解 → 系统设计 → Debug，6个模块按顺序解锁，背稿到脱稿再进下一步。
            </p>
          </button>

          <button
            onClick={() => router.push('/sde-interview')}
            className="text-left bg-white/22 backdrop-blur-2xl border border-white/40 rounded-2xl p-7
              shadow-[0_8px_32px_rgba(236,72,153,0.10),inset_0_1px_0_rgba(255,255,255,0.55)]
              hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(236,72,153,0.16)] transition-all duration-200"
          >
            <span className="text-xs bg-white/40 border border-white/60 text-gray-500 px-2.5 py-0.5 rounded-full font-medium">
              自由练习
            </span>
            <div className="text-4xl mt-4 mb-3">🧑‍💻</div>
            <h2 className="text-lg font-bold text-gray-800 mb-1.5">SDE Interview</h2>
            <p className="text-sm text-gray-500 leading-relaxed">
              Behavioral / 项目深挖 / 系统设计思维，不分阶段，想练哪个直接挑，适合已经熟悉流程、想随时找一个场景练手的人。
            </p>
          </button>
        </div>
      </div>
    </main>
  )
}

export default function CareerPage() {
  return (
    <Suspense fallback={
      <div className="relative min-h-screen overflow-hidden flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-rose-100 border-t-rose-400 rounded-full animate-spin" />
      </div>
    }>
      <CareerContent />
    </Suspense>
  )
}
