import { useEffect, useRef } from 'react';

export function ListingVideo({ listingId, immersive = false, active = false }: { listingId: string; immersive?: boolean; active?: boolean }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    const source = `/v1/listings/${listingId}/hls/master.m3u8`;
    let cancelled = false;
    let dispose: (() => void) | undefined;
    if (video.canPlayType('application/vnd.apple.mpegurl')) video.src = source;
    else {
      video.src = `/v1/listings/${listingId}/video?quality=low`;
      void import('hls.js').then(({ default: Hls }) => {
        if (cancelled || !Hls.isSupported()) return;
        const hls = new Hls({ enableWorker: true, startLevel: 0 });
        hls.loadSource(source);
        hls.attachMedia(video);
        hls.on(Hls.Events.ERROR, (_event, data) => {
          if (data.fatal) { hls.destroy(); video.src = `/v1/listings/${listingId}/video?quality=low`; }
        });
        dispose = () => hls.destroy();
      });
    }
    return () => { cancelled = true; dispose?.(); };
  }, [listingId]);
  useEffect(() => {
    if (!immersive || !ref.current) return;
    if (active) void ref.current.play().catch(() => {});
    else ref.current.pause();
  }, [active, immersive, listingId]);
  return <video ref={ref} controls={!immersive} muted={immersive} loop={immersive} playsInline preload="metadata" poster={`/v1/listings/${listingId}/poster`} className={immersive ? 'absolute inset-0 h-full w-full object-cover bg-slate-900' : 'w-full aspect-[9/12] object-contain rounded bg-black'} />;
}
