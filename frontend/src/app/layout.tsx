// file: src/app/layout.tsx
// owner: Frontend Engineer
// version: 2.0 — Clerk auth
import type { Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'
import ThemeToggle from '@/components/ThemeToggle'

export const metadata: Metadata = {
  title: 'AI English Coach',
  description: 'AI-powered English speaking practice',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* 加载前应用已保存主题，避免闪烁 */}
        <script dangerouslySetInnerHTML={{ __html: "try{var t=localStorage.getItem('theme');if(t&&t!=='rose')document.documentElement.dataset.theme=t;}catch(e){}" }} />
      </head>
      <body className="antialiased">
        <ClerkProvider>
          {children}
          <ThemeToggle />
        </ClerkProvider>
      </body>
    </html>
  )
}
