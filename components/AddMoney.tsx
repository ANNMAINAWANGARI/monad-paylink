'use client'

import { Button } from './ui/button';
import { Check, Smartphone } from "lucide-react";

interface CoinOption{
    coins:number;
    price:string;
}

interface AddMoneyInterface {
    coinOptions: CoinOption[];
    setSelectedCoins: (coins:number)=>void;
    selectedCoins:number;
}

const AddMoney = ({coinOptions, selectedCoins, setSelectedCoins}:AddMoneyInterface) => {
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
        <Button  className="h-11 w-full rounded-xl text-base ">Confirm on M-Pesa</Button>
    </div>
  )
}

export default AddMoney