
"use client";

import { FormEvent, useState } from "react";
import {useSignInWithSocialRedirect} from "@dynamic-labs-sdk/react-hooks";
import { EmailSignIn } from "@/components/EmailSignIn";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  
  const [error, setError] = useState<string | null>(null);

  
  const { mutate: signInWithSocialRedirect } = useSignInWithSocialRedirect();

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className=" border rounded-lg p-8 shadow-md bg-[#2E2557] flex flex-col gap-4">
        <h1 className="text-center text-4xl text-white">Sign in</h1>
        <p className="text-center text-gray-400 max-w-xs mx-auto">
          Sign in to send or receive gifts. No seed phrase, no wallet setup — a wallet is created for you automatically.
        </p>

      <Button
        className=" bg-white text-black hover:bg-white hover:text-black py-5 border border-gray-200"
        onClick={() =>
          signInWithSocialRedirect({ provider: "google", redirectUrl: window.location.origin + "/login" })
        }

      >
        Continue with Google
      </Button>

      <div className="text-white text-center">
        or
      </div>

      <EmailSignIn/>

      {error && <p className="text-center text-red-600 pt-4">
        {error}
      </p>}
      </div>
    </div>
  );
}