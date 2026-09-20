
"use client";

import { useEffect, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null);
  const { ready, authenticated, user, login, logout } = usePrivy();
  
  useEffect(() => {
    if (authenticated) {
      router.push('/dashboard');
    }
  }, [user, router]);


  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-3xl font-bold">Privy Embedded Wallet</h1>
      <p className="text-gray-600 text-center max-w-md">
        Log in with Email OTP or Google. An embedded wallet is created automatically in the background.
      </p>
      <button
        onClick={login}
        className="rounded-lg bg-indigo-600 px-8 py-3 text-white font-medium hover:bg-indigo-700 transition"
        >
          Log in with Email or Google
      </button>
    </main>
  );
}