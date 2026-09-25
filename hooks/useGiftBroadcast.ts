"use client"
import { VideoWidgetGift } from '@/components/LiveVideoWidget';
import PusherClient from 'pusher-js';
import { useCallback, useEffect, useRef, useState } from 'react';

export function useGiftBroadcast(streamId: string) {
  const pusherRef = useRef<PusherClient | null>(null);
  const [incomingGift, setIncomingGift] = useState<{ uid: string; gift: VideoWidgetGift } | null>(null);

  useEffect(() => {
    const pusher = new PusherClient(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    });
    pusherRef.current = pusher;

    const channel = pusher.subscribe(`stream-${streamId}`);
    channel.bind('gift', (data: { uid: string; gift: VideoWidgetGift }) => {
      setIncomingGift(data);
    });
    

    return () => {
      pusher.unsubscribe(`stream-${streamId}`);
      pusher.disconnect();
    };
  }, [streamId]);

  const broadcastGift = useCallback(
    async (gift: VideoWidgetGift) => {
      const uid = `${gift.id}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      try {
        await fetch('/api/gift-broadcast', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ streamId, uid, gift }),
        });
      } catch (err) {
        console.error('broadcastGift failed', err);
      }
    },
    [streamId]
  );

  return { incomingGift, broadcastGift };
}