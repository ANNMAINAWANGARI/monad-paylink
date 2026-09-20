'use client'
import { ConnectedWallet } from '@privy-io/react-auth';
import { Button } from './ui/button';
import { useState } from 'react';
import { useSendTransaction, useWallets } from '@privy-io/react-auth';
import { encodeFunctionData, erc20Abi, parseUnits } from "viem";
import { AUSD_ADDRESS } from '@/lib/monad-tokens';

interface GiftOption {
    icon: string;
    name: string;
    coins: number;
}

interface GiftCardInterface {
    giftOptions: GiftOption[];
    selectedGift: string;
    setSelectedGift: (giftName: string) => void;
    walletAccount:ConnectedWallet | undefined;
    recipient:string;
    tokenBalance:string;
}


const GiftCard = ({giftOptions, selectedGift,setSelectedGift,walletAccount,recipient,tokenBalance}:GiftCardInterface) => {
    const [error, setError] = useState<string | null>(null);
    const [sendingGift, setSendingGift] = useState<string | null>(null);
    const { sendTransaction } = useSendTransaction();
    const { wallets } = useWallets();
    const embeddedWallet = wallets.find(w => w.walletClientType === 'privy');

    
     
      
    const sendGift = async(gift:GiftOption)=>{
        setError(null);
        
        if (Number(tokenBalance)<=gift.coins) {
            setError(`Not enough balance to send "${gift.name}".`);
            return;
        }


        setSelectedGift(gift.name);
        setSendingGift(gift.name);
        try{
            const receipt = await sendTransaction(
                {
                    to:AUSD_ADDRESS as `0x${string}`,
                    data: encodeFunctionData({
                        abi: erc20Abi,
                        functionName: "transfer",
                        args: [recipient as `0x${string}`, parseUnits(gift.coins.toString(), 6)],
                    }),
                },
                {
                    address:walletAccount?.address,
                    sponsor:true,
                }
            
            )
              console.log("Receipt sent:", receipt);
        }catch(err){
            setError(err instanceof Error ? err.message : `Failed to send "${gift.name}".`);
            console.log(err)
        }finally{
            setSendingGift(null);
        }
    }
    


    
    
  return (
    <div className="grid grid-cols-4 gap-2">
        {giftOptions.map((gift) => (
            <Button
            key={gift.name}
            type="button"
            variant="ghost"
            onClick={() => sendGift(gift)}
            className={`h-24 cursor-pointer min-w-0 flex-col gap-1 rounded-xl border bg-sheet-soft px-1 text-primary-foreground hover:bg-sheet-soft/80 ${selectedGift === gift.name ? "border-coin" : "border-sheet-border"}`}
            >
                <span className="text-2xl" aria-hidden="true">{gift.icon}</span>
                <span className="max-w-full truncate text-xs font-semibold">{gift.name}</span>
                <span className="text-[11px] font-normal text-primary-foreground/80">{gift.coins} coins</span>
            </Button>
        ))}
    </div>
  )
}

export default GiftCard