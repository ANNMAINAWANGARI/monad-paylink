'use client'
import { useEffect,useState } from 'react'
import { useGetWalletAccounts, useUser } from "@dynamic-labs-sdk/react-hooks";
import { Button } from '@/components/ui/button';
import GiftCard from '@/components/GiftCard';
import AddMoney from '@/components/AddMoney';
import { X } from "lucide-react";

interface VideoFeedItem {
  id: string;
  creatorAddress: string;
  title: string;
  location: string;
  views: string;
  coins: number;
}

interface OpenSheet {
  id: string;
  sheet: "money" | "gift";
}

const sheetTitle = { money: "Add money", gift: "Send a gift" };

const giftOptions = [
  { icon: "🌹", name: "Rose", coins: 1 },
  { icon: "🍦", name: "Ice cream", coins: 1 },
  { icon: "❤️", name: "Heart", coins: 5 },
  { icon: "🤞", name: "Finger heart", coins: 5 },
  { icon: "😎", name: "Sunglasses", coins: 199 },
  { icon: "🎂", name: "Birthday cake", coins: 300 },
  { icon: "🚀", name: "Rocket", coins: 500 },
  { icon: "🪩", name: "Galaxy", coins: 1000 },
];

const coinOptions = [
  { coins: 100, price: "KES 190" },
  { coins: 500, price: "KES 950" },
  { coins: 1000, price: "KES 1,900" },
  { coins: 2000, price: "KES 3,800" },
];

const DashboardPage = () => {
  const { data: walletAccounts = [] } = useGetWalletAccounts();
  const { data: user } = useUser();
  const walletAccount = walletAccounts[0];
  const [openSheet, setOpenSheet] = useState<OpenSheet | null>(null);
  const [selectedCoins, setSelectedCoins] = useState(500);
  const [selectedGift, setSelectedGift] = useState("Finger heart");
  const [feeds, setFeeds] = useState<VideoFeedItem[]>([
    {
      id: '1',
      creatorAddress: '0x123...4567',
      title: "Jamie & Biscuit",
      location: "Austin, TX · Biscuit's birthday stream",
      views: "1,204",
      coins: 250,
    },
    {
      id: '2',
      creatorAddress: '0x123...4567',
      title: "Jamie & Biscuit",
      location: "Austin, TX · Biscuit's birthday stream",
      views: "1,204",
      coins: 250,
    },
    {
      id: '3',
      creatorAddress: '0x123...4567',
      title: "Jamie & Biscuit",
      location: "Austin, TX · Biscuit's birthday stream",
      views: "1,204",
      coins: 250,
    },
    {
      id: '4',
      creatorAddress: '0x123...4567',
      title: "Jamie & Biscuit",
      location: "Austin, TX · Biscuit's birthday stream",
      views: "1,204",
      coins: 250,
    },
    {
      id: '5',
      creatorAddress: '0x123...4567',
      title: "Jamie & Biscuit",
      location: "Austin, TX · Biscuit's birthday stream",
      views: "1,204",
      coins: 250,
    }
  ]);

  useEffect(() => {
    console.log("Wallet Accounts in Chrome:", walletAccounts);
    console.log("User in Chrome:", user);
  }, [walletAccounts]);

  const handleCreateFeed = () => {
    if (!walletAccount) {
      alert("Please connect your wallet first!");
      return;
    }

    const newFeed: VideoFeedItem = {
      id: Date.now().toString(),
      creatorAddress: walletAccount?.address,
      title: `Stream by ${user?.email}`,
      location: "Live Location · New Stream",
      views: "1",
      coins: 0,
    };

    setFeeds((prev) => [newFeed, ...prev]);
  };
  

  return (
    <div className="min-h-screen  px-4 py-6 bg-black">
       <main className="mx-auto max-w-md space-y-6">
        <div className="flex items-center justify-between ">
          <h1 className="text-2xl font-bold text-white">Live Feeds</h1>
          <button
            onClick={handleCreateFeed}
            className="rounded-full bg-white px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-white/90 cursor-pointer"
          >
            Create Feed
          </button>
        </div>
        {feeds.map((item)=>(
          <div
          key={item.id}
          className="relative w-full max-w-md aspect-7/11  rounded-3xl  bg-linear-to-b from-purple-900/40 via-slate-900/80 to-slate-950 border border-slate-800 flex flex-col justify-between p-4 shadow-2xl">
            {/* Top Bar inside Card */}
            <div className="flex justify-between items-center z-10">
              <div className="flex items-center gap-2">
                <span className="bg-slate-800/80 p-1.5 rounded-full text-xs">⏸</span>
                <span className="bg-rose-500 text-xs font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> LIVE
                </span>
                <span className="bg-slate-900/80 text-xs px-2 py-0.5 rounded-md text-slate-300">
                  {item.views} watching
                </span>
              </div>
              <Button
               className="bg-slate-500/80 text-xs font-bold px-3 py-1 rounded-full border border-slate-700 flex items-center gap-1"
               onClick={() => setOpenSheet({ id: item.id, sheet: "money" })}>
                {item.coins} coins <span className="text-amber-400">⊕</span>
              </Button>
            </div>
            {/* Bottom Details (Creator & Caption) */}
            <div className="z-10 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-400/20 border border-amber-400/50 flex items-center justify-center font-bold text-amber-400">
                  🐱
                </div>
                <div>
                  <h3 className="font-semibold text-sm leading-tight text-slate-300">{item.title}</h3>
                  <p className="text-xs text-slate-400">{item.location}</p>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                    Creator: {item.creatorAddress.slice(0, 6)}...{item.creatorAddress.slice(-4)}
                  </p>
                </div>
              </div>
              {/* Chat Input Bar */}
              <div className="flex gap-2 items-center pt-2">
                <input
                  type="text"
                  placeholder="Say something..."
                  className="flex-1 bg-slate-900/60 border border-slate-700/60 rounded-full px-4 py-2 text-xs text-white focus:outline-none focus:border-slate-500"
                />
                <button className="bg-amber-400 text-black px-4 py-2 rounded-full text-xs font-bold flex items-center gap-1" onClick={() => setOpenSheet({ id: item.id, sheet: "gift" })}>
                  🎁 Gift
                </button>
              </div>
              {openSheet?.id === item.id && (
                <div className="absolute inset-0 z-20 flex flex-col justify-end rounded-3xl bg-foreground/35 p-3" onClick={() => setOpenSheet(null)}>
                  <section role="dialog" aria-modal="true" aria-label={sheetTitle[openSheet.sheet]} className="w-full rounded-2xl border border-sheet-border bg-sheet px-4 pb-4 pt-3 text-primary-foreground shadow-2xl" onClick={(event) => event.stopPropagation()}>
                    <div className="mb-3 flex items-center justify-between">
                      <h2 className="font-serif text-lg font-bold">{sheetTitle[openSheet.sheet]}</h2>
                      <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-sheet-soft" onClick={() => setOpenSheet(null)} aria-label="Close">
                        <X className="size-5" />
                    </Button>
                    </div>
                    {openSheet.sheet === "money" ? (<><AddMoney coinOptions={coinOptions} selectedCoins={selectedCoins} setSelectedCoins={setSelectedCoins}/></>):(<><GiftCard giftOptions={giftOptions} selectedGift={selectedGift} setSelectedGift={setSelectedGift}/></>)}
                  </section>
                </div>
              )}
            </div>
            
          </div>
        ))}
       </main>
    </div>
  )
}

export default DashboardPage