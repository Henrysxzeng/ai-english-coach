// file: src/app/layout.tsx
// owner: Frontend Engineer
// version: 1.0
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AI English Coach',
  description: 'AI-powered English speaking practice',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  )
}
