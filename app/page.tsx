'use client'


import PrivyButton from '@/components/PrivyButton';
import { usePrivy } from '@privy-io/react-auth';
import { Wallet, Zap } from 'lucide-react';
import Link from 'next/link';


export default function Home() {
  return (
    <div className="bg-[#0d0e12] text-[#f3f4f6] antialiased min-h-screen flex flex-col justify-between">
      <header className="w-full px-6 py-4 flex items-center justify-between border-b border-[#1f2230] bg-[#0d0e12]">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-linear-to-tr from-[#8352ec] via-[#a855f7] to-[#10b981] p-0.5">
            <div className="w-full h-full bg-[#0d0e12] rounded-[10px] flex items-center justify-center">
              <Zap/>
            </div>
          </div>
          <span className="font-display font-bold text-xl tracking-tight text-[#ffffff]">SonicStream</span>
        </Link>
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#8352ec] text-[#ffffff] font-semibold text-sm transition-all shadow-md shadow-[#8352ec]/20">
          <Wallet/>
          <PrivyButton/>
        </div>
      </header>
      <main className="max-w-3xl mx-auto text-center space-y-6 px-4 py-16 my-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#181924] border border-[#262938] text-xs font-medium text-[#94a3b8]">
          <span className="w-2 h-2 rounded-full bg-[#8352ec] animate-pulse"></span>
          Built on Monad Chain • Powered by $AGORA
        </div>
        <h1 className="text-4xl sm:text-6xl font-display font-extrabold tracking-tight text-[#ffffff] leading-tight">
          Live Stream Gifting,<br/>
          <span className="bg-linear-to-r from-[#8352ec] via-[#c084fc] to-[#10b981] bg-clip-text text-transparent">On-Chain & Instant.</span>
        </h1>
        <p className="text-base sm:text-lg text-[#94a3b8] max-w-xl mx-auto leading-relaxed">
          Got a community? Unleash Viral Engagement. Change how value is distributed. Keep 100% of your earnings.
        </p>
      </main>
    </div>
  )
}