'use client'

import { useUser, useInitStatus } from '@dynamic-labs-sdk/react-hooks';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Home() {
  const router = useRouter();
  const { data: initStatus } = useInitStatus();
  const { data: user } = useUser();

  useEffect(() => {
    console.log("dynamic",{
      initStatus,
      hasUser:Boolean(user),
      userId:user?.id,
      sessionId:user?.sessionId,
    })
    if (initStatus !== 'finished') return;
    router.replace(user ? '/dashboard' : '/login');
  }, [initStatus, user, router]);

  if(initStatus !== 'finished') {
    return(<p>Loading session...</p>)
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-[#2E2557]" />
    </div>
  )
}