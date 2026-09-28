'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import PusherClient from 'pusher-js';
import type { VideoWidgetGift, VideoWidgetGoal } from '@/components/LiveVideoWidget';

type GiftEvent = { uid: string; gift: VideoWidgetGift; senderId?: string };

export function useLiveStream(streamId: string) {
  const clientIdRef = useRef(`c_${Math.random().toString(36).slice(2, 10)}`);
  const [incomingGift, setIncomingGift] = useState<{ uid: string; gift: VideoWidgetGift } | null>(null);
  const [goal, setGoal] = useState<VideoWidgetGoal | null>(null);

  useEffect(() => {
    const pusher = new PusherClient(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    });
    const channel = pusher.subscribe(`live-${streamId}`);

    channel.bind('gift', (data: GiftEvent) => {
      if (data.senderId === clientIdRef.current) return; // skip my own echo
      setIncomingGift({ uid: data.uid, gift: data.gift });
    });
    channel.bind('goal-update', (g: VideoWidgetGoal) => setGoal({ ...g }));

    return () => {
      pusher.unsubscribe(`live-${streamId}`);
      pusher.disconnect();
    };
  }, [streamId]);

  // Late joiners: load current progress instead of starting at 0
  useEffect(() => {
    fetch(`/api/live/goal?streamId=${encodeURIComponent(streamId)}`)
      .then((r) => r.json())
      .then((d) => setGoal(d.goal))
      .catch(() => {});
  }, [streamId]);

  const broadcastGift = useCallback(
    async (gift: VideoWidgetGift, txHash: string) => {
      const uid = `${gift.id}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      await fetch('/api/live/gift', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ streamId, uid, gift, senderId: clientIdRef.current, txHash }),
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

  return { incomingGift, broadcastGift, goal, setStreamGoal };
}