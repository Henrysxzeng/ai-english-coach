// file: src/app/layout.tsx
// owner: Frontend Engineer
// version: 2.0 — Clerk auth
import type { Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'

export const metadata: Metadata = {
  title: 'AI English Coach',
  description: 'AI-powered English speaking practice',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased bg-[#fdf8fb]">
        <ClerkProvider>
          {children}
        </ClerkProvider>
      </body>
    </html>
  )
}
