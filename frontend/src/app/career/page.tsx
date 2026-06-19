// file: src/app/career/page.tsx — 求职英语主线着陆页
'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { SignInButton, UserButton, useAuth } from '@clerk/nextjs'

export default function CareerPage() {
  const router = useRouter()
  const { isSignedIn } = useAuth()

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
          <p className="text-gray-400 text-sm">SDE / Data Scientist 面试口语，挑一种方式开始</p>
        </div>

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
