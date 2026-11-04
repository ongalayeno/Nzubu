/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, useEffect } from 'react';
import { 
  Heart, 
  Share2, 
  ShieldCheck, 
  Calendar, 
  Eye, 
  Volume2, 
  VolumeX, 
  Play, 
  Pause, 
  ChevronDown, 
  ChevronUp, 
  MapPin, 
  Info,
  Flag,
  Sparkles,
  Camera
} from 'lucide-react';
import { PropertyListing } from '../../types';

interface VideoCardProps {
  listing: PropertyListing;
  isActive: boolean;
  isMuted: boolean;
  onToggleMute: () => void;
  onOpenDetails: (listing: PropertyListing) => void;
  onOpenVerification: (listing: PropertyListing) => void;
  onOpenBooking: (listing: PropertyListing) => void;
  onOpenViewing: (listing: PropertyListing) => void;
  onToggleFavorite: (listingId: string) => void;
  onNextVideo?: () => void;
  onPrevVideo?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
}

export const VideoCard: React.FC<VideoCardProps> = ({
  listing,
  isActive,
  isMuted,
  onToggleMute,
  onOpenDetails,
  onOpenVerification,
  onOpenBooking,
  onOpenViewing,
  onToggleFavorite,
  onNextVideo,
  onPrevVideo,
  hasPrev,
  hasNext,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [showPlayPauseFeedback, setShowPlayPauseFeedback] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [copiedToast, setCopiedToast] = useState<boolean>(false);
  const [hasVideoError, setHasVideoError] = useState<boolean>(false);
  const [activePhotoIndex, setActivePhotoIndex] = useState<number>(0);

  // Reset states when listing changes
  useEffect(() => {
    setHasVideoError(false);
    setProgress(0);
    setActivePhotoIndex(0);
    setIsPlaying(true);
  }, [listing.id]);

  // Video playback management
  useEffect(() => {
    if (!hasVideoError && videoRef.current) {
      if (isActive) {
        videoRef.current.currentTime = 0;
        const playPromise = videoRef.current.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => setIsPlaying(true))
            .catch(() => {
              // Autoplay policy or connection issue caught safely
              setIsPlaying(false);
            });
        }
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  }, [isActive, hasVideoError, listing.media.videoUrl]);

  // Fallback photo tour timer if video cannot be loaded
  useEffect(() => {
    if (hasVideoError && isActive && isPlaying) {
      const photosCount = Math.max(1, listing.media.photos.length);
      const interval = setInterval(() => {
        setActivePhotoIndex((prev) => (prev + 1) % photosCount);
      }, 3500);

      const progressInterval = setInterval(() => {
        setProgress((prev) => (prev >= 100 ? 0 : prev + 2.5));
      }, 200);

      return () => {
        clearInterval(interval);
        clearInterval(progressInterval);
      };
    }
  }, [hasVideoError, isActive, isPlaying, listing.media.photos.length]);

  const handleTimeUpdate = () => {
    if (videoRef.current && videoRef.current.duration) {
      const current = videoRef.current.currentTime;
      const total = videoRef.current.duration;
      setProgress((current / total) * 100);
    }
  };

  const togglePlayPause = () => {
    if (hasVideoError) {
      setIsPlaying((prev) => !prev);
    } else if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play().catch(() => {});
        setIsPlaying(true);
      }
    }
    setShowPlayPauseFeedback(true);
    setTimeout(() => setShowPlayPauseFeedback(false), 600);
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard?.writeText(window.location.href);
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 2000);
  };

  // Format CDF amount with proper spacing (e.g., 250 000 CDF)
  const formatCDF = (num: number) => {
    return new Intl.NumberFormat('fr-CD').format(num);
  };

  const photosList = listing.media.photos.length > 0 
    ? listing.media.photos 
    : [listing.media.videoThumbnail];

  return (
    <div className="relative w-full h-full bg-slate-950 overflow-hidden select-none">
      {/* Primary Video or Graceful Ken Burns Visual Tour Fallback */}
      {!hasVideoError ? (
        <video
          ref={videoRef}
          poster={listing.media.videoThumbnail}
          loop
          playsInline
          muted={isMuted}
          crossOrigin="anonymous"
          preload="metadata"
          onTimeUpdate={handleTimeUpdate}
          onClick={togglePlayPause}
          onError={() => {
            // If the remote video cannot be loaded by the browser sandbox, smoothly fallback to Ken Burns tour
            setHasVideoError(true);
          }}
          className="absolute inset-0 w-full h-full object-cover cursor-pointer"
        >
          <source src={listing.media.videoUrl} type="video/mp4" />
          <source src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4" type="video/mp4" />
        </video>
      ) : (
        /* Ken Burns Animated Visual Walkthrough */
        <div 
          onClick={togglePlayPause}
          className="absolute inset-0 w-full h-full cursor-pointer overflow-hidden bg-slate-950"
        >
          {photosList.map((photo, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                index === activePhotoIndex ? 'opacity-100 z-0' : 'opacity-0 -z-10'
              }`}
            >
              <img
                src={photo}
                alt={listing.title}
                className={`w-full h-full object-cover transition-transform duration-[4000ms] ease-out ${
                  isPlaying && index === activePhotoIndex ? 'scale-110' : 'scale-100'
                }`}
              />
            </div>
          ))}

          {/* Tag indicating visual tour */}
          <div className="absolute top-16 left-4 z-20 pointer-events-none">
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-amber-300 border border-amber-500/30 text-[10px] font-bold">
              <Camera className="w-3 h-3 text-amber-400" />
              <span>Visite Visuelle Guidée HD</span>
            </span>
          </div>
        </div>
      )}

      {/* Subtle play/pause central feedback animation */}
      {showPlayPauseFeedback && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
          <div className="w-16 h-16 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-white scale-110 transition-transform">
            {isPlaying ? <Play className="w-8 h-8 fill-white ml-1" /> : <Pause className="w-8 h-8 fill-white" />}
          </div>
        </div>
      )}

      {/* Top Bar Overlay */}
      <div className="absolute top-0 left-0 right-0 p-4 pt-5 bg-gradient-to-b from-black/80 via-black/30 to-transparent flex items-center justify-between z-20 pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto">
          <button 
            onClick={() => onOpenVerification(listing)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 backdrop-blur-md text-xs font-semibold hover:bg-emerald-500/30 transition-colors"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Vérifié par NZUBU</span>
          </button>

          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-white/10 backdrop-blur-md text-white/90">
            {listing.rentalMode === 'SHORT_STAY' ? 'Courte durée' : 'Bail résidentiel'}
          </span>
        </div>

        {/* Audio Mute/Unmute */}
        <div className="pointer-events-auto flex items-center gap-2">
          <button
            onClick={onToggleMute}
            aria-label={isMuted ? "Activer le son" : "Couper le son"}
            className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:bg-black/60 transition-colors"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-slate-300" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>
        </div>
      </div>

      {/* Vertical Navigation Arrows (desktop/tablet helpers) */}
      <div className="absolute top-1/2 -translate-y-1/2 left-3 hidden md:flex flex-col gap-2 z-20">
        {hasPrev && (
          <button
            onClick={onPrevVideo}
            aria-label="Vidéo précédente"
            className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white flex items-center justify-center hover:bg-black/70 hover:scale-105 transition-all shadow-md"
          >
            <ChevronUp className="w-5 h-5" />
          </button>
        )}
        {hasNext && (
          <button
            onClick={onNextVideo}
            aria-label="Vidéo suivante"
            className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white flex items-center justify-center hover:bg-black/70 hover:scale-105 transition-all shadow-md"
          >
            <ChevronDown className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Right Action Stack (TikTok style) */}
      <div className="absolute right-3 bottom-24 flex flex-col items-center gap-4 z-20">
        {/* Favori Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(listing.id);
          }}
          className="flex flex-col items-center group"
          aria-label="Ajouter aux favoris"
        >
          <div className={`w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-md transition-all shadow-md ${
            listing.isFavorite 
              ? 'bg-rose-500 text-white' 
              : 'bg-black/40 border border-white/20 text-white hover:bg-black/60'
          }`}>
            <Heart className={`w-6 h-6 ${listing.isFavorite ? 'fill-white' : ''}`} />
          </div>
          <span className="text-[11px] font-medium text-white/90 mt-1 drop-shadow">
            {listing.isFavorite ? 'Favori' : 'Aimer'}
          </span>
        </button>

        {/* Verification Report Trigger */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onOpenVerification(listing);
          }}
          className="flex flex-col items-center group"
          aria-label="Voir le rapport de vérification physique"
        >
          <div className="w-12 h-12 rounded-full bg-black/40 border border-white/20 flex items-center justify-center text-emerald-400 hover:bg-black/60 backdrop-blur-md transition-all shadow-md">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <span className="text-[11px] font-medium text-white/90 mt-1 drop-shadow">
            Contrôles
          </span>
        </button>

        {/* Primary Transaction Trigger (Book or Viewing) */}
        {listing.rentalMode === 'SHORT_STAY' ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenBooking(listing);
            }}
            className="flex flex-col items-center group"
            aria-label="Réserver ce séjour"
          >
            <div className="w-12 h-12 rounded-full bg-rose-500 text-white flex items-center justify-center hover:bg-rose-600 transition-all shadow-lg shadow-rose-500/30 scale-105 active:scale-95">
              <Calendar className="w-6 h-6" />
            </div>
            <span className="text-[11px] font-bold text-rose-400 mt-1 drop-shadow">
              Réserver
            </span>
          </button>
        ) : (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenViewing(listing);
            }}
            className="flex flex-col items-center group"
            aria-label="Demander une visite"
          >
            <div className="w-12 h-12 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center hover:bg-amber-400 transition-all shadow-lg shadow-amber-500/30 scale-105 active:scale-95">
              <Eye className="w-6 h-6" />
            </div>
            <span className="text-[11px] font-bold text-amber-300 mt-1 drop-shadow">
              Visiter
            </span>
          </button>
        )}

        {/* Fiche détaillée */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onOpenDetails(listing);
          }}
          className="flex flex-col items-center group"
          aria-label="Consulter la fiche complète"
        >
          <div className="w-12 h-12 rounded-full bg-black/40 border border-white/20 flex items-center justify-center text-white hover:bg-black/60 backdrop-blur-md transition-all shadow-md">
            <Info className="w-6 h-6" />
          </div>
          <span className="text-[11px] font-medium text-white/90 mt-1 drop-shadow">
            Fiche
          </span>
        </button>

        {/* Share Button */}
        <button
          onClick={handleShare}
          className="flex flex-col items-center group"
          aria-label="Partager ce logement"
        >
          <div className="w-12 h-12 rounded-full bg-black/40 border border-white/20 flex items-center justify-center text-white hover:bg-black/60 backdrop-blur-md transition-all shadow-md">
            <Share2 className="w-5 h-5" />
          </div>
          <span className="text-[11px] font-medium text-white/90 mt-1 drop-shadow">
            Partager
          </span>
        </button>
      </div>

      {/* Bottom Info Overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-4 pb-6 bg-gradient-to-t from-black/95 via-black/75 to-transparent z-10 text-white">
        <div className="pr-16 max-w-xl">
          {/* Price Tag in Congolese Franc (CDF) */}
          <div className="flex items-baseline gap-2 mb-1.5">
            <span className="text-2xl font-black tracking-tight text-white tabular-nums drop-shadow-sm">
              {formatCDF(listing.pricing.amountCdf)} CDF
            </span>
            <span className="text-sm font-medium text-slate-300">
              / {listing.pricing.priceUnit === 'PER_NIGHT' ? 'nuit' : 'mois'}
            </span>
            {listing.rentalMode === 'LONG_TERM' && listing.pricing.securityDepositMonths && (
              <span className="text-[11px] text-amber-300 font-medium">
                · Garantie {listing.pricing.securityDepositMonths} mois max
              </span>
            )}
          </div>

          {/* Title */}
          <h2 className="text-base font-bold text-white leading-snug line-clamp-1 drop-shadow">
            {listing.title}
          </h2>

          {/* Commune & Landmark */}
          <div className="flex items-center gap-1.5 text-xs text-slate-300 mt-1 drop-shadow">
            <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            <span className="font-semibold text-white">{listing.commune}</span>
            <span>·</span>
            <span>{listing.quartier}</span>
          </div>

          <p className="text-[11px] text-slate-300 line-clamp-1 mt-0.5">
            {listing.landmark}
          </p>

          {/* Essential Utilities observed on site */}
          <div className="flex items-center gap-2 text-[11px] text-slate-200 mt-2 font-medium">
            <span>{listing.utilities.water.testedWorking ? '💧 Eau vérifiée' : '💧 Réserve'}</span>
            <span>·</span>
            <span>
              {listing.utilities.electricity.type === 'GENERATOR_BACKUP' 
                ? '⚡ Groupe auto' 
                : listing.utilities.electricity.type === 'SOLAR_HYBRID' 
                ? '☀️ Solaire' 
                : '⚡ SNEL'}
            </span>
            {listing.utilities.ac && (
              <>
                <span>·</span>
                <span>❄️ Climatisation</span>
              </>
            )}
            {listing.utilities.wifi && (
              <>
                <span>·</span>
                <span>📶 Wi-Fi</span>
              </>
            )}
          </div>

          {/* Quick CTA button for mobile reach */}
          <div className="mt-3 flex items-center gap-2">
            {listing.rentalMode === 'SHORT_STAY' ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenBooking(listing);
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-rose-500 hover:bg-rose-600 active:scale-[0.98] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-rose-500/20 transition-all"
              >
                <Calendar className="w-4 h-4" />
                <span>Demander à réserver (Avance 20% à l'hôte)</span>
              </button>
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenViewing(listing);
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-[0.98] text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/20 transition-all"
              >
                <Eye className="w-4 h-4" />
                <span>Planifier une visite (Gratuit au pilote)</span>
              </button>
            )}

            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenDetails(listing);
              }}
              className="py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs backdrop-blur-md transition-colors"
            >
              Détails
            </button>
          </div>
        </div>
      </div>

      {/* Video Progress Line */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 z-30">
        <div 
          className="h-full bg-rose-500 transition-all duration-100 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Toast Notification when link copied */}
      {copiedToast && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 bg-slate-900/95 border border-slate-700 text-white text-xs px-4 py-2 rounded-full shadow-xl z-50 flex items-center gap-2 animate-fade-in">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Lien de l'annonce copié !</span>
        </div>
      )}
    </div>
  );
};
