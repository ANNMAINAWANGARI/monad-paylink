'use client'
import { Button } from './ui/button';

interface GiftOption {
    icon: string;
    name: string;
    coins: number;
}

interface GiftCardInterface {
    giftOptions: GiftOption[];
    selectedGift: string;
    setSelectedGift: (giftName: string) => void;
}

const GiftCard = ({giftOptions, selectedGift,setSelectedGift}:GiftCardInterface) => {
  return (
    <div className="grid grid-cols-4 gap-2">
        {giftOptions.map((gift) => (
            <Button
            key={gift.name}
            type="button"
            variant="ghost"
            onClick={() => setSelectedGift(gift.name)}
            className={`h-24 min-w-0 flex-col gap-1 rounded-xl border bg-sheet-soft px-1 text-primary-foreground hover:bg-sheet-soft/80 ${selectedGift === gift.name ? "border-coin" : "border-sheet-border"}`}
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