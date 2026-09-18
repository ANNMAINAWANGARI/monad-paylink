'use client'

import { useState } from 'react';
import { Button } from './ui/button';
import { Check, Loader2, Smartphone } from "lucide-react";

interface CoinOption{
    coins:number;
    price:string;
}

interface AddMoneyInterface {
    coinOptions: CoinOption[];
    setSelectedCoins: (coins:number)=>void;
    selectedCoins:number;
    walletAddress: string;
}
type Step = 'select' | 'mpesa' | 'converting' | 'success' | 'error';

const AddMoney = ({coinOptions, selectedCoins, setSelectedCoins,walletAddress}:AddMoneyInterface) => {
  const [step, setStep] = useState<Step>('select');
  const [txHash, setTxHash] = useState<string | null>(null);
  const handleConfirm = async () => {
    setStep('mpesa');
    // fake M-Pesa STK push delay
    await new Promise((r) => setTimeout(r, 2500));

    setStep('converting');
    try {
      const res = await fetch('/api/topup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ my_address: walletAddress, coins: selectedCoins }),
      });
      if (!res.ok) throw new Error('failed');
      const data = await res.json();
      setTxHash(data.txHash);
      setStep('success');
      //onSuccess?.();
    } catch {
      setStep('error');
    }
  };
  if (step === 'mpesa' || step === 'converting') {
    return (
      <div className="flex flex-col items-center gap-3 py-10 text-center">
        <Loader2 className="size-6 animate-spin text-teal" />
        <p className="text-sm text-primary-foreground/80">
          {step === 'mpesa' ? 'Processing your M-Pesa payment…' : 'Converting to AUSD on Sepolia…'}
        </p>
      </div>
    );
  }
  if (step === 'success') {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-center">
        <Check className="size-8 text-teal" />
        <p className="text-lg font-semibold">{selectedCoins} coins added</p>
        <a
          href={`https://sepolia.etherscan.io/tx/${txHash}`}
          target="_blank"
          rel="noreferrer"
          className="text-xs text-teal underline underline-offset-2"
        >
          View transaction
        </a>
      </div>
    );
  }
  if (step === 'error') {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-center">
        <p className="text-sm text-red-400">Something went wrong. Try again.</p>
        <Button className="h-10 rounded-xl px-6" onClick={() => setStep('select')}>
          Back
        </Button>
      </div>
    );
  }
  return (
    <div>
        <div className="mb-4 flex flex-wrap gap-2">
            {coinOptions.map((option) => (
                <Button
                key={option.coins}
                type="button"
                onClick={() => setSelectedCoins(option.coins)}
                className={selectedCoins === option.coins ? "rounded-full bg-teal text-coin-foreground hover:bg-teal/90" : "rounded-full border border-sheet-border bg-sheet-soft text-primary-foreground hover:bg-sheet-soft/80"}
                >
                    {option.coins} coins · {option.price}
                </Button>
            ))}
        </div>
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-teal bg-sheet-soft p-3">
            <Smartphone className="size-5 text-teal" />
            <div className="flex-1">
                <p className="font-semibold">M-Pesa</p>
                <p className="text-xs text-primary-foreground/65">STK push to 07 • • • • 214</p>
            </div>
            <Check className="size-5 text-teal" />
        </div>
        <Button  className="h-11 w-full rounded-xl text-base " onClick={handleConfirm}>Confirm on M-Pesa</Button>
    </div>
  )
}

export default AddMoney