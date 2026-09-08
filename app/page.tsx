'use client';
import { PrivyAccountButton } from "@/components/privy/PrivyAccountButton";
import { Link2 } from "lucide-react";
import Link from "next/link";


export default function Home() {
  return (
    <div className="min-h-screen pb-12 ">
      <header className="container mx-auto flex items-center justify-between py-5 sm:py-7">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f05b35] text-white shadow-lg shadow-[#f05b35]/20">
            <Link2 size={18} strokeWidth={2.6} />
          </div>
          <span className="text-lg font-extrabold tracking-tighter">
            paylink<span className="text-[#f05b35]"> .</span>
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-2 rounded-full bg-[#e8f1e7] px-3 py-2 text-[11px] font-bold text-[#21443a] sm:flex">
            <span className="h-2 w-2 rounded-full bg-emerald-500 pulse-dot" /> Monad · AUSD
          </div>
          <PrivyAccountButton />
        </div>
      </header>
    </div>
  );
}
