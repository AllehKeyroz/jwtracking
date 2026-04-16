import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Master Tracker | God Mode',
  description: 'First-Party Tracking & Identity Bridging SaaS',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" className="dark">
      <body className={`${inter.className} bg-[#0A0A0B] text-slate-100 min-h-screen selection:bg-cyan-500/30`}>
        {/* Glow Effects de fundo global */}
        <div className="fixed top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-cyan-600/10 blur-[120px] pointer-events-none z-0"></div>
        <div className="fixed bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-purple-600/10 blur-[150px] pointer-events-none z-0"></div>

        <main className="relative z-10 flex flex-col min-h-screen">
          {children}
        </main>
      </body>
    </html>
  )
}
