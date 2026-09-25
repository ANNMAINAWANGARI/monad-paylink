'use client';

import VideoWidget, { VideoWidgetGift } from '@/components/LiveVideoWidget';
import { AUSD_ADDRESS } from '@/lib/monad-tokens';
import { Button } from '@/components/ui/button';
import { usePrivy, useWallets,useSendTransaction } from '@privy-io/react-auth';
import { Check, Loader2 } from 'lucide-react';
import { useEffect, useRef, useState, useCallback } from 'react';
import { createPublicClient, encodeFunctionData, erc20Abi, formatUnits, Hex, http, parseUnits } from 'viem';
import { monadTestnet } from 'viem/chains';
import Hls from 'hls.js';
import { useGiftBroadcast } from '@/hooks/useGiftBroadcast';


type Step = 'select' | 'mpesa' | 'converting' | 'success' | 'error';
type TokenPackage = { id: string; tokens: number; priceKes: number };

const publicClient = createPublicClient({
  chain: monadTestnet,
  transport: http(),
});
const DEFAULT_GIFTS: VideoWidgetGift[] = [
  { id: 'rose', icon: '🌹', label: 'Rose',price:1 },
  { id: 'galaxy', icon: '🌌', label: 'Galaxy',price: 1 },
  { id: 'heart', icon: '💖', label: 'Heart',price:1 },
  { id: 'star', icon: '⭐', label: 'Star',price:1 },
  { id: 'fire', icon: '🔥', label: 'Fire',price:1 },
  { id: 'sparkles', icon: '✨', label: 'Sparkles',price:1 },
];
const HLS_URL = 'https://demo.unified-streaming.com/k8s/live/scte35.isml/.m3u8';


export default function VideoWidgetDemo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [creatorEmail,setCreatorEmail] = useState('zeporchris@gmail.com')
  const [step, setStep] = useState<Step>('select');
  const [txHash, setTxHash] = useState<string | null>(null);
  const [selectedPkg, setSelectedPkg] = useState<TokenPackage | null>(null);
  const [balance, setBalance] = useState<string>('0');
  const [loading, setLoading] = useState<boolean>(true);
  const [giftError,setGiftError] = useState<string | null>(null);
  const { ready, authenticated, login,user } = usePrivy();
  const { wallets } = useWallets();
  const wallet = wallets.find((w) => w.walletClientType === 'privy');
  const { sendTransaction } = useSendTransaction();
  const { incomingGift, broadcastGift } = useGiftBroadcast('metropolis-demo');

  const fetchAusdBalance = useCallback(async (address: Hex) => {
    if (!AUSD_ADDRESS) {
    console.warn("AUSD address is undefined; skipping fetch.");
    return;
  }
    try {
      console.log(address,AUSD_ADDRESS)
      const [rawBalance, decimals] = await Promise.all([
        publicClient.readContract({
          address: AUSD_ADDRESS,
          abi: [
            {
              name: 'balanceOf',
              type: 'function',
              stateMutability: 'view',
              inputs: [{ name: 'account', type: 'address' }],
              outputs: [{ name: '', type: 'uint256' }],
            },
          ],
          functionName: 'balanceOf',
          args: [address],
        }),
        publicClient.readContract({
          address: AUSD_ADDRESS,
          abi: [
            {
              name: 'decimals',
              type: 'function',
              stateMutability: 'view',
              inputs: [],
              outputs: [{ name: '', type: 'uint8' }],
            },
          ],
          functionName: 'decimals',
        }),
      ]);

      const formatted = formatUnits(rawBalance as bigint, decimals as number);
      setBalance(formatted);
    } catch (error) {
      console.error('Error fetching AUSD balance:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Run once on load (and whenever the wallet address becomes available —
  // e.g. right after Privy finishes connecting it).
  useEffect(() => {
    if (wallet?.address) {
      fetchAusdBalance(wallet.address as Hex);
      
    } else {
      setLoading(false);
    }
  }, [incomingGift?.uid,wallet?.address,fetchAusdBalance]);


  

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#0A0A0B',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <div
        ref={containerRef}
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 960,
          aspectRatio: '16 / 9',
          background: '#000',
          borderRadius: 8,
          overflow: 'hidden',
        }}
      >
        
        <video
          ref={videoRef}
          src="https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4"
          poster="https://interactive-examples.mdn.mozilla.net/media/examples/flower-poster.jpg"
          style={{ width: '100%', height: '100%', display: 'block' }}
          playsInline
          
        />

        <VideoWidget
          videoRef={videoRef}
          containerRef={containerRef}
          title="Metropolis Monad Hackathon"
          creator="zeporchris@gmail.com"
          chapters={[
            { time: 0, label: 'Opening' },
            { time: 4, label: 'Bloom' },
            { time: 8, label: 'Closing' },
          ]}
          gifts={DEFAULT_GIFTS}
          isCreator={user?.email?.address === creatorEmail}
          tokenBalance={Number(balance)}
          isAuthenticated={ready && authenticated}
          incomingGift={incomingGift}
          onRequireAuth={login}
          purchaseStep={
            step === 'select' ? 'select' : step === 'success' ? 'success' : step === 'error' ? 'error' : 'processing'
          }
          processingLabel={
            step === 'mpesa'
              ? 'Processing your M-Pesa payment…'
              : step === 'converting'
              ? 'Converting to AUSD on Monad testnet…'
              : undefined
          }
          successContent={
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <Check className="size-8 text-teal" />
              <p className="text-lg font-semibold">{selectedPkg?.tokens ?? 0} coins added</p>
              {txHash && (
                <a
                  href={`https://testnet.monadscan.com/tx/${txHash}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-teal underline underline-offset-2"
                >
                  View transaction
                </a>
              )}
              <Button className="h-10 rounded-xl px-6" onClick={() => setStep('select')}>
                Done
              </Button>
            </div>
          }
          errorContent={
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <p className="text-sm text-red-400">Something went wrong. Try again.</p>
              <Button className="h-10 rounded-xl px-6" onClick={() => setStep('select')}>
                Back
              </Button>
            </div>
          }
          onBuyTokens={async (pkg) => {
            setSelectedPkg(pkg);
            setTxHash(null);
            setStep('mpesa');

            // Simulated M-Pesa wait 
            await new Promise((r) => setTimeout(r, 2500));
            setStep('converting');

            try {
              const res = await fetch('/api/topup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ my_address: wallet?.address, coins: Number(pkg.priceKes) }),
              });
              if (!res.ok) throw new Error('failed');
              const data = await res.json();
              setTxHash(data.txHash);
              setStep('success');
              if (wallet?.address) {
                await fetchAusdBalance(wallet.address as Hex);
              }
            } catch {
              setStep('error');
            }
          }}
          onGiftSend={async(pkg)=>{
            setGiftError(null);
            if(Number(balance)<=pkg.price){
              setGiftError(`Not enough balance to send "${pkg.label}".`)
              return;
            }
            try{
              if (!wallet) return alert('No embedded wallet found');
              const receipt = await sendTransaction(
                {
                  to: AUSD_ADDRESS as `0x${string}`,
                  data:encodeFunctionData({
                    abi: erc20Abi,
                    functionName: "transfer",
                    args: ['0xc28eb78E64bfc91c9aA337331bB9C604C0d5030E' as `0x${string}`, parseUnits(pkg.price.toString(), 6)],
                  }),
                },{
                  address: wallet?.address,
                  sponsor:true,
                }
              )
             console.log(receipt)
             broadcastGift(pkg);
             if (wallet?.address) {
              await fetchAusdBalance(wallet.address as Hex); 
             }
            }catch(err){
              setGiftError(err instanceof Error ? err.message : `Failed to send "${pkg.label}".`);
              console.log(err)
            }
          }}
          onGiftsChange={(gifts) => {
            
            console.log('gift catalog updated', gifts);
          }}
        />
      </div>
    </main>
  );
}