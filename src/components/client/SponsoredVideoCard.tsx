/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, useEffect } from 'react';
import { 
  Sparkles, 
  Clock, 
  MessageCircle, 
  Share2, 
  Volume2, 
  VolumeX, 
  Play, 
  Pause, 
  ChevronDown, 
  ChevronUp, 
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Phone
} from 'lucide-react';
import { SponsoredAd } from '../../types';
import { getRemainingAdTime } from '../../domain/ads';

interface SponsoredVideoCardProps {
  ad: SponsoredAd;
  isActive: boolean;
  isMuted: boolean;
  onToggleMute: () => void;
  onNextVideo?: () => void;
  onPrevVideo?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
  onAdClicked?: (adId: string) => void;
}

export const SponsoredVideoCard: React.FC<SponsoredVideoCardProps> = ({
  ad,
  isActive,
  isMuted,
  onToggleMute,
  onNextVideo,
  onPrevVideo,
  hasPrev,
  hasNext,
  onAdClicked,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [showPlayPauseFeedback, setShowPlayPauseFeedback] = useState<boolean>(false);
  const [hasVideoError, setHasVideoError] = useState<boolean>(false);
  const [copiedToast, setCopiedToast] = useState<boolean>(false);

  const remaining = getRemainingAdTime(ad.expiresAt);

  // Playback management
  useEffect(() => {
    if (!hasVideoError && videoRef.current) {
      if (isActive) {
        videoRef.current.currentTime = 0;
        const playPromise = videoRef.current.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => setIsPlaying(true))
            .catch(() => setIsPlaying(false));
        }
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  }, [isActive, hasVideoError, ad.mediaUrl]);

  const togglePlayPause = () => {
    if (!videoRef.current || hasVideoError) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
    setShowPlayPauseFeedback(true);
    setTimeout(() => setShowPlayPauseFeedback(false), 800);
  };

  const handleCtaClick = () => {
    if (onAdClicked) onAdClicked(ad.id);
    if (ad.ctaActionType === 'WHATSAPP') {
      const cleanPhone = ad.ctaTarget.replace(/[^0-9]/g, '');
      const encodedMsg = encodeURIComponent(`Bonjour ${ad.advertiserName}, j'ai vu votre annonce sur NZUBU : "${ad.title}". Pouvez-vous m'en dire plus ?`);
      const url = `https://wa.me/${cleanPhone}?text=${encodedMsg}`;
      window.open(url, '_blank');
    } else if (ad.ctaActionType === 'PHONE') {
      window.location.href = `tel:${ad.ctaTarget}`;
    }
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(`Découvrez cette offre sur NZUBU Kinshasa : ${ad.title} (${ad.advertiserName})`);
      setCopiedToast(true);
      setTimeout(() => setCopiedToast(false), 2500);
    }
  };

  return (
    <div className="relative w-full h-full bg-slate-950 flex items-center justify-center overflow-hidden select-none">
      {/* Video or High-res Media Banner */}
      {!hasVideoError && ad.mediaUrl ? (
        <video
          ref={videoRef}
          src={ad.mediaUrl}
          poster={ad.thumbnailUrl}
          className="absolute inset-0 w-full h-full object-cover cursor-pointer"
          loop
          playsInline
          muted={isMuted}
          onError={() => setHasVideoError(true)}
          onClick={togglePlayPause}
        />
      ) : (
        <div 
          className="absolute inset-0 w-full h-full bg-cover bg-center cursor-pointer"
          style={{ backgroundImage: `url(${ad.thumbnailUrl || ad.mediaUrl})` }}
          onClick={togglePlayPause}
        />
      )}

      {/* Cinematic Dark Gradient Overlays */}
      <div 
        className="absolute inset-0 bg-gradient-to-b from-black/70 via-transparent to-black/95 pointer-events-none"
        style={{ height: '100%' }}
      />

      {/* Play/Pause Center Indicator */}
      {showPlayPauseFeedback && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
          <div className="w-16 h-16 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-white animate-scale-up">
            {isPlaying ? <Play className="w-8 h-8 fill-white ml-1" /> : <Pause className="w-8 h-8 fill-white" />}
          </div>
        </div>
      )}

      {/* Top Banner: Sponsored & Remaining Expiry Pill */}
      <div className="absolute top-12 left-4 right-4 z-20 flex items-center justify-between pointer-events-auto">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-lg shadow-amber-500/20">
            <Sparkles className="w-3 h-3 fill-slate-950" />
            <span>Sponsorisé</span>
          </span>
          <span className="px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-[10px] text-amber-300 font-bold flex items-center gap-1">
            <Clock className="w-2.5 h-2.5" />
            <span>{remaining.label}</span>
          </span>
        </div>

        {/* Mute/Unmute toggle */}
        <button
          onClick={onToggleMute}
          className="w-8 h-8 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
          title={isMuted ? 'Activer le son (M)' : 'Couper le son (M)'}
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
        </button>
      </div>

      {/* Right Side Social Action Strip */}
      <div className="absolute right-3 bottom-24 z-30 flex flex-col items-center gap-4">
        {/* Share Button */}
        <button
          onClick={handleShare}
          className="flex flex-col items-center gap-1 text-white group"
        >
          <div className="w-11 h-11 rounded-full bg-black/50 backdrop-blur-md border border-white/15 flex items-center justify-center group-hover:bg-black/70 group-active:scale-90 transition-all">
            <Share2 className="w-5 h-5 text-slate-200" />
          </div>
          <span className="text-[10px] font-semibold text-slate-300">Partager</span>
        </button>

        {/* WhatsApp Direct Action Button */}
        <button
          onClick={handleCtaClick}
          className="flex flex-col items-center gap-1 text-emerald-400 group"
        >
          <div className="w-11 h-11 rounded-full bg-emerald-500/20 backdrop-blur-md border border-emerald-500/50 flex items-center justify-center group-hover:bg-emerald-500/40 group-active:scale-90 transition-all shadow-lg shadow-emerald-500/20">
            <MessageCircle className="w-5 h-5 text-emerald-400 fill-emerald-400/20" />
          </div>
          <span className="text-[10px] font-bold text-emerald-400">WhatsApp</span>
        </button>
      </div>

      {/* Up/Down Video Scroll Navigation Arrows */}
      <div className="absolute right-3 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-2">
        {hasPrev && (
          <button
            onClick={onPrevVideo}
            className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-md text-white/80 hover:text-white hover:bg-black/60 flex items-center justify-center border border-white/10"
            title="Précédent"
          >
            <ChevronUp className="w-5 h-5" />
          </button>
        )}
        {hasNext && (
          <button
            onClick={onNextVideo}
            className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-md text-white/80 hover:text-white hover:bg-black/60 flex items-center justify-center border border-white/10"
            title="Suivant"
          >
            <ChevronDown className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Bottom Ad Description & Direct CTA */}
      <div className="absolute bottom-4 left-4 right-16 z-20 space-y-2 pointer-events-auto">
        <div className="flex items-center gap-2">
          <span className="text-xs font-black text-white bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-slate-700">
            {ad.advertiserName}
          </span>
          <span className="text-[10px] text-amber-300 font-semibold flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-amber-400" />
            <span>Certifié MaishaPay</span>
          </span>
        </div>

        <h3 className="text-base font-black text-white tracking-tight drop-shadow-md">
          {ad.title}
        </h3>

        {ad.tagline && (
          <p className="text-xs font-semibold text-amber-200 line-clamp-1 drop-shadow">
            {ad.tagline}
          </p>
        )}

        <p className="text-[11px] text-slate-300 line-clamp-2 leading-snug drop-shadow-sm max-w-sm">
          {ad.description}
        </p>

        {/* Big CTA Button */}
        <div className="pt-1 flex items-center gap-2">
          <button
            onClick={handleCtaClick}
            className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white text-xs font-black flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/25 active:scale-95 transition-all"
          >
            <MessageCircle className="w-4 h-4 fill-white/20" />
            <span>{ad.ctaText || 'Contacter sur WhatsApp'}</span>
          </button>

          {hasNext && (
            <button
              onClick={onNextVideo}
              className="py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-md text-slate-300 text-xs font-bold border border-white/10 transition-colors"
            >
              Passer
            </button>
          )}
        </div>
      </div>

      {/* Copied Toast */}
      {copiedToast && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40 bg-slate-900/95 border border-slate-700 text-white text-xs px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 backdrop-blur-md">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Lien de l'offre copié !</span>
        </div>
      )}
    </div>
  );
};
