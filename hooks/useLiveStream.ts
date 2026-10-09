'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import PusherClient from 'pusher-js';
import type {
  VideoWidgetGift,
  VideoWidgetGoal,
  VideoWidgetFeedItem,
} from '@/components/LiveVideoWidget';

type GiftEvent = VideoWidgetFeedItem & { senderId?: string };

export function useLiveStream(streamId: string) {
  const clientIdRef = useRef(`c_${Math.random().toString(36).slice(2, 10)}`);
  const [incomingGift, setIncomingGift] = useState<{ uid: string; gift: VideoWidgetGift } | null>(null);
  const [goal, setGoal] = useState<VideoWidgetGoal | null>(null);
  const [feed, setFeed] = useState<VideoWidgetFeedItem[]>([]);

  const addToFeed = useCallback((item: VideoWidgetFeedItem) => {
    setFeed((prev) => (prev.some((p) => p.uid === item.uid) ? prev : [...prev, item].slice(-30)));
  }, []);

  useEffect(() => {
    const pusher = new PusherClient(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    });
    const channel = pusher.subscribe(`live-${streamId}`);

    channel.bind('gift', (data: GiftEvent) => {
      // the feed shows everyone's gifts, including my own
      addToFeed({ uid: data.uid, name: data.name, gift: data.gift, amount: data.amount });
      // the float animation already played locally for the sender, so skip my echo
      if (data.senderId === clientIdRef.current) return;
      setIncomingGift({ uid: data.uid, gift: data.gift });
    });
    channel.bind('goal-update', (g: VideoWidgetGoal) => setGoal({ ...g }));

    return () => {
      pusher.unsubscribe(`live-${streamId}`);
      pusher.disconnect();
    };
  }, [streamId, addToFeed]);

  // Late joiners: load current goal progress and recent gifts
  useEffect(() => {
    const q = `streamId=${encodeURIComponent(streamId)}`;
    fetch(`/api/live/goal?${q}`)
      .then((r) => r.json())
      .then((d) => setGoal(d.goal))
      .catch(() => {});
    fetch(`/api/live/gift?${q}`)
      .then((r) => r.json())
      .then((d) =>
        setFeed((prev) => {
          const seen = new Set(prev.map((p) => p.uid));
          const history = (d.feed as VideoWidgetFeedItem[]).filter((f) => !seen.has(f.uid));
          return [...history, ...prev].slice(-30);
        })
      )
      .catch(() => {});
  }, [streamId]);

  const broadcastGift = useCallback(
    async (gift: VideoWidgetGift, txHash: string, name?: string) => {
      const uid = `${gift.id}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      await fetch('/api/live/gift', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ streamId, uid, gift, senderId: clientIdRef.current, txHash, name }),
      }).catch((err) => console.error('broadcastGift failed', err));
    },
    [streamId]
  );

  const setStreamGoal = useCallback(
    async (title: string, target: number) => {
      await fetch('/api/live/goal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ streamId, title, target }),
      });
    },
    [streamId]
  );

  return { incomingGift, broadcastGift, goal, setStreamGoal, feed };
}