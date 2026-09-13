
"use client";

import { useState } from "react";
import { useGetWalletAccounts } from "@dynamic-labs-sdk/react-hooks";
import { createWalletClientForWalletAccount } from "@dynamic-labs-sdk/evm/viem";
import { parseEther } from "viem";
import { useRouter } from 'next/navigation';

export default function WalletPanel() {
  const router = useRouter();
  const { data: walletAccounts = [] } = useGetWalletAccounts();
  const walletAccount = walletAccounts[0];
  const [txHash, setTxHash] = useState<string | null>(null);

  if (!walletAccount) return router.push("/login");

  const handleSend = async (to: `0x${string}`, amountEth: string) => {
    const walletClient = await createWalletClientForWalletAccount({ walletAccount });
    const hash = await walletClient.sendTransaction({
      to,
      value: parseEther(amountEth),
    });
    setTxHash(hash);
  };

  return (
    <div>
      <p>Wallet: {walletAccount.address}</p>
      <button onClick={() => handleSend("0xRecipient...", "0.01")}>Send 0.01 ETH</button>
      {txHash && <p>Sent: {txHash}</p>}
    </div>
  );
}