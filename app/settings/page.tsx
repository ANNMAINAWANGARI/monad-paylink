'use client';

import { usePrivy } from '@privy-io/react-auth';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';



const ACCENT = '#E8A33D';
const BG = '#0A0A0B';
const PANEL = '#121213';
const TEXT = '#F2F0EB';
const MUTED = '#B8B3AC';
const BORDER = 'rgba(242,240,235,0.12)';

function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 40);
}

function buildSnippet(streamId: string, creatorEmail: string): string {
  return `import LiveVideoWidget from '@/components/LiveVideoWidget';
import { useRef } from 'react';

export default function MyStream() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={containerRef} style={{ position: 'relative', aspectRatio: '16 / 9' }}>
      <video ref={videoRef} playsInline muted autoPlay style={{ width: '100%', height: '100%' }} />

      <LiveVideoWidget
        videoRef={videoRef}
        containerRef={containerRef}
        streamId="${streamId}"
        creator="${creatorEmail || 'you@example.com'}"
        title="My stream"
      />
    </div>
  );
}`;
}

export default function SettingsPage() {
  const { ready, authenticated, user } = usePrivy();
  const router = useRouter();

  const creatorEmail = user?.email?.address ?? '';
  const [streamName, setStreamName] = useState('my-stream');
  const [copied, setCopied] = useState(false);

  const streamId = useMemo(() => slugify(streamName) || 'my-stream', [streamName]);
  const snippet = useMemo(() => buildSnippet(streamId, creatorEmail), [streamId, creatorEmail]);

  // Keep this page creator-only; bounce anyone not logged in back home.
  useEffect(() => {
    if (ready && !authenticated) router.push('/');
  }, [ready, authenticated, router]);

  const copySnippet = async () => {
    try {
      await navigator.clipboard.writeText(snippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API can fail (permissions, non-secure context) — fail quietly,
      // the code is still selectable and copyable by hand.
    }
  };

  if (!ready || !authenticated) {
    return (
      <main style={{ minHeight: '100vh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: MUTED, fontFamily: "'Inter', sans-serif", fontSize: 13 }}>Loading…</p>
      </main>
    );
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        background: BG,
        color: TEXT,
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        padding: '48px 20px',
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      <div style={{ width: '100%', maxWidth: 640 }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600 }}>Your widget 
            <Link href="/livevideo" target="_blank" className="text-amber-600 text-sm border border-amber-500 ml-2 p-2 rounded">DEMO</Link></h1>
          <p style={{ margin: '6px 0 0', fontSize: 13.5, color: MUTED }}>
            Signed in as {creatorEmail || 'your account'}. Name your stream, then copy the snippet into your app.
          </p>
        </div>

        <section
          style={{
            background: PANEL,
            border: `1px solid ${BORDER}`,
            borderRadius: 10,
            padding: 20,
            marginBottom: 20,
          }}
        >
          <label htmlFor="stream-name" style={{ display: 'block', fontSize: 12.5, color: MUTED, marginBottom: 8 }}>
            Stream name
          </label>
          <input
            id="stream-name"
            value={streamName}
            onChange={(e) => setStreamName(e.target.value)}
            placeholder="my-stream"
            style={{
              width: '100%',
              background: '#0A0A0B',
              border: `1px solid ${BORDER}`,
              borderRadius: 7,
              color: TEXT,
              padding: '9px 12px',
              fontSize: 14,
              marginBottom: 6,
            }}
          />
          <p style={{ margin: 0, fontSize: 12, color: MUTED }}>
            Stream id: <code style={{ color: ACCENT }}>{streamId}</code>
          </p>
        </section>

        <section
          style={{
            background: PANEL,
            border: `1px solid ${BORDER}`,
            borderRadius: 10,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              borderBottom: `1px solid ${BORDER}`,
            }}
          >
            <span style={{ fontSize: 12.5, color: MUTED }}>Embed snippet</span>
            <button
              onClick={copySnippet}
              style={{
                background: copied ? 'rgba(61,214,140,0.15)' : 'rgba(242,240,235,0.08)',
                border: `1px solid ${copied ? 'rgba(61,214,140,0.4)' : BORDER}`,
                color: copied ? '#3DD68C' : TEXT,
                borderRadius: 6,
                padding: '6px 12px',
                fontSize: 12.5,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <pre
            style={{
              margin: 0,
              padding: 16,
              fontSize: 12.5,
              lineHeight: 1.6,
              overflowX: 'auto',
              fontFamily: "'SF Mono', 'Fira Code', Menlo, monospace",
              color: TEXT,
            }}
          >
            <code>{snippet}</code>
          </pre>
        </section>

        <p style={{ marginTop: 20, fontSize: 12.5, color: MUTED }}>
          Before gifting works, register this stream on-chain once: <code style={{ color: ACCENT }}>createStream</code>{' '}
          and <code style={{ color: ACCENT }}>setGiftPrice</code> for each gift, from your creator wallet.
        </p>
      </div>
    </main>
  );
}