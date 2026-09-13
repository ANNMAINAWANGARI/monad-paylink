'use client'
import { useSendEmailOTP, useVerifyOTP, useUser } from '@dynamic-labs-sdk/react-hooks';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from './ui/button';

export function EmailSignIn() {
  const router = useRouter();
  const { data: user } = useUser();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');

  const {
    mutate: sendCode,
    data: otpVerification,
    reset,
    isPending: isSending,
  } = useSendEmailOTP();
  const { mutate: verifyCode, isPending: isVerifying, error } = useVerifyOTP();

  if (user) return <p>Signed in as {user.email}</p>;

  // Code-entry screen — shown once a code has been sent
  if (otpVerification) {
    return (
      <form
        className="flex flex-col gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          verifyCode({ otpVerification, verificationToken: code },{ onSuccess: () => router.push('/dashboard') });
        }}
      >
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          inputMode="numeric"
          autoComplete="one-time-code"
          placeholder="Enter the 6-digit code"
          className="rounded-md bg-[#211a44] border border-white/10 px-4 py-2 text-center tracking-widest text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
        <Button type="submit" disabled={isVerifying} className="rounded-md bg-indigo-500 px-4 py-2 font-medium text-white hover:bg-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
          {isVerifying ? 'Verifying…' : 'Verify'}
        </Button>
        <Button type="button" onClick={() => reset()} className="text-sm text-white/60 hover:text-white/90 underline underline-offset-2 self-center">
          Use a different email
        </Button>
        {error && <p role="alert" className="text-sm text-red-400 text-center">That code didn't work. Check it and try again.</p>}
      </form>
    );
  }

  // Email screen
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        sendCode({ email });
      }}
      className="flex flex-col gap-2"
    >
      <input
        className="text-white bg-transparent placeholder:text-gray-400 focus:outline-none border border-gray-600 py-2"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
      />
      <Button type="submit" disabled={isSending} className=" bg-white text-black py-5 border border-gray-200 hover:bg-white hover:text-black">
        {isSending ? 'Sending…' : 'Email me a code'}
      </Button>
    </form>
  );
}