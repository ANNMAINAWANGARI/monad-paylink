# Live Gifts — On-Chain Livestream Gifting Widget

A React video-overlay widget that turns any livestream into a monetized, on-chain social experience — real-time gifting, creator fundraising goals, and a live activity feed, all settled on [Monad](https://monad.xyz).

---

## What this is

This is **not** a standalone video player. It's a widget that sits on top of any existing HTML5 `<video>` element — you hand it a `videoRef` and a `containerRef`, and it renders custom controls plus a gifting/social layer over the video, without ever owning or replacing the `<video>` tag itself.

Two variants ship in this repo:

| Component | Use case |
|---|---|
| `VideoWidget` | General-purpose player overlay for recorded video. Includes playback controls, tokens, and gifting. |
| `LiveVideoWidget` | Extends the above for actual live streams — adds the creator goal bar and live gift feed, synced across viewers in real time. |

## Why Monad

Gifting is a **bursty, latency-sensitive, mostly-independent** workload: during a viral moment, many different viewers gift at the same instant, often to different creators. That's exactly the pattern Monad's **parallel execution** is built for — unrelated transactions run concurrently instead of queuing one after another.

- **Parallel execution** → a burst of simultaneous gifts from different viewers doesn't bottleneck the way it would on a sequential-execution chain.
- **Sub-second finality** → a tapped gift confirms fast enough to feel live, not pending.
- **Sub-cent fees** → gas sponsorship on a $0.10 gift is economically viable in the first place.
- **Full EVM compatibility** → built with standard Solidity, viem, and existing wallet tooling — no new VM to learn.

A **load-test panel** (see below) exists specifically to demonstrate this live: it fires gifts from many independent wallets concurrently and reports real confirmation times, rather than just asserting the throughput claim.

> **Honest caveat:** gifts to the *same* stream currently write to one shared on-chain counter (`streams[id].raised`), so within a single stream, those specific writes serialize rather than parallelize. The parallelism gain is real across **different** streams/creators. Sharding the per-stream counter is a known next step — see [Roadmap](#roadmap).

---

## Features

- 🎥 Full video controls — play/pause, scrub with chapter ticks, volume, speed, captions, fullscreen, Picture-in-Picture
- 📡 Live mode — auto-detects a live stream (infinite `duration`), shows a LIVE badge, and a DVR "go live" button when a rewind window exists
- 🎁 Gifting — animated gift icons that float over the video when sent
- 💰 Token economy — buy tokens via a fiat on-ramp (demoed with simulated M-Pesa) that converts to AUSD on Monad
- ⛓️ On-chain settlement — gifts are real AUSD transfers, verified against the transaction receipt (or via a dedicated smart contract) before being broadcast to other viewers
- 🔄 Real-time multi-viewer sync — every viewer sees the same gift animate via Pusher, with the sender's own tab excluded from the echo
- 🎯 Creator goals — a Twitch-style fundraising goal bar that fills live as verified gifts arrive
- 📜 Live gift feed — a ticker showing "so-and-so sent a Rose 🌹" as it happens
- 🧪 Load-test panel — fires concurrent gifts from throwaway wallets to visualize Monad's parallel throughput live
- 👤 Creator tools — manage gift icon/price catalog, set goals, from an in-widget settings panel

---

## Architecture

```
┌─────────────────────────────────────────────┐
│  <video>  (yours — src, poster, whatever)    │
│  ┌─────────────────────────────────────────┐ │
│  │  VideoWidget / LiveVideoWidget           │ │
│  │  (controls, gifts, tokens, goal, feed)   │ │
│  └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
           │ callbacks: onGiftSend, onBuyTokens,
           │ onSetGoal, onGiftsChange
           ▼
┌─────────────────────────────────────────────┐
│  Your app (page.tsx)                         │
│  - Privy embedded wallet + gas sponsorship   │
│  - viem (sendTransaction / writeContract)    │
│  - useLiveStream hook (Pusher client)        │
└─────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────┐
│  Server routes                               │
│  - /api/live/gift   verifies tx receipt,     │
│    broadcasts via Pusher, updates goal       │
│  - /api/live/goal   creator sets/reads goal  │
│  - /api/live/fund   funds load-test wallets  │
└─────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────┐
│  Monad testnet                               │
│  - AUSD (ERC-20)                             │
│  - LiveGifts contract (goal + gift pricing)  │
└─────────────────────────────────────────────┘
```

The widget component itself has **no knowledge of Monad, Privy, or Pusher** — it only knows about gifts, callbacks, and optimistic UI state. All chain-specific logic lives in the consuming page and server routes, which is what makes it reasonably close to SDK-shaped despite being demoed inside one app.

---

## Tech stack

- **Frontend:** Next.js (App Router), React, TypeScript
- **Wallets & gas sponsorship:** [Privy](https://privy.io) embedded wallets
- **Chain interaction:** [viem](https://viem.sh)
- **Chain:** Monad testnet
- **Token:** AUSD (ERC-20, 6 decimals)
- **Realtime sync:** [Pusher Channels](https://pusher.com)
- **Live video:** hls.js (for actual HLS live streams)
- **Smart contract:** Solidity, OpenZeppelin

---

## Project structure

```
components/
  VideoWidget.tsx          # VOD player overlay (controls, tokens, gifts)
  LiveVideoWidget.tsx       # Live variant (+ goal bar, + live feed)
  LoadTestPanel.tsx         # Concurrent-gift throughput demo

hooks/
  useGiftBroadcast.ts       # Pusher sync for the VOD/basic gifting demo
  useLiveStream.ts          # Pusher sync + goal/feed for live streams

lib/
  monad-tokens.ts           # AUSD_ADDRESS etc.
  pusher-server.ts          # Shared Pusher server client
  live/
    config.ts               # LIVE_GIFTS_ADDRESS, LIVE_GIFTS_ABI, creator address
    goalStore.ts            # In-memory goal/feed/seen-tx state (swap for Redis in prod)

contracts/
  LiveGifts.sol             # On-chain goal + gift pricing + GiftSent event

app/
  page.tsx                  # VOD demo page
  live/page.tsx             # Live stream demo page (LiveVideoWidgetDemo)
  api/
    gift-broadcast/route.ts # VOD gift broadcast (Pusher only)
    live/
      gift/route.ts         # Verifies tx receipt → broadcasts → updates goal
      goal/route.ts         # Creator sets goal / viewers read current progress
      fund/route.ts         # Funds load-test burner wallets (server-only key)
    topup/route.ts           # Simulated M-Pesa → AUSD top-up
```

---

## Getting started

### 1. Install

```bash
npm install
npm i hls.js pusher pusher-js
```

### 2. Environment variables

```env
# Pusher
PUSHER_APP_ID=
PUSHER_KEY=
PUSHER_SECRET=
PUSHER_CLUSTER=
NEXT_PUBLIC_PUSHER_KEY=
NEXT_PUBLIC_PUSHER_CLUSTER=

# Privy
NEXT_PUBLIC_PRIVY_APP_ID=

# Load-test panel only — testnet-only wallet, small balance, NEVER client-exposed
FUNDER_PRIVATE_KEY=
```

### 3. Run

```bash
npm run dev
```

- VOD demo: `http://localhost:3000`
- Live demo: `http://localhost:3000/live`

### 4. One-time on-chain setup (live demo only)

Before gifting works on a stream, the creator wallet must register it:

```ts
await createStream(streamId);
await setGiftPrice(streamId, giftId("rose"), parseUnits("1", 6));
// ...repeat setGiftPrice for each gift in your catalog
```

`sendGift` reverts with `UnknownGift` if a stream or gift price hasn't been registered, and `setGoal` reverts with `NotCreator` unless called by the wallet that ran `createStream`.

---

## How a gift actually works (live mode)

1. Viewer taps a gift → client checks local balance → calls `sendTransaction` (Privy, gas-sponsored) against either a direct AUSD transfer or the `LiveGifts` contract's `sendGift`.
2. Client gets a tx hash back, optimistically animates the gift locally, and POSTs `{ streamId, gift, txHash, senderId }` to `/api/live/gift`.
3. Server waits for the receipt, parses the `Transfer` (or `GiftSent`) log, confirms the recipient and amount match what's claimed, and rejects anything that doesn't check out or has already been counted.
4. Server broadcasts the verified event over Pusher and increments the stream's goal progress using the **on-chain amount**, not the client's claim.
5. Every other viewer's Pusher subscription receives the event — their copy of the widget animates the gift, updates the goal bar, and appends to the feed.

This means the UI is optimistic for the sender (instant feedback) but **the source of truth for every other viewer, and for the goal bar, is always the verified on-chain transaction** — nobody can inflate the feed or goal by calling the API directly without a real matching transfer.

---

## The load-test panel

A creator-only panel that:

1. Generates N throwaway wallets
2. Funds each with testnet MON (gas) + AUSD (gift budget) via the server
3. Approves the `LiveGifts` contract from each wallet
4. Fires `sendGift` from all wallets **concurrently** (`Promise.allSettled`)
5. Times submission → confirmation per wallet and reports the aggregate

This exists to make the "Monad is fast because of parallel execution" claim visible and falsifiable in the room, instead of asserted on a slide.

---

## Roadmap

- [ ] Shard the per-stream `raised` counter so concurrent gifts to the *same* stream also parallelize cleanly, not just gifts across different streams
- [ ] Verify the caller's identity on `/api/live/goal` (currently anyone can POST a goal update directly)
- [ ] Replace in-memory `goalStore` with Redis for multi-instance / production deployment
- [ ] Derive goal progress directly from on-chain `GiftSent` logs instead of a server-maintained counter
- [ ] All-or-nothing goal variant: escrow gifts until a goal is hit or a deadline passes, with refunds if it isn't
- [ ] Extract `VideoWidget` into a standalone, published package with zero chain-specific dependencies (groundwork is mostly already in place — see Architecture)
- [ ] Cross-device realtime sync is already implemented via Pusher; add presence (live viewer count) next

---

## Known limitations (said out loud on purpose)

- Display names in the gift feed are client-supplied and unverified — the server falls back to the shortened wallet address, which **is** verified.
- The goal/feed state store is in-memory (`globalThis` map) — fine for a single dev server or demo, not for a multi-instance production deployment.
- The first gift from any wallet requires an on-chain `approve` before `sendGift` will succeed; subsequent gifts don't.
- Gifts within one stream currently contend over a single counter — see the Why Monad caveat above.
- Onramp/Pfframp does not work on mainnet yet

---

