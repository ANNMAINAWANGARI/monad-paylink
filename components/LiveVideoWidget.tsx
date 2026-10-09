'use client';

/**
 * VideoWidget
 * ------------------------------------------------------------------
 * A drop-in control overlay for any standard HTML5 <video> element.
 *
 * It does not render or manage the <video> tag itself — you keep full
 * control of the source, poster, preload strategy, etc. Instead you
 * pass a ref to your existing <video> element and this widget renders
 * a positioned overlay on top of it with custom controls, wired up
 * via the standard HTMLMediaElement API. That's what makes it work
 * with "a standard video player": any element that is (or wraps) a
 * real <video> node works, including most player libraries that
 * expose the underlying element via a ref or `.media`/`.el` property.
 *
 * Usage:
 *
 *   const videoRef = useRef<HTMLVideoElement>(null);
 *   const containerRef = useRef<HTMLDivElement>(null);
 *
 *   <div ref={containerRef} style={{ position: 'relative' }}>
 *     <video ref={videoRef} src="/movie.mp4" playsInline />
 *     <VideoWidget videoRef={videoRef} containerRef={containerRef} />
 *   </div>
 *
 * Set the wrapping element to `position: relative` (or pass your own
 * via containerRef) so the overlay can position itself with `inset: 0`.
 */

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from 'react';

export interface VideoWidgetChapter {
  /** Chapter start time, in seconds. */
  time: number;
  /** Short chapter label shown in the scrub tooltip. */
  label: string;
}

export interface VideoWidgetGift {
  /** Stable identifier, passed back in onGiftSend. */
  id: string;
  /** Emoji or short glyph shown as the icon. */
  icon: string;
  /** Label shown under the icon in the tray. */
  label: string;
  price: number;
}


export interface VideoWidgetTokenPackage {
  id: string;
  tokens: number;
  priceKes: number;
}

export interface VideoWidgetGoal {
  title: string;
  target: number;
  current: number;
}

const DEFAULT_TOKEN_PACKAGES: VideoWidgetTokenPackage[] = [
  { id: 'pkg-500', tokens: 500, priceKes: 500 },
  { id: 'pkg-400', tokens: 400, priceKes: 400 },
  { id: 'pkg-200', tokens: 200, priceKes: 200 },
];

export interface VideoWidgetProps {
  /** Ref to the underlying <video> element this widget controls. */
  videoRef: RefObject<HTMLVideoElement | null>;
  creator: string;
  /**
   * Ref to the element that should go fullscreen and that PiP/hover
   * detection is scoped to. Defaults to the video element itself.
   */
  containerRef?: RefObject<HTMLElement | null>;
  /** Optional chapter markers rendered as ticks on the scrub bar. */
  chapters?: VideoWidgetChapter[];
  /** Optional title shown in the top-left when controls are visible. */
  title?: string;
  /** Available speeds in the playback-rate menu. */
  speeds?: number[];
  /** Milliseconds of inactivity before controls auto-hide during playback. */
  autoHideMs?: number;
  /** Accent color for the scrub head, progress fill, and focus rings. */
  accent?: string;
  /** Gifts shown in the gift tray. Defaults to rose/galaxy/heart/star/fire/sparkles. */
  gifts: VideoWidgetGift[];
  /** Called when a viewer taps a gift. Wire this to your own backend/analytics. */
  onGiftSend?: (gift: VideoWidgetGift) => void;
  /** Set false to hide the gift button entirely. */
  showGifts?: boolean;
  /**
   * Force live mode on or off. Leave unset to auto-detect from the video's
   * `duration` (live streams report Infinity/NaN). Only needed if your
   * source briefly reports a finite duration before the stream settles.
   */
  live?: boolean;
  incomingGift?: { uid: string; gift: VideoWidgetGift } | null;
  goal?: VideoWidgetGoal | null;
  onSetGoal?: (title: string, target: number) => void;
  feed?: VideoWidgetFeedItem[];

  /** Set false to hide the token balance pill entirely. */
  showTokens?: boolean;
  /**
   * Current token balance. Pass this to control the balance yourself
   * (e.g. fetched from your backend) — the widget will then only ever
   * call `onBuyTokens` and leave updating the number to you. Omit it to
   * let the widget track its own balance locally, starting from
   * `initialTokenBalance`, which is convenient for prototyping without a
   * backend.
   */
  tokenBalance?: number;
  /** Starting balance when `tokenBalance` is left uncontrolled. Default 0. */
  initialTokenBalance?: number;
  /** Called whenever the balance changes, controlled or not. */
  onTokensChange?: (balance: number) => void;
  /** Packages offered in the "buy tokens" modal. */
  tokenPackages?: VideoWidgetTokenPackage[];
  /**
   * Called when a viewer taps a package. Wire this to your real payment
   * flow (M-Pesa, card, etc.). May return a Promise — the widget shows a
   * "Processing…" state and waits for it before closing the modal. If you
   * leave `tokenBalance` uncontrolled, a successful purchase (no throw)
   * also adds the tokens to the widget's own running balance.
   */
  onBuyTokens?: (pkg: VideoWidgetTokenPackage) => void | Promise<void>;

  /**
   * Set true for the creator's own view of the video. Shows a settings
   * gear (top-right) that opens a modal for adding/removing gift icons.
   */
  isCreator?: boolean;
  /** Called whenever the creator adds or removes a gift icon. Persist this yourself. */
  onGiftsChange?: (gifts: VideoWidgetGift[]) => void;

  /**
   * Whether the current viewer is signed in. Defaults to true (no gating)
   * so the widget behaves the same as before if you don't pass this.
   * Wire it to your auth provider, e.g. Privy's `authenticated`.
   */
  isAuthenticated?: boolean;
  /**
   * Called instead of opening the gift tray or the token modal when
   * `isAuthenticated` is false — e.g. pass Privy's `login`.
   */
  onRequireAuth?: () => void;

  /**
   * Controls what the token modal shows, for when your own purchase flow
   * has more steps than a single async call (e.g. M-Pesa → on-chain
   * conversion → confirmed). Leave unset for the simple default: the
   * modal shows the package list, calls `onBuyTokens`, and closes itself
   * on success. Once you pass this, you own the flow end to end — the
   * widget stops closing the modal or crediting a local balance for you,
   * and just calls `onBuyTokens(pkg)` when a package is tapped:
   *   - 'select'     — package list (default view)
   *   - 'processing' — spinner + `processingLabel`
   *   - 'success'    — `successContent`, or a plain fallback if omitted
   *   - 'error'      — `errorContent`, or a plain fallback if omitted
   */
  purchaseStep?: 'select' | 'processing' | 'success' | 'error';
  /** Text shown under the spinner while purchaseStep is 'processing'. */
  processingLabel?: string;
  /** Custom content for purchaseStep 'success' (e.g. a tx link). */
  successContent?: React.ReactNode;
  /** Custom content for purchaseStep 'error' (e.g. a retry button). */
  errorContent?: React.ReactNode;

  className?: string;
}

export interface VideoWidgetFeedItem {
  uid: string;
  name: string;
  gift: VideoWidgetGift;
  amount: number;
}

function formatTime(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) return '0:00';
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = Math.floor(totalSeconds % 60);
  const mm = h > 0 ? String(m).padStart(2, '0') : String(m);
  const ss = String(s).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

/* ---------------------------- icon set ---------------------------- */
/* Minimal inline SVGs — no icon-library dependency, so the widget      */
/* drops into any project without extra install steps.                 */

const Icon = {
  play: (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M8 5.14v13.72c0 .8.87 1.3 1.57.87l10.7-6.86a1 1 0 0 0 0-1.74L9.57 4.27C8.87 3.84 8 4.34 8 5.14Z" />
    </svg>
  ),
  pause: (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M7 5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V5Zm8 0a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1V5Z" />
    </svg>
  ),
  volumeHigh: (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M4 9v6h4l5 5V4L8 9H4Zm12.5 3a4.5 4.5 0 0 0-2.5-4.03v8.06A4.5 4.5 0 0 0 16.5 12Zm-2.5-8.71v2.06a7 7 0 0 1 0 13.3v2.06a9 9 0 0 0 0-17.42Z" />
    </svg>
  ),
  volumeMute: (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M4 9v6h4l5 5V4L8 9H4Zm11.29-1.29 2.13 2.13 2.13-2.13 1.41 1.41L18.83 11.5l2.13 2.13-1.41 1.41-2.13-2.13-2.13 2.13-1.41-1.41 2.13-2.13-2.13-2.13 1.41-1.41Z" />
    </svg>
  ),
  fullscreenOpen: (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M4 9V5a1 1 0 0 1 1-1h4v2H6v3H4Zm16 0V5a1 1 0 0 0-1-1h-4v2h3v3h2ZM4 15v4a1 1 0 0 0 1 1h4v-2H6v-3H4Zm16 0v4a1 1 0 0 1-1 1h-4v-2h3v-3h2Z" />
    </svg>
  ),
  fullscreenClose: (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M9 4h2v4a1 1 0 0 1-1 1H6V7h3V4Zm6 0h2v3h3v2h-4a1 1 0 0 1-1-1V4ZM4 15h4a1 1 0 0 1 1 1v4H7v-3H4v-2Zm16 0v2h-3v3h-2v-4a1 1 0 0 1 1-1h4Z" />
    </svg>
  ),
  pip: (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Zm0 14H4V6h16v12Zm-2-6h-6v4h6v-4Z" />
    </svg>
  ),
  captionsOn: (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Zm3 6.5c0-1.66 1.34-3 3-3 .77 0 1.47.29 2 .77l-.9 1.06a1.5 1.5 0 1 0 0 2.34l.9 1.06c-.53.48-1.23.77-2 .77-1.66 0-3-1.34-3-3Zm8 0c0-1.66 1.34-3 3-3 .77 0 1.47.29 2 .77l-.9 1.06a1.5 1.5 0 1 0 0 2.34l.9 1.06c-.53.48-1.23.77-2 .77-1.66 0-3-1.34-3-3Z" />
    </svg>
  ),
  captionsOff: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <rect x="3.5" y="5.5" width="17" height="13" rx="1.2" />
      <path d="M9 14c-1 0-2-.9-2-2.5S8 9 9 9c.6 0 1.1.2 1.5.6M16 14c-1 0-2-.9-2-2.5S15 9 16 9c.6 0 1.1.2 1.5.6" />
    </svg>
  ),
  replay: (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 5V2L7 6l5 4V7a5 5 0 1 1-5 5H5a7 7 0 1 0 7-7Z" />
    </svg>
  ),
  gift: (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20 8h-2.18c.11-.31.18-.65.18-1a2.5 2.5 0 0 0-2.5-2.5c-1.44 0-2.6 1.19-3.5 2.44C11.1 5.69 9.94 4.5 8.5 4.5A2.5 2.5 0 0 0 6 7c0 .35.07.69.18 1H4a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V9a1 1 0 0 0-1-1Zm-11.5-1.5c.83 0 1.72 1.07 2.3 2H8.5a1 1 0 0 1-1-1 1 1 0 0 1 1-1Zm7 0a1 1 0 0 1 1 1 1 1 0 0 1-1 1h-2.3c.58-.93 1.47-2 2.3-2ZM4 13v6a2 2 0 0 0 2 2h4v-8H4Zm8 8h4a2 2 0 0 0 2-2v-6h-6v8Z" />
    </svg>
  ),
  coin: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="8.2" />
      <path d="M9.3 9.7c0-1.05.95-1.9 2.35-1.9s2.35.85 2.35 1.75c0 2.4-4.7 1.35-4.7 3.75 0 .9 1.05 1.75 2.35 1.75s2.35-.85 2.35-1.9M12 6.6v10.8" />
    </svg>
  ),
  settings: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="3.1" />
      <path d="M19.4 13.4a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V19.7a2 2 0 1 1-4 0v-.1a1.65 1.65 0 0 0-1.08-1.5 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H4.3a2 2 0 1 1 0-4h.1a1.65 1.65 0 0 0 1.5-1.08 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H10.4a1.65 1.65 0 0 0 1-1.51V4.3a2 2 0 1 1 4 0v.1a1.65 1.65 0 0 0 1.08 1.5 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V10.4a1.65 1.65 0 0 0 1.51 1h.19a2 2 0 1 1 0 4h-.1a1.65 1.65 0 0 0-1.5 1.08Z" />
    </svg>
  ),
};

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onClose();
      }}
      style={{
        position: 'absolute',
        inset: 0,
        background: 'rgba(8,8,9,0.72)',
        backdropFilter: 'blur(2px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        zIndex: 30,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 340,
          maxHeight: '82%',
          overflowY: 'auto',
          background: '#121213',
          border: '1px solid rgba(242,240,235,0.12)',
          borderRadius: 10,
          padding: 18,
          color: '#F2F0EB',
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 14,
          }}
        >
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>{title}</h3>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              background: 'transparent',
              border: 'none',
              color: '#B8B3AC',
              cursor: 'pointer',
              fontSize: 20,
              lineHeight: 1,
              padding: 2,
            }}
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function VideoWidget({
  videoRef,
  containerRef,
  chapters = [],
  title,
  speeds = [0.5, 0.75, 1, 1.25, 1.5, 2],
  autoHideMs = 2800,
  accent = '#E8A33D',
  gifts,
  onGiftSend,
  showGifts = true,
  live,
  showTokens = true,
  tokenBalance,
  initialTokenBalance = 0,
  onTokensChange,
  tokenPackages = DEFAULT_TOKEN_PACKAGES,
  onBuyTokens,
  isCreator = false,
  onGiftsChange,
  goal,
  feed = [],
  onSetGoal,
  incomingGift,
  isAuthenticated = true,
  onRequireAuth,
  purchaseStep,
  processingLabel,
  successContent,
  errorContent,
  className,
  
}: VideoWidgetProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const scrubRef = useRef<HTMLDivElement>(null);

  const [playing, setPlaying] = useState(false);
  const [ended, setEnded] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [rate, setRate] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPiP, setIsPiP] = useState(false);
  const [captionsOn, setCaptionsOn] = useState(false);
  const [hasCaptionTrack, setHasCaptionTrack] = useState(false);
  const [visible, setVisible] = useState(true);
  const [scrubbing, setScrubbing] = useState(false);
  const [hoverPreview, setHoverPreview] = useState<{ x: number; time: number } | null>(null);
  const [speedMenuOpen, setSpeedMenuOpen] = useState(false);
  const [giftTrayOpen, setGiftTrayOpen] = useState(false);
  const [floatingGifts, setFloatingGifts] = useState<
    { uid: string; gift: VideoWidgetGift; left: number }[]
  >([]);
  const [isLiveStream, setIsLiveStream] = useState(false);
  const [seekableStart, setSeekableStart] = useState(0);
  const [seekableEnd, setSeekableEnd] = useState(0);
  const [goalTitle, setGoalTitle] = useState('');
  const [goalTarget, setGoalTarget] = useState('');

  const isLive = live ?? isLiveStream;
  const dvrWindow = seekableEnd - seekableStart;
  const hasDvr = isLive && dvrWindow > 5; // sliding window worth showing a scrub bar for
  const LIVE_EDGE_TOLERANCE = 4; // seconds of slack still counted as "at live edge"
  const behindLiveBy = hasDvr ? Math.max(0, seekableEnd - currentTime) : 0;
  const atLiveEdge = !hasDvr || behindLiveBy <= LIVE_EDGE_TOLERANCE;

  const goLive = () => {
    const v = videoRef.current;
    if (!v) return;
    const edge = seekableEnd || v.duration;
    if (Number.isFinite(edge)) v.currentTime = edge;
    if (v.paused) v.play();
  };

  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const target = () => containerRef?.current ?? videoRef.current ?? undefined;

  const scheduleHide = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      if (!scrubbing) setVisible(false);
    }, autoHideMs);
  }, [autoHideMs, scrubbing]);

  const wake = useCallback(() => {
    setVisible(true);
    if (playing) scheduleHide();
  }, [playing, scheduleHide]);

  /* ---------------------- tokens, gifts management, modals --------------------- */
  const [internalBalance, setInternalBalance] = useState(initialTokenBalance);
  const [giftList, setGiftList] = useState<VideoWidgetGift[]>(gifts);
  const [tokenModalOpen, setTokenModalOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [purchasingId, setPurchasingId] = useState<string | null>(null);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  const [amount, setAmount] = useState('');

  const balance = tokenBalance ?? internalBalance;

  // Keep controls visible and the auto-hide timer paused while a modal is open.
  useEffect(() => {
    if (tokenModalOpen || settingsOpen) {
      setVisible(true);
      if (hideTimer.current) clearTimeout(hideTimer.current);
    }
  }, [tokenModalOpen, settingsOpen]);

  const closeTokenModal = () => {
    setTokenModalOpen(false);
    setPurchaseError(null);
    wake();
  };
  const closeSettings = () => {
    setSettingsOpen(false);
    wake();
  };

  const buyPackage = async (pkg: VideoWidgetTokenPackage) => {
    if (!isAuthenticated) {
      onRequireAuth?.();
      return;
    }
    // Controlled flow: the parent owns purchaseStep and renders every
    // stage itself, so just hand off the tap and step out of the way —
    // no internal busy state, no auto-close, no local balance credit.
    if (purchaseStep !== undefined) {
      onBuyTokens?.(pkg);
      return;
    }
    setPurchaseError(null);
    setPurchasingId(pkg.id);
    try {
      await onBuyTokens?.(pkg);
      if (tokenBalance === undefined) {
        setInternalBalance((b) => {
          const next = b + pkg.tokens;
          onTokensChange?.(next);
          return next;
        });
      } else {
        onTokensChange?.(tokenBalance + pkg.tokens);
      }
      closeTokenModal();
    } catch {
      setPurchaseError('Purchase failed. Please try again.');
    } finally {
      setPurchasingId(null);
    }
  };


  

  /* ------------------------- media event wiring ------------------------- */
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    const onPlay = () => {
      setPlaying(true);
      setEnded(false);
      scheduleHide();
    };
    const onPause = () => setPlaying(false);
    const onEnded = () => {
      setPlaying(false);
      setEnded(true);
      setVisible(true);
    };
    const onTime = () => setCurrentTime(v.currentTime);
    const onLoaded = () => {
      setDuration(v.duration || 0);
      setIsLiveStream(!Number.isFinite(v.duration));
      setHasCaptionTrack(v.textTracks.length > 0);
    };
    const onDurationChange = () => {
      setDuration(v.duration || 0);
      setIsLiveStream(!Number.isFinite(v.duration));
    };
    const onVolume = () => {
      setVolume(v.volume);
      setMuted(v.muted);
    };
    const onRate = () => setRate(v.playbackRate);
    const onProgress = () => {
      if (v.buffered.length > 0 && v.duration) {
        setBuffered(v.buffered.end(v.buffered.length - 1) / v.duration);
      }
      // Live streams: track the DVR/rewind window from `seekable`, since
      // `duration` is Infinity and tells us nothing about how far back a
      // viewer can scrub. Streams with no sliding window report a single
      // point (start === end), which the UI reads as "no DVR available".
      if (v.seekable.length > 0) {
        setSeekableStart(v.seekable.start(0));
        setSeekableEnd(v.seekable.end(v.seekable.length - 1));
      }
    };

    v.addEventListener('play', onPlay);
    v.addEventListener('pause', onPause);
    v.addEventListener('ended', onEnded);
    v.addEventListener('timeupdate', onTime);
    v.addEventListener('loadedmetadata', onLoaded);
    v.addEventListener('durationchange', onDurationChange);
    v.addEventListener('volumechange', onVolume);
    v.addEventListener('ratechange', onRate);
    v.addEventListener('progress', onProgress);

    // Pick up state if the video is already mid-playback when mounted.
    if (v.readyState >= 1) onLoaded();
    setPlaying(!v.paused);
    setVolume(v.volume);
    setMuted(v.muted);

    return () => {
      v.removeEventListener('play', onPlay);
      v.removeEventListener('pause', onPause);
      v.removeEventListener('ended', onEnded);
      v.removeEventListener('timeupdate', onTime);
      v.removeEventListener('loadedmetadata', onLoaded);
      v.removeEventListener('durationchange', onDurationChange);
      v.removeEventListener('volumechange', onVolume);
      v.removeEventListener('ratechange', onRate);
      v.removeEventListener('progress', onProgress);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoRef.current]);

  useEffect(() => {
    const onFsChange = () => {
      const el = target();
      setIsFullscreen(!!document.fullscreenElement && document.fullscreenElement === el);
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onEnterPiP = () => setIsPiP(true);
    const onLeavePiP = () => setIsPiP(false);
    v.addEventListener('enterpictureinpicture', onEnterPiP);
    v.addEventListener('leavepictureinpicture', onLeavePiP);
    return () => {
      v.removeEventListener('enterpictureinpicture', onEnterPiP);
      v.removeEventListener('leavepictureinpicture', onLeavePiP);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoRef.current]);

  /* ----------------------------- keyboard ----------------------------- */
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const onKey = (e: KeyboardEvent) => {
      if (!root.contains(document.activeElement) && document.activeElement !== document.body) return;
      const v = videoRef.current;
      if (!v) return;
      switch (e.key) {
        case ' ':
        case 'k':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowRight':
          v.currentTime = Math.min(v.duration || Infinity, v.currentTime + 5);
          wake();
          break;
        case 'ArrowLeft':
          v.currentTime = Math.max(0, v.currentTime - 5);
          wake();
          break;
        case 'ArrowUp':
          e.preventDefault();
          v.volume = Math.min(1, v.volume + 0.05);
          v.muted = false;
          break;
        case 'ArrowDown':
          e.preventDefault();
          v.volume = Math.max(0, v.volume - 0.05);
          break;
        case 'm':
          v.muted = !v.muted;
          break;
        case 'f':
          toggleFullscreen();
          break;
        default:
          break;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ------------------------------ actions ------------------------------ */
  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.ended) {
      v.currentTime = 0;
    }
    v.paused ? v.play() : v.pause();
  };

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    if (!v.muted && v.volume === 0) v.volume = 0.5;
  };

  const onVolumeChange = (val: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.volume = val;
    v.muted = val === 0;
  };

  const setSpeed = (s: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.playbackRate = s;
    setSpeedMenuOpen(false);
  };

  useEffect(() => {
  if (!incomingGift) return;
  const left = 12 + Math.random() * 76;
  setFloatingGifts((f) => [...f, { uid: incomingGift.uid, gift: incomingGift.gift, left }]);
  wake();
  // const t = setTimeout(() => {
  //   setFloatingGifts((f) => f.filter((x) => x.uid !== incomingGift.uid));
  // }, 2600);
  // return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incomingGift?.uid]);

const wasReached = useRef(false);
useEffect(() => {
  if (!goal) {
    wasReached.current = false;
    return;
  }
  const reached = goal.current >= goal.target;
  if (reached && !wasReached.current) {
    const burst = Array.from({ length: 8 }, (_, i) => ({
      uid: `goal-${Date.now()}-${i}`,
      gift: { id: 'goal', icon: '🎉', label: '', price: 0 },
      left: 10 + Math.random() * 80,
    }));
    setFloatingGifts((f) => [...f, ...burst]);
    setTimeout(() => {
      setFloatingGifts((f) => f.filter((x) => !burst.some((b) => b.uid === x.uid)));
    }, 2600);
  }
  wasReached.current = reached;
}, [goal?.current, goal?.target]);

  const sendGift = (gift: VideoWidgetGift) => {
    if (!isAuthenticated) {
      onRequireAuth?.();
      return;
    }
    const uid = `${gift.id}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const left = 12 + Math.random() * 76; // percent across the video, kept off the edges
    setFloatingGifts((f) => [...f, { uid, gift, left }]);
    onGiftSend?.(gift);
    //setGiftTrayOpen(false);
    wake();
    setTimeout(() => {
      setFloatingGifts((f) => f.filter((x) => x.uid !== uid));
    }, 2600);
  };

  const toggleCaptions = () => {
    const v = videoRef.current;
    if (!v) return;
    const track = v.textTracks[0];
    if (!track) return;
    const next = track.mode !== 'showing';
    track.mode = next ? 'showing' : 'hidden';
    setCaptionsOn(next);
  };

  const toggleFullscreen = async () => {
    const el = target();
    if (!el) return;
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    } else {
      await el.requestFullscreen?.();
    }
  };

  const togglePiP = async () => {
    const v = videoRef.current;
    if (!v) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        await v.requestPictureInPicture?.();
      }
    } catch {
      /* PiP unsupported or blocked — fail silently, no UI regression */
    }
  };

  const timeFromClientX = (clientX: number) => {
    const rail = scrubRef.current;
    if (!rail) return 0;
    const rect = rail.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    if (hasDvr) return seekableStart + ratio * dvrWindow;
    if (!duration) return 0;
    return ratio * duration;
  };

  const seekTo = (clientX: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = timeFromClientX(clientX);
  };

  const onScrubMove = (e: React.MouseEvent) => {
    const t = timeFromClientX(e.clientX);
    setHoverPreview({ x: e.clientX, time: t });
    if (scrubbing) seekTo(e.clientX);
  };

  useEffect(() => {
    if (!scrubbing) return;
    const onMove = (e: MouseEvent) => seekTo(e.clientX);
    const onUp = () => setScrubbing(false);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scrubbing]);

  const progressPct = hasDvr
    ? ((currentTime - seekableStart) / dvrWindow) * 100
    : duration
    ? (currentTime / duration) * 100
    : 0;
  const bufferedPct = hasDvr ? 100 : buffered * 100; // live edge counts as "fully buffered" for the fill

  const activeChapter = isLive
    ? undefined
    : [...chapters]
        .filter((c) => c.time <= currentTime)
        .sort((a, b) => b.time - a.time)[0];

  return (
    <div
      ref={rootRef}
      className={className}
      onMouseMove={wake}
      onMouseLeave={() => playing && setVisible(false)}
      onClick={(e) => {
        // Click the scrim (not a control) to toggle play, like most players,
        // and dismiss any open popovers.
        if (e.target === e.currentTarget) togglePlay();
        setSpeedMenuOpen(false);
        setGiftTrayOpen(false);
      }}
      style={{
        position: 'absolute',
        inset: 0,
        fontFamily:
          "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        color: '#F2F0EB',
        userSelect: 'none',
      }}
    >
      {/* keyframes for the floating gift animation */}
      <style>{`
        @keyframes vwGiftFloat {
          0% { transform: translateY(0) scale(0.5); opacity: 0; }
          12% { transform: translateY(-8px) scale(1); opacity: 1; }
          80% { transform: translateY(-170px) scale(1); opacity: 1; }
          100% { transform: translateY(-230px) scale(0.85); opacity: 0; }
        }
        @keyframes vwLivePulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.35; }
        }
        @keyframes vwSpin {
          to { transform: rotate(360deg); }
        }
        @keyframes vwFeedIn {
          from { opacity: 0; transform: translateY(8px); }
        }
      `}</style>

      {/* floating gifts — rendered above the fading controls layer, always visible */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        {floatingGifts.map((fg) => (
          <div
            key={fg.uid}
            style={{
              position: 'absolute',
              bottom: 76,
              left: `${fg.left}%`,
              fontSize: 34,
              lineHeight: 1,
              filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.5))',
              animation: 'vwGiftFloat 2.6s ease-out forwards',
            }}
          >
            {fg.gift.icon}
          </div>
        ))}
      </div>

      {/**goal bar - shows the target contribution*/}
      {goal && (() => {
        const pct = Math.min(100, (goal.current / goal.target) * 100);
        const reached = goal.current >= goal.target;
        return (
          <div style={{ position: 'absolute', top: 52, left: 16, width: 'min(280px, 60%)', pointerEvents: 'none' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 11.5,
                marginBottom: 4,
                textShadow: '0 1px 4px rgba(0,0,0,0.7)',
              }}
            >
              <span>{reached ? '🎉 ' : ''}{goal.title}</span>
              <span style={{ fontVariantNumeric: 'tabular-nums' }}>
                {goal.current} / {goal.target}
              </span>
            </div>
            <div style={{ height: 6, borderRadius: 3, background: 'rgba(242,240,235,0.2)', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${pct}%`,
                  height: '100%',
                  background: reached ? '#3DD68C' : accent,
                  transition: 'width 500ms ease',
                }}
              />
            </div>
          </div>
        );
      })()}

      {/**Live transaction feeds to showcase parallel transactions on monad */}
      {feed.length > 0 && (
  <div
    style={{
      position: 'absolute',
      left: 16,
      bottom: 88, // clears the control bar
      width: 'min(300px, 70%)',
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
      pointerEvents: 'none',
    }}
  >
    {feed.slice(-5).map((item, i, arr) => (
      <div
        key={item.uid}
        style={{
          alignSelf: 'flex-start',
          maxWidth: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          background: 'rgba(8,8,9,0.55)',
          backdropFilter: 'blur(4px)',
          borderRadius: 14,
          padding: '4px 10px',
          fontSize: 12.5,
          opacity: 0.45 + 0.55 * ((i + 1) / arr.length), // older rows fade
          transition: 'opacity 300ms ease',
          animation: 'vwFeedIn 260ms ease-out',
        }}
      >
        <span
          style={{
            fontWeight: 600,
            color: accent,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {item.name}
        </span>
        <span style={{ whiteSpace: 'nowrap' }}>sent {item.gift.label}</span>
        <span style={{ fontSize: 16, lineHeight: 1 }}>{item.gift.icon}</span>
        <span style={{ color: '#B8B3AC', fontVariantNumeric: 'tabular-nums' }}>+{item.amount}</span>
      </div>
    ))}
  </div>
)}

      {/* controls layer — this is what auto-hides */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          opacity: visible ? 1 : 0,
          transition: 'opacity 220ms ease',
          pointerEvents: visible ? 'auto' : 'none',
        }}
      >
      {/* center play/replay affordance */}
      <button
        aria-label={playing ? 'Pause' : ended ? 'Replay' : 'Play'}
        onClick={togglePlay}
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 64,
          height: 64,
          borderRadius: '50%',
          border: `1px solid rgba(242,240,235,0.35)`,
          background: 'rgba(8,8,9,0.45)',
          backdropFilter: 'blur(6px)',
          display: playing ? 'none' : 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          pointerEvents: visible ? 'auto' : 'none',
        }}
      >
        <span style={{ width: 26, height: 26, color: '#F2F0EB', marginLeft: ended ? 0 : 3 }}>
          {ended ? Icon.replay : Icon.play}
        </span>
      </button>

      {/* top bar: title, and — for the creator's own view — a settings gear */}
      {(title || isCreator) && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            padding: '14px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background:
              'linear-gradient(to bottom, rgba(8,8,9,0.75) 0%, transparent 100%)',
          }}
        >
          <span style={{ fontSize: 14, fontWeight: 500, letterSpacing: 0.1 }}>{title}</span>
          {isCreator && (
            <ControlButton
              label="Manage gift icons"
              accent={accent}
              onClick={() => setSettingsOpen(true)}
            >
              {Icon.settings}
            </ControlButton>
          )}
        </div>
      )}

      {/* bottom control bar */}
      <div
        style={{
          background:
            'linear-gradient(to top, rgba(8,8,9,0.92) 0%, rgba(8,8,9,0.6) 55%, transparent 100%)',
          padding: '28px 16px 12px',
        }}
      >
        {/* scrub rail — shown for VOD, and for live streams with a DVR window */}
        {(!isLive || hasDvr) && (
          <div
            ref={scrubRef}
            onMouseDown={(e) => {
              setScrubbing(true);
              seekTo(e.clientX);
            }}
            onMouseMove={onScrubMove}
            onMouseLeave={() => setHoverPreview(null)}
            role="slider"
            aria-label="Seek"
            aria-valuemin={hasDvr ? seekableStart : 0}
            aria-valuemax={hasDvr ? seekableEnd : duration}
            aria-valuenow={currentTime}
            tabIndex={0}
            style={{
              position: 'relative',
              height: 14,
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
            }}
          >
            {/* hover tooltip */}
            {hoverPreview && (
              <div
                style={{
                  position: 'absolute',
                  bottom: 18,
                  left: Math.max(
                    20,
                    Math.min(
                      (scrubRef.current?.clientWidth ?? 0) - 20,
                      hoverPreview.x - (scrubRef.current?.getBoundingClientRect().left ?? 0)
                    )
                  ),
                  transform: 'translateX(-50%)',
                  background: '#0A0A0B',
                  border: '1px solid rgba(242,240,235,0.15)',
                  borderRadius: 4,
                  padding: '4px 8px',
                  fontSize: 11.5,
                  fontVariantNumeric: 'tabular-nums',
                  whiteSpace: 'nowrap',
                  pointerEvents: 'none',
                }}
              >
                {hasDvr
                  ? `-${formatTime(seekableEnd - hoverPreview.time)}`
                  : formatTime(hoverPreview.time)}
              </div>
            )}

            <div
              style={{
                position: 'relative',
                width: '100%',
                height: 3,
                borderRadius: 2,
                background: 'rgba(242,240,235,0.2)',
                transition: 'height 120ms ease',
              }}
            >
              {/* buffered */}
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: `${bufferedPct}%`,
                  background: 'rgba(242,240,235,0.38)',
                  borderRadius: 2,
                }}
              />
              {/* played */}
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: `${progressPct}%`,
                  background: accent,
                  borderRadius: 2,
                }}
              />
              {/* chapter ticks — VOD only, live has no fixed timeline for these */}
              {!isLive &&
                duration > 0 &&
                chapters.map((c, i) => (
                  <div
                    key={i}
                    title={c.label}
                    style={{
                      position: 'absolute',
                      top: -1,
                      left: `${(c.time / duration) * 100}%`,
                      width: 2,
                      height: 5,
                      background: 'rgba(8,8,9,0.65)',
                    }}
                  />
                ))}
              {/* scrub head — a diamond, not the usual circle */}
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: `${progressPct}%`,
                  width: 9,
                  height: 9,
                  background: accent,
                  transform: 'translate(-50%, -50%) rotate(45deg)',
                  borderRadius: 2,
                  boxShadow: '0 0 0 3px rgba(8,8,9,0.35)',
                }}
              />
            </div>
          </div>
        )}

        {/* buttons row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            marginTop: 8,
          }}
        >
          <ControlButton label={playing ? 'Pause' : 'Play'} onClick={togglePlay} accent={accent}>
            {playing ? Icon.pause : Icon.play}
          </ControlButton>

          {/* volume */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ControlButton label={muted || volume === 0 ? 'Unmute' : 'Mute'} onClick={toggleMute} accent={accent}>
              {muted || volume === 0 ? Icon.volumeMute : Icon.volumeHigh}
            </ControlButton>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={muted ? 0 : volume}
              onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
              aria-label="Volume"
              style={{
                width: 72,
                accentColor: accent,
                cursor: 'pointer',
              }}
            />
          </div>

          {isLive ? (
            <button
              onClick={goLive}
              disabled={atLiveEdge}
              aria-label={atLiveEdge ? 'Live' : `Go live, ${formatTime(behindLiveBy)} behind`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: 'transparent',
                border: 'none',
                padding: '4px 8px 4px 6px',
                borderRadius: 20,
                cursor: atLiveEdge ? 'default' : 'pointer',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  background: atLiveEdge ? '#E5484D' : 'rgba(242,240,235,0.4)',
                  animation: atLiveEdge && playing ? 'vwLivePulse 1.6s ease-in-out infinite' : 'none',
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontSize: 12.5,
                  fontWeight: 600,
                  letterSpacing: 0.4,
                  color: atLiveEdge ? '#F2F0EB' : '#B8B3AC',
                }}
              >
                {atLiveEdge ? 'LIVE' : `-${formatTime(behindLiveBy)}`}
              </span>
            </button>
          ) : (
            <div
              style={{
                fontSize: 12.5,
                color: '#B8B3AC',
                fontVariantNumeric: 'tabular-nums',
                minWidth: 92,
              }}
            >
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          )}

          {activeChapter && (
            <div
              style={{
                fontSize: 12,
                color: '#B8B3AC',
                borderLeft: '1px solid rgba(242,240,235,0.2)',
                paddingLeft: 12,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: 160,
              }}
            >
              {activeChapter.label}
            </div>
          )}

          <div style={{ flex: 1 }} />

          {/* speed — hidden for pure live edge playback; still useful when scrubbed into a DVR window */}
          {(!isLive || hasDvr) && (
          <div style={{ position: 'relative' }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSpeedMenuOpen((s) => !s);
                setGiftTrayOpen(false);
              }}
              aria-label="Playback speed"
              style={{
                background: 'transparent',
                border: 'none',
                color: '#F2F0EB',
                fontSize: 12.5,
                fontVariantNumeric: 'tabular-nums',
                cursor: 'pointer',
                padding: '4px 8px',
                borderRadius: 4,
              }}
              onFocus={(e) => (e.currentTarget.style.outline = `1.5px solid ${accent}`)}
              onBlur={(e) => (e.currentTarget.style.outline = 'none')}
            >
              {rate}×
            </button>
            {speedMenuOpen && (
              <div
                style={{
                  position: 'absolute',
                  bottom: 30,
                  right: 0,
                  background: '#0A0A0B',
                  border: '1px solid rgba(242,240,235,0.15)',
                  borderRadius: 6,
                  overflow: 'hidden',
                  minWidth: 64,
                }}
              >
                {speeds.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSpeed(s)}
                    style={{
                      display: 'block',
                      width: '100%',
                      textAlign: 'left',
                      padding: '6px 12px',
                      background: s === rate ? 'rgba(232,163,61,0.15)' : 'transparent',
                      color: s === rate ? accent : '#F2F0EB',
                      border: 'none',
                      fontSize: 12.5,
                      cursor: 'pointer',
                    }}
                  >
                    {s}×
                  </button>
                ))}
              </div>
            )}
          </div>
          )}

          {showTokens && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (!isAuthenticated) {
                  onRequireAuth?.();
                  return;
                }
                setTokenModalOpen(true);
              }}
              aria-label={
                isAuthenticated ? `Token balance: ${balance}. Buy more.` : 'Sign in to buy tokens'
              }
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                background: 'rgba(242,240,235,0.06)',
                border: '1px solid rgba(242,240,235,0.14)',
                borderRadius: 20,
                padding: '4px 10px 4px 8px',
                cursor: 'pointer',
                color: '#F2F0EB',
              }}
            >
              <span style={{ width: 14, height: 14, color: accent, display: 'flex' }}>{Icon.coin}</span>
              <span style={{ fontSize: 12.5, fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
                {balance}
              </span>
              <span style={{ fontSize: 13, fontWeight: 700, color: accent, marginLeft: 1 }}>+</span>
            </button>
          )}

          {showGifts && giftList.length > 0 && (
            <div style={{ position: 'relative' }}>
              <ControlButton
                label={isAuthenticated ? 'Send a gift' : 'Sign in to send a gift'}
                accent={accent}
                active={giftTrayOpen}
                onClick={() => {
                  if (!isAuthenticated) {
                    onRequireAuth?.();
                    return;
                  }
                  setGiftTrayOpen((o) => !o);
                  setSpeedMenuOpen(false);
                }}
              >
                {Icon.gift}
              </ControlButton>
              {giftTrayOpen && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    position: 'absolute',
                    bottom: 30,
                    right: 0,
                    background: '#0A0A0B',
                    border: '1px solid rgba(242,240,235,0.15)',
                    borderRadius: 8,
                    padding: 6,
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: 2,
                    minWidth: 168,
                  }}
                >
                  {giftList.map((g) => (
                    <button
                      key={g.id}
                      onClick={() => sendGift(g)}
                      title={g.label}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 3,
                        background: 'transparent',
                        border: 'none',
                        borderRadius: 6,
                        padding: '7px 4px',
                        cursor: 'pointer',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(232,163,61,0.14)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <span style={{ fontSize: 20, lineHeight: 1 }}>{g.icon}</span>
                      <span style={{ fontSize: 9.5, color: '#B8B3AC' }}>{g.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {hasCaptionTrack && (
            <ControlButton label={captionsOn ? 'Turn off captions' : 'Turn on captions'} onClick={toggleCaptions} accent={accent}>
              {captionsOn ? Icon.captionsOn : Icon.captionsOff}
            </ControlButton>
          )}

          <ControlButton label="Picture in picture" onClick={togglePiP} accent={accent} active={isPiP}>
            {Icon.pip}
          </ControlButton>

          <ControlButton
            label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            onClick={toggleFullscreen}
            accent={accent}
          >
            {isFullscreen ? Icon.fullscreenClose : Icon.fullscreenOpen}
          </ControlButton>
        </div>
      </div>
      </div>

      {tokenModalOpen && (
        <Modal title="Buy tokens" onClose={closeTokenModal}>
          {purchaseStep === 'processing' ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 12,
                padding: '24px 0',
              }}
            >
              <span
                style={{
                  width: 24,
                  height: 24,
                  border: `2.5px solid rgba(242,240,235,0.2)`,
                  borderTopColor: accent,
                  borderRadius: '50%',
                  animation: 'vwSpin 0.8s linear infinite',
                }}
              />
              <p style={{ margin: 0, fontSize: 13, color: '#B8B3AC', textAlign: 'center' }}>
                {processingLabel ?? 'Processing…'}
              </p>
            </div>
          ) : purchaseStep === 'success' ? (
            successContent ?? (
              <div style={{ padding: '12px 0', textAlign: 'center', fontSize: 13, color: '#B8B3AC' }}>
                Purchase complete.
              </div>
            )
          ) : purchaseStep === 'error' ? (
            errorContent ?? (
              <div style={{ padding: '12px 0', textAlign: 'center', fontSize: 13, color: '#E5484D' }}>
                Something went wrong. Please try again.
              </div>
            )
          ) : (
            <>
              <div style={{ fontSize: 12.5, color: '#B8B3AC', marginBottom: 12 }}>
                Current balance:{' '}
                <strong style={{ color: '#F2F0EB', fontVariantNumeric: 'tabular-nums' }}>
                  {balance} tokens
                </strong>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {tokenPackages.map((pkg) => {
                  const busy = purchasingId === pkg.id;
                  return (
                    <button
                      key={pkg.id}
                      disabled={!!purchasingId}
                      onClick={() => buyPackage(pkg)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: 8,
                        border: '1px solid rgba(242,240,235,0.14)',
                        background: busy ? 'rgba(232,163,61,0.1)' : 'transparent',
                        color: '#F2F0EB',
                        cursor: purchasingId ? 'default' : 'pointer',
                        opacity: purchasingId && !busy ? 0.5 : 1,
                      }}
                    >
                      <span style={{ fontWeight: 600, fontSize: 14 }}>{pkg.tokens} tokens</span>
                      <span style={{ fontSize: 13, color: accent, fontVariantNumeric: 'tabular-nums' }}>
                        {busy ? 'Processing…' : `${pkg.priceKes} KES`}
                      </span>
                    </button>
                  );
                })}
              </div>
              {purchaseError && (
                <div style={{ marginTop: 10, fontSize: 12, color: '#E5484D' }}>{purchaseError}</div>
              )}
            </>
          )}
        </Modal>
      )}

      {isCreator && settingsOpen && (
        <Modal title="Manage your gifts" onClose={closeSettings}>
          <div className='flex flex-col rounded-2xl border border-white/10 bg-white/3 p-2 space-y-6 backdrop-blur w-full'>
            <section className='space-y-3 flex flex-col'>
              <h1 className='mb-3'>Stream Goal</h1>
              
              <div>
                <input
                value={goalTitle}
                onChange={(e) => setGoalTitle(e.target.value)}
                placeholder="New creator goal"
                aria-label="Goal title"/>
                <input
                value={goalTarget}
                onChange={(e) => setGoalTarget(e.target.value)}
                placeholder="500"
                inputMode="numeric"
                aria-label="Goal target"/>
                <button
                onClick={() => {
                  const t = Number(goalTarget);
                  if (!goalTitle.trim() || !Number.isFinite(t) || t <= 0) return;
                  onSetGoal?.(goalTitle.trim(), t);
                  setGoalTitle('');
                  setGoalTarget('');
                }}>Set</button>
              </div>
            </section>
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">Cash Out</h3>
                <span className="text-xs text-[#9498B8]">Balance: 0.00 AUSD</span>
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 transition focus-within:border-indigo-400/60 focus-within:ring-2 focus-within:ring-indigo-400/20">
                <input
                  type="number"
                  placeholder="Amount to cash out"
                  className="flex-1 bg-transparent text-white placeholder:text-[#9498B8]/70 outline-none"
                />
                <button
                  type="button"
                  className="rounded-md bg-indigo-500/15 px-2.5 py-1 text-xs font-semibold text-indigo-300 transition hover:bg-indigo-500/25"
                >
                   MAX
                </button>
              </div>
              <button className="w-full rounded-xl bg-white py-2.5 text-sm font-semibold text-black transition hover:bg-white/90 active:scale-[0.98]">
                Cash out
              </button>
            </section>
            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-white/10" />
              <span className="text-xs uppercase tracking-widest text-[#9498B8]">or</span>
              <div className="h-px flex-1 bg-white/10" />
            </div>
            {/* Deposit */}
            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-white">Deposit To Earn Yield</h3>
              <form className="space-y-3">
                <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 transition focus-within:border-indigo-400/60 focus-within:ring-2 focus-within:ring-indigo-400/20">
                  <span className="text-[#9498B8]">$</span>
                  <input
                    id="deposit-amount"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="flex-1 bg-transparent text-white placeholder:text-[#9498B8]/70 outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    disabled={false}
                  />
                  <span className="text-sm font-medium text-[#9498B8]">AUSD</span>
                </div>
                <button
                  type="submit"
                  className="w-full rounded-xl bg-indigo-500 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-400 active:scale-[0.98]"
                >
                  Deposit
                </button>
              </form>
            </section>
          </div>
        </Modal>
      )}
    </div>
  );
}

function ControlButton({
  children,
  label,
  onClick,
  accent,
  active,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  accent: string;
  active?: boolean;
}) {
  return (
    <button
      aria-label={label}
      title={label}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      style={{
        background: 'transparent',
        border: 'none',
        width: 20,
        height: 20,
        color: active ? accent : '#F2F0EB',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 0,
        borderRadius: 4,
      }}
      onFocus={(e) => (e.currentTarget.style.outline = `1.5px solid ${accent}`)}
      onBlur={(e) => (e.currentTarget.style.outline = 'none')}
    >
      {children}
    </button>
  );
}