// file: src/app/page.tsx — 首页：日常英语 / 求职英语 两条主线选择入口
'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { SignInButton, UserButton, useAuth } from '@clerk/nextjs'

export default function HomePage() {
  const router = useRouter()
  const { isSignedIn } = useAuth()

  return (
    <main className="relative min-h-screen overflow-hidden flex flex-col">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[#fdf8fb]">
        <div className="absolute -top-40 left-1/4   w-[700px] h-[700px] rounded-full bg-pink-300/20  blur-[160px]" />
        <div className="absolute bottom-0  right-1/4  w-[650px] h-[650px] rounded-full bg-rose-300/15  blur-[150px]" />
        <div className="absolute top-1/3  -right-32   w-[500px] h-[500px] rounded-full bg-purple-300/20 blur-[130px]" />
        <div className="absolute top-1/4  -left-32    w-[450px] h-[450px] rounded-full bg-pink-300/25  blur-[120px]" />
      </div>

      <header className="sticky top-0 z-20 bg-white/12 backdrop-blur-2xl border-b border-white/30">
        <div className="max-w-6xl mx-auto px-6 py-3.5 flex items-center gap-3">
          <span className="text-2xl">🎙️</span>
          <span className="text-lg font-bold bg-gradient-to-r from-rose-500 to-pink-500 bg-clip-text text-transparent">
            AI English Coach
          </span>
          <div className="ml-auto flex items-center gap-4">
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

      <div className="flex-1 flex items-center justify-center px-4 py-14">
        <div className="w-full max-w-3xl">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-rose-500 to-pink-500 bg-clip-text text-transparent mb-3">
              Master English Speaking
            </h1>
            <p className="text-gray-400">先选一条线，开始练习</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <button
              onClick={() => router.push('/daily')}
              className="text-left bg-white/22 backdrop-blur-2xl border border-white/40 rounded-2xl p-8
                shadow-[0_8px_32px_rgba(236,72,153,0.10),inset_0_1px_0_rgba(255,255,255,0.55)]
                hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(236,72,153,0.16)] transition-all duration-200"
            >
              <div className="text-5xl mb-4">🗣️</div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">日常英语</h2>
              <p className="text-sm text-gray-500 leading-relaxed">
                面试 / 餐厅 / 会议 / 医院 / 电话 / 客服，6个生活场景，AI角色扮演陪你练口语。
              </p>
            </button>

            <button
              onClick={() => router.push('/career')}
              className="text-left bg-white/22 backdrop-blur-2xl border border-white/40 rounded-2xl p-8
                shadow-[0_8px_32px_rgba(236,72,153,0.10),inset_0_1px_0_rgba(255,255,255,0.55)]
                hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(236,72,153,0.16)] transition-all duration-200"
            >
              <div className="text-5xl mb-4">🧑‍💻</div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">求职英语</h2>
              <p className="text-sm text-gray-500 leading-relaxed">
                北美 SDE / 数据科学家求职面试口语，结构化训练地图 + 自由练习两种模式。
              </p>
            </button>
          </div>

          <div className="text-center mt-8">
            <Link href="/history" className="text-sm text-rose-400 hover:text-rose-500 transition-colors">
              查看历史记录 →
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
