'use client'
import { useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import Link from 'next/link'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export default function SettingsPage() {
  const { getToken } = useAuth()
  const [afdianId, setAfdianId] = useState('')
  const [result, setResult] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleLink() {
    if (!afdianId.trim()) return
    setLoading(true)
    try {
      const token = await getToken()
      const res = await fetch(`${API_URL}/api/user/link-pro`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ afdian_user_id: afdianId.trim() }),
      })
      const data = await res.json()
      if (data.success) {
        setResult('✅ Pro 已激活！请刷新页面。')
      } else {
        const msgs: Record<string, string> = {
          not_logged_in: '请先登录',
          no_order_found: '未找到订阅记录，请确认已在爱发电完成付款，并等待几分钟后重试',
          missing_afdian_user_id: '请输入爱发电 user_id',
        }
        setResult('❌ ' + (msgs[data.error] ?? '验证失败'))
      }
    } catch {
      setResult('❌ 网络错误，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#fdf8fb]">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[#fdf8fb]">
        <div className="absolute -top-40 left-1/4 w-[700px] h-[700px] rounded-full bg-pink-300/20 blur-[160px]" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] rounded-full bg-rose-300/15 blur-[140px]" />
      </div>
      <div className="max-w-lg mx-auto px-4 py-16">
        <Link href="/" className="text-sm text-gray-400 hover:text-rose-500 mb-8 block">← 返回首页</Link>

        <div className="bg-white/22 backdrop-blur-2xl border border-white/40 rounded-2xl p-8
          shadow-[0_8px_32px_rgba(236,72,153,0.10),inset_0_1px_0_rgba(255,255,255,0.55)]">
          <h1 className="text-xl font-bold text-gray-800 mb-2">激活 Pro 会员</h1>
          <p className="text-sm text-gray-500 mb-6">
            在爱发电订阅后，输入你的爱发电 user_id 完成激活。
          </p>

          <p className="text-xs text-gray-400 mb-1">如何找到你的爱发电 user_id：</p>
          <p className="text-xs text-gray-500 mb-5 bg-white/40 rounded-xl p-3">
            登录爱发电 → 右上角头像 → 设置 → 开发者 → 复制 user_id 字段
          </p>

          <input
            type="text"
            value={afdianId}
            onChange={e => setAfdianId(e.target.value)}
            placeholder="粘贴你的爱发电 user_id"
            className="w-full bg-white/40 border border-white/60 rounded-xl px-4 py-3 text-sm
              text-gray-700 placeholder-gray-400 outline-none focus:border-rose-300 mb-4"
          />

          <button
            onClick={handleLink}
            disabled={loading || !afdianId.trim()}
            className="w-full py-3 rounded-xl font-semibold text-white text-sm
              bg-gradient-to-r from-rose-400 to-pink-500
              shadow-[0_4px_20px_rgba(244,63,94,0.35)] disabled:opacity-50"
          >
            {loading ? '验证中...' : '激活 Pro'}
          </button>

          {result && (
            <p className="text-sm text-center mt-4 text-gray-600">{result}</p>
          )}

          <div className="mt-6 pt-6 border-t border-white/40 text-center">
            <p className="text-xs text-gray-400 mb-2">还没订阅？</p>
            <a
              href={process.env.NEXT_PUBLIC_AFDIAN_URL ?? 'https://ifdian.net/a/aienglishcoach'}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-rose-500 hover:text-rose-600 font-medium"
            >
              去爱发电订阅 Pro → ¥39/月
            </a>
          </div>
        </div>
      </div>
    </main>
  )
}
