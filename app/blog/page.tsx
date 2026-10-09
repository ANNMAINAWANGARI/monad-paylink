'use client';

import VideoWidget, { VideoWidgetGift } from '@/components/LiveVideoWidget';
import { AUSD_ADDRESS } from '@/lib/monad-tokens';
import { Button } from '@/components/ui/button';
import { usePrivy, useWallets, useSendTransaction } from '@privy-io/react-auth';
import { Check } from 'lucide-react';
import { useEffect, useRef, useState, useCallback } from 'react';
import { createPublicClient, encodeFunctionData, erc20Abi, formatUnits, Hex, http, parseUnits } from 'viem';
import { monadTestnet } from 'viem/chains';
import { useGiftBroadcast } from '@/hooks/useGiftBroadcast';

type Step = 'select' | 'mpesa' | 'converting' | 'success' | 'error';
type TokenPackage = { id: string; tokens: number; priceKes: number };

const publicClient = createPublicClient({
  chain: monadTestnet,
  transport: http(),
});

const DEFAULT_GIFTS: VideoWidgetGift[] = [
  { id: 'rose', icon: '🌹', label: 'Rose', price: 1 },
  { id: 'galaxy', icon: '🌌', label: 'Galaxy', price: 1 },
  { id: 'heart', icon: '💖', label: 'Heart', price: 1 },
  { id: 'star', icon: '⭐', label: 'Star', price: 1 },
  { id: 'fire', icon: '🔥', label: 'Fire', price: 1 },
  { id: 'sparkles', icon: '✨', label: 'Sparkles', price: 1 },
];


const COLUMN_WIDTH = 760;

const POST = {
  title: 'Metropolis Monad: Tipping a Creator with M-Pesa',
  subtitle: 'Watch the video, then support the creator with a gift paid for in M-Pesa.',
  author: 'zepor',
  date: 'October 9, 2026',
  readTime: '3 min read',
  intro:
    'Tipping a creator usually means a card, a currency you do not hold, or a platform that takes a large cut. This demo shows a different path: top up with M-Pesa, and send gifts that reach the creator directly while the video keeps playing.',
  sections: [
    {
      heading: 'How the video works',
      paragraphs: [
        'The player above is a normal video with a gift layer on top of it. Chapters let you jump between parts of the stream, and gifts appear on screen for everyone watching at the same moment they are sent.',
        'You can watch without signing in. You only need an account when you want to buy coins or send a gift.',
      ],
    },
    {
      heading: 'Topping up with M-Pesa',
      paragraphs: [
        'Pick a coin package and pay with M-Pesa. Behind the scenes, the payment is converted to AUSD on the Monad testnet and credited to a wallet created for you when you sign in. There is no wallet app to install and no seed phrase to store.',
        'Once the conversion finishes, the player shows a link to the transaction so you can check it yourself on the block explorer.',
      ],
    },
    {
      heading: 'Sending a gift',
      paragraphs: [
        'Each gift costs a small amount of AUSD, sent straight to the creator. Network fees are sponsored, so you never need to hold anything besides your balance.',
        'If your balance is too low, the page tells you which gift could not be sent and why, so you can top up and try again.',
      ],
    },
    {
      heading: 'What comes next',
      paragraphs: [
        'This is a testnet demo, so the coins have no real-world value yet. The next steps are live M-Pesa confirmation, a creator dashboard for gift history, and a catalogue creators can edit themselves.',
      ],
    },
  ],
};

export default function VideoWidgetDemo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [creatorEmail, setCreatorEmail] = useState('zeporchris@gmail.com');
  const [step, setStep] = useState<Step>('select');
  const [txHash, setTxHash] = useState<string | null>(null);
  const [selectedPkg, setSelectedPkg] = useState<TokenPackage | null>(null);
  const [balance, setBalance] = useState<string>('0');
  const [loading, setLoading] = useState<boolean>(true);
  const [giftError, setGiftError] = useState<string | null>(null);
  const { ready, authenticated, login, user } = usePrivy();
  const { wallets } = useWallets();
  const wallet = wallets.find((w) => w.walletClientType === 'privy');
  const { sendTransaction } = useSendTransaction();
  const { incomingGift, broadcastGift } = useGiftBroadcast('metropolis-demo');

  const fetchAusdBalance = useCallback(async (address: Hex) => {
    if (!AUSD_ADDRESS) {
      console.warn('AUSD address is undefined; skipping fetch.');
      return;
    }
    try {
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

      setBalance(formatUnits(rawBalance as bigint, decimals as number));
    } catch (error) {
      console.error('Error fetching AUSD balance:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (wallet?.address) {
      fetchAusdBalance(wallet.address as Hex);
    } else {
      setLoading(false);
    }
  }, [incomingGift?.uid, wallet?.address, fetchAusdBalance]);

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#0A0A0B',
        color: '#E9E7E2',
        padding: '48px 24px 96px',
      }}
    >
      <article style={{ width: '100%', maxWidth: COLUMN_WIDTH, margin: '0 auto' }}>
        {/* Post header */}
        <header style={{ margin: '0 0 32px' }}>
          <h1
            style={{
              fontSize: 'clamp(2rem, 5vw, 3.25rem)',
              lineHeight: 1.1,
              fontWeight: 700,
              letterSpacing: '-0.02em',
              margin: 0,
            }}
          >
            {POST.title}
          </h1>
          <p style={{ fontSize: '1.2rem', lineHeight: 1.5, color: '#A8A59E', margin: '16px 0 0' }}>
            {POST.subtitle}
          </p>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '4px 20px',
              marginTop: 20,
              fontSize: '0.9rem',
              color: '#7D7A74',
            }}
          >
            <span>By {POST.author}</span>
            <time>{POST.date}</time>
            <span>{POST.readTime}</span>
          </div>
        </header>

        {/* Video */}
        <div
          ref={containerRef}
          style={{
            position: 'relative',
            width: '100%',
            margin: '0 auto',
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
            title={POST.title}
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
            onGiftSend={async (pkg) => {
              setGiftError(null);
              if (Number(balance) <= pkg.price) {
                setGiftError(`Not enough balance to send "${pkg.label}".`);
                return;
              }
              try {
                if (!wallet) return alert('No embedded wallet found');
                const receipt = await sendTransaction(
                  {
                    to: AUSD_ADDRESS as `0x${string}`,
                    data: encodeFunctionData({
                      abi: erc20Abi,
                      functionName: 'transfer',
                      args: [
                        '0xc28eb78E64bfc91c9aA337331bB9C604C0d5030E' as `0x${string}`,
                        parseUnits(pkg.price.toString(), 6),
                      ],
                    }),
                  },
                  {
                    address: wallet?.address,
                    sponsor: true,
                  }
                );
                console.log(receipt);
                broadcastGift(pkg);
                if (wallet?.address) {
                  await fetchAusdBalance(wallet.address as Hex);
                }
              } catch (err) {
                setGiftError(err instanceof Error ? err.message : `Failed to send "${pkg.label}".`);
                console.log(err);
              }
            }}
            onGiftsChange={(gifts) => {
              console.log('gift catalog updated', gifts);
            }}
          />
        </div>

        {/* Gift errors were being set but never shown, so surface them under the video */}
        {giftError && (
          <p role="alert" style={{ margin: '16px 0 0', fontSize: '0.9rem', color: '#F87171' }}>
            {giftError}
          </p>
        )}

        {/* Post body */}
        <div
          style={{
            margin: '56px 0 0',
            fontFamily: 'Georgia, "Times New Roman", serif',
            fontSize: '1.125rem',
            lineHeight: 1.75,
            color: '#D6D3CC',
          }}
        >
          <p style={{ fontSize: '1.3rem', lineHeight: 1.6, color: '#E9E7E2', margin: 0 }}>{POST.intro}</p>

          {POST.sections.map((section) => (
            <section key={section.heading} style={{ marginTop: 48 }}>
              <h2
                style={{
                  fontFamily: 'inherit',
                  fontSize: '1.6rem',
                  lineHeight: 1.25,
                  fontWeight: 700,
                  color: '#F5F3EE',
                  margin: '0 0 16px',
                }}
              >
                {section.heading}
              </h2>
              {section.paragraphs.map((text, i) => (
                <p key={i} style={{ margin: '0 0 20px' }}>
                  {text}
                </p>
              ))}
            </section>
          ))}
        </div>
      </article>
    </main>
  );
}