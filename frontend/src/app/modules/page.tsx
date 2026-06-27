// file: src/app/modules/page.tsx
// 北美秋招口语训练 - 模块地图：按 track(sde/ds) 展示6个模块的解锁/进度状态
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { SignInButton, useAuth } from '@clerk/nextjs'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

type Track = 'sde' | 'ds' | 'pm' | 'proj'
type StageStatus = 'locked' | 'in_progress' | 'completed'

interface StageInfo {
  stage: string
  status: StageStatus
  completed_at: string | null
}

interface ModuleInfo {
  module: string
  stages: StageInfo[]
}

const MODULE_META: Record<string, { icon: string; title: Record<Track, string>; desc: Record<Track, string> }> = {
  self_intro: {
    icon: '🙋',
    title: { sde: '自我介绍', ds: '自我介绍', pm: '自我介绍', proj: '自我介绍' },
    desc: { sde: '60-90秒的自我介绍稿，背到脱稿', ds: '60-90秒的自我介绍稿，背到脱稿', pm: '60-90秒的自我介绍稿，背到脱稿', proj: '60-90秒的自我介绍稿，背到脱稿' },
  },
  resume_deep_dive: {
    icon: '📄',
    title: { sde: '简历深挖', ds: '简历深挖', pm: '产品复盘', proj: '项目经历深挖' },
    desc: {
      sde: 'AI 根据简历生成语料库，再真实模拟深挖',
      ds: 'AI 根据简历生成语料库，再真实模拟深挖',
      pm: '讲你主导的产品/功能，决策依据和结果指标',
      proj: '讲你参与的项目经历：范围、角色、风险处理和结果',
    },
  },
  behavioral: {
    icon: '🗣️',
    title: { sde: '行为面试 (STAR)', ds: '行为面试 (STAR)', pm: '行为面试 (STAR)', proj: '行为面试 (STAR)' },
    desc: {
      sde: 'Teamwork / Conflict / Leadership / Failure',
      ds: 'Teamwork / Conflict / Leadership / Failure',
      pm: '跨团队协作 / 无职权领导 / 利益冲突',
      proj: '干系人管理 / 项目冲突 / 压力下决策 / 失败复盘',
    },
  },
  technical_explain: {
    icon: '🧩',
    title: { sde: '算法讲解', ds: 'SQL讲解', pm: 'Product Sense', proj: '客户沟通' },
    desc: {
      sde: '边讲思路边写代码，脱稿讲清楚复杂度',
      ds: '边讲思路边写SQL/统计方法，脱稿讲清楚假设',
      pm: '产品设计/改进题，脱稿讲清楚用户洞察和方案',
      proj: '模拟客户沟通：需求收集、进度汇报、处理客户疑虑',
    },
  },
  system_design: {
    icon: '🏗️',
    title: { sde: '系统设计', ds: '实验设计', pm: '指标与执行', proj: '情景危机' },
    desc: {
      sde: '系统设计/数据结构权衡',
      ds: '实验设计 / 数据管道设计',
      pm: '定义指标、设计A/B测试、指标下降排查',
      proj: '项目落后/资源不足/需求翻倍等危机场景应对',
    },
  },
  debug: {
    icon: '🐛',
    title: { sde: 'Debug', ds: 'Debug', pm: '估算与排序', proj: '规划与敏捷' },
    desc: {
      sde: '边讲思路边定位代码bug',
      ds: '边讲思路边定位数据/模型问题',
      pm: '市场体量估算 / 多个feature怎么排优先级',
      proj: 'Sprint规划 / 需求蔓延 / 跨团队协调',
    },
  },
}

const STAGE_LABEL: Record<string, string> = { learn: 'Learn 背稿', apply: 'Apply 自选脱稿', master: 'Master AI出题' }

function StageBadge({ stage, status }: { stage: string; status: StageStatus }) {
  const cls =
    status === 'completed'
      ? 'bg-green-50 border-green-200 text-green-600'
      : status === 'in_progress'
      ? 'bg-gradient-to-r from-rose-400 to-pink-500 text-white border-transparent'
      : 'bg-white/40 border-white/50 text-gray-400'
  return (
    <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${cls}`}>
      {status === 'completed' ? '✓ ' : status === 'locked' ? '🔒 ' : ''}
      {STAGE_LABEL[stage] ?? stage}
    </span>
  )
}

export default function ModulesPage() {
  const router = useRouter()
  const { isSignedIn, getToken } = useAuth()
  const [track, setTrack] = useState<Track>('sde')
  const [modules, setModules] = useState<ModuleInfo[] | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isSignedIn) return
    setLoading(true)
    setModules(null)
    ;(async () => {
      const token = await getToken()
      const res = await fetch(`${API_URL}/api/modules?track=${track}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (res.ok) setModules((await res.json()).modules)
      setLoading(false)
    })()
  }, [track, isSignedIn, getToken])

  if (!isSignedIn) {
    return (
      <main className="relative min-h-screen overflow-hidden flex items-center justify-center px-4">
        <div className="pointer-events-none fixed inset-0 -z-10 bg-[#fdf8fb]">
          <div className="absolute -top-40 left-1/4 w-[700px] h-[700px] rounded-full bg-pink-300/20 blur-[160px]" />
          <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] rounded-full bg-rose-300/15 blur-[140px]" />
        </div>
        <div className="bg-white/80 backdrop-blur-xl border border-pink-100 rounded-2xl p-10 text-center max-w-sm shadow-[0_4px_24px_rgba(244,114,182,0.08)]">
          <p className="text-3xl mb-3">🗺️</p>
          <h1 className="text-lg font-bold text-gray-800 mb-2">训练进度需要登录</h1>
          <p className="text-sm text-gray-400 mb-6">登录后你的模块进度会保存下来，下次打开还在</p>
          <SignInButton mode="modal">
            <button className="px-8 py-3 bg-gradient-to-r from-rose-400 to-pink-500 text-white font-semibold rounded-xl shadow-[0_4px_16px_rgba(244,63,94,0.28)]">
              登录
            </button>
          </SignInButton>
        </div>
      </main>
    )
  }

  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-12">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[#fdf8fb]">
        <div className="absolute -top-40 left-1/4 w-[700px] h-[700px] rounded-full bg-pink-300/20 blur-[160px]" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] rounded-full bg-rose-300/15 blur-[140px]" />
        <div className="absolute top-1/3 -right-32 w-[500px] h-[500px] rounded-full bg-purple-300/20 blur-[130px]" />
      </div>

      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-rose-500 to-pink-500 bg-clip-text text-transparent mb-2">
            北美秋招训练地图
          </h1>
          <p className="text-gray-400 text-sm">按顺序一块一块解锁，脱稿讲熟一个再进下一个</p>
        </div>

        <div className="flex items-center justify-center gap-2 flex-wrap">
          {(['sde', 'ds', 'pm', 'proj'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTrack(t)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                track === t
                  ? 'bg-gradient-to-r from-rose-400 to-pink-500 text-white shadow-[0_2px_10px_rgba(244,63,94,0.25)]'
                  : 'bg-white border border-pink-100 text-gray-500 hover:border-rose-200'
              }`}
            >
              {t === 'sde' ? '💻 SDE' : t === 'ds' ? '📊 Data Scientist' : t === 'pm' ? '📋 Product Manager' : '🗂️ Project Manager'}
            </button>
          ))}
        </div>

        {loading && (
          <div className="flex justify-center py-10">
            <div className="w-8 h-8 border-4 border-rose-100 border-t-rose-400 rounded-full animate-spin" />
          </div>
        )}

        {modules && (
          <div className="space-y-3">
            {modules.map((m, i) => {
              const meta = MODULE_META[m.module]
              const allLocked = m.stages.every((s) => s.status === 'locked')
              const allCompleted = m.stages.every((s) => s.status === 'completed')
              const cardBase = `w-full text-left rounded-2xl p-5 transition-all duration-200 ${
                allLocked
                  ? 'bg-white/40 border border-white/50 opacity-50 cursor-not-allowed'
                  : 'bg-white/80 backdrop-blur-xl border border-pink-100 shadow-[0_4px_24px_rgba(244,114,182,0.07)] hover:shadow-[0_8px_32px_rgba(244,114,182,0.12)] hover:-translate-y-0.5'
              }`

              if (m.module === 'self_intro') {
                return (
                  <div key={m.module} className={cardBase}>
                    <div className="flex items-start gap-4">
                      <div className="text-3xl shrink-0">{meta?.icon ?? '🙋'}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-xs text-gray-300 font-mono">{i + 1}</span>
                          <h3 className="font-semibold text-gray-800">{meta?.title[track] ?? '自我介绍'}</h3>
                          {allCompleted && <span className="text-green-500 text-sm">✓ 完成</span>}
                        </div>
                        <p className="text-xs text-gray-400 mb-3">生成两版稿子，分别背诵练习</p>
                        {!allLocked && (
                          <div className="flex gap-2 flex-wrap">
                            <button
                              onClick={() => router.push(`/modules/${track}/self_intro?version=tech`)}
                              className="px-3 py-1.5 bg-white border border-rose-200 text-rose-500 hover:bg-rose-50 rounded-lg text-xs font-medium transition-colors"
                            >
                              ⚡ 技术轮 1分钟
                            </button>
                            <button
                              onClick={() => router.push(`/modules/${track}/self_intro?version=hr`)}
                              className="px-3 py-1.5 bg-white border border-rose-200 text-rose-500 hover:bg-rose-50 rounded-lg text-xs font-medium transition-colors"
                            >
                              🗣️ HR轮 3-5分钟
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              }

              return (
                <button
                  key={m.module}
                  disabled={allLocked}
                  onClick={() => router.push(`/modules/${track}/${m.module}`)}
                  className={cardBase}
                >
                  <div className="flex items-start gap-4">
                    <div className="text-3xl shrink-0">{meta?.icon ?? '📘'}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs text-gray-300 font-mono">{i + 1}</span>
                        <h3 className="font-semibold text-gray-800">{meta?.title[track] ?? m.module}</h3>
                        {allCompleted && <span className="text-green-500 text-sm">✓ 完成</span>}
                      </div>
                      <p className="text-xs text-gray-400 mb-3">{meta?.desc[track] ?? ''}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {m.stages.map((s) => (
                          <StageBadge key={s.stage} stage={s.stage} status={s.status} />
                        ))}
                      </div>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}

        <div className="text-center pt-2">
          <Link href="/" className="text-sm text-rose-400 hover:text-rose-500">← Back to Home</Link>
        </div>
      </div>
    </main>
  )
}
