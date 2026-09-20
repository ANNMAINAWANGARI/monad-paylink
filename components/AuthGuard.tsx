
"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";


export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { ready, authenticated, user } = usePrivy();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!authenticated && !user && pathname !== "/login") {
      router.replace("/login");
    }
  }, [authenticated, user, pathname, router]);

  if (!ready || (!user && pathname !== "/login")) {
    return null; // or a spinner
  }

  return <>{children}</>;
}