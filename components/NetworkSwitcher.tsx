"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import {
  getNetworksData,
  isProgrammaticNetworkSwitchAvailable,
  type WalletAccount,
} from "@dynamic-labs-sdk/client";
import {
  useGetActiveNetworkData,
  useGetWalletAccounts,
  useSwitchActiveNetwork,
} from "@dynamic-labs-sdk/react-hooks";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface NetworkSwitcherProps {
  walletAccount: WalletAccount;
  className?: string;
}

function NetworkIcon({
  iconUrl,
  displayName,
}: {
  iconUrl?: string;
  displayName: string;
}) {
  if (!iconUrl) {
    return (
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[10px] font-medium text-muted-foreground">
        {displayName.slice(0, 1)}
      </span>
    );
  }
  return (
    <Image
      src={iconUrl}
      alt={displayName}
      width={20}
      height={20}
      className="h-5 w-5 rounded-full"
    />
  );
}

export function NetworkSwitcher({
  walletAccount,
  className,
}: NetworkSwitcherProps) {
  
  const activeWallet = walletAccount;

  const [error, setError] = useState<string | null>(null);

  const { data, isLoading } = useGetActiveNetworkData({walletAccount});

  const { mutateAsync: switchNetwork, isPending } = useSwitchActiveNetwork();

  // A wallet can only switch within its own chain (evm, solana, ...), so
  // filter the project's full network list down to that chain.
  const networks = useMemo(() => {
    if (!activeWallet) return [];
    return getNetworksData().filter(
      (network) => network.chain === activeWallet.chain,
    );
  }, [activeWallet]);

  if (!activeWallet) {
    return (
      <Badge variant="outline" className={cn("text-muted-foreground", className)}>
        No wallet connected
      </Badge>
    );
  }

  if (isLoading) {
    return <Skeleton className={cn("h-9 w-40", className)} />;
  }

  const currentNetwork = data?.networkData;

  async function handleChange(networkId: string | null) {
    if (!networkId || !activeWallet || networkId === currentNetwork?.networkId) return;
    setError(null);

    if (!isProgrammaticNetworkSwitchAvailable({ walletAccount: activeWallet })) {
      const target = networks.find((n) => n.networkId === networkId);
      setError(
        `Switch to ${target?.displayName ?? "the selected network"} from inside your wallet.`,
      );
      return;
    }

    try {
      await switchNetwork({ networkId, walletAccount: activeWallet });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to switch network.",
      );
    }
  }

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Select
        value={currentNetwork?.networkId ?? ""}
        onValueChange={handleChange}
        disabled={isPending}
      >
        <SelectTrigger className="w-50">
          <SelectValue placeholder="Select network">
            {currentNetwork && (
              <span className="flex items-center gap-2">
                <NetworkIcon
                  iconUrl={currentNetwork.iconUrl}
                  displayName={currentNetwork.displayName}
                />
                <span className="truncate">{currentNetwork.displayName}</span>
              </span>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {networks.map((network) => (
            <SelectItem key={network.networkId} value={network.networkId}>
              <span className="flex items-center gap-2">
                <NetworkIcon
                  iconUrl={network.iconUrl}
                  displayName={network.displayName}
                />
                <span>{network.displayName}</span>
                {network.nativeCurrency?.symbol && (
                  <span className="ml-1 text-xs text-muted-foreground">
                    {network.nativeCurrency.symbol}
                  </span>
                )}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {isPending && (
        <p className="text-xs text-muted-foreground">Switching network…</p>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}