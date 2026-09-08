'use client';
import { shortAddress } from "@/lib/privy";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { WalletCards } from "lucide-react";

export function PrivyAccountButton() {
  const { ready, authenticated, user, login, logout } = usePrivy();
  const wallet = user?.wallet?.address;
  
  if (!ready) return <button className="pl-button pl-button-ghost opacity-60" disabled>Loading wallet…</button>;
  if (!authenticated) return <button className="pl-button pl-button-ink" onClick={() => login()}><WalletCards size={16} /> Sign in</button>;
  return <button className="pl-button pl-button-ghost" onClick={() => logout()} title="Sign out"><span className="h-2 w-2 rounded-full bg-emerald-500 pulse-dot" /> {shortAddress(wallet)}</button>;
}
