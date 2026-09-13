
"use client";

import { useUser, useInitStatus } from "@dynamic-labs-sdk/react-hooks";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { data: initStatus } = useInitStatus();
  const { data: user } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (initStatus === "finished" && !user && pathname !== "/login") {
      router.replace("/login");
    }
  }, [initStatus, user, pathname, router]);

  if (initStatus !== "finished" || (!user && pathname !== "/login")) {
    return null; // or a spinner
  }

  return <>{children}</>;
}