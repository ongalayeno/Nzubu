/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { PropertyListing, SponsoredAd } from '../../types';
import { VideoCard } from './VideoCard';
import { SponsoredVideoCard } from './SponsoredVideoCard';
import { isAdActive } from '../../domain/ads';
import { Filter, SlidersHorizontal, MapPin, Sparkles, Zap } from 'lucide-react';

interface TikTokFeedProps {
  listings: PropertyListing[];
  sponsoredAds?: SponsoredAd[];
  onOpenDetails: (listing: PropertyListing) => void;
  onOpenVerification: (listing: PropertyListing) => void;
  onOpenBooking: (listing: PropertyListing) => void;
  onOpenViewing: (listing: PropertyListing) => void;
  onToggleFavorite: (listingId: string) => void;
  activeCommuneFilter: string;
  onChangeCommuneFilter: (commune: string) => void;
  activeModeFilter: string;
  onChangeModeFilter: (mode: string) => void;
  onAdClicked?: (adId: string) => void;
}

type FeedItem = 
  | { type: 'LISTING'; data: PropertyListing }
  | { type: 'AD'; data: SponsoredAd };

export const TikTokFeed: React.FC<TikTokFeedProps> = ({
  listings,
  sponsoredAds = [],
  onOpenDetails,
  onOpenVerification,
  onOpenBooking,
  onOpenViewing,
  onToggleFavorite,
  activeCommuneFilter,
  onChangeCommuneFilter,
  activeModeFilter,
  onChangeModeFilter,
  onAdClicked,
}) => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(true); // Muted by default per brief §13.6
  const [isEcoDataMode, setIsEcoDataMode] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef<number>(0);

  // Build combined feed: active listings interleaved with active video ads
  const combinedFeed: FeedItem[] = useMemo(() => {
    // Only include video ads that are strictly active and not expired
    const activeVideoAds = sponsoredAds.filter(
      (ad) => ad.format === 'VERTICAL_VIDEO_FEED' && isAdActive(ad)
    );

    const items: FeedItem[] = [];
    let adIndex = 0;

    listings.forEach((listing, index) => {
      items.push({ type: 'LISTING', data: listing });
      // Insert an ad after every 2nd or 3rd listing if available
      if ((index + 1) % 2 === 0 && adIndex < activeVideoAds.length) {
        items.push({ type: 'AD', data: activeVideoAds[adIndex] });
        adIndex++;
      }
    });

    // If there are still ads and no listings, or at least one ad
    if (items.length === 0 && activeVideoAds.length > 0) {
      activeVideoAds.forEach((ad) => items.push({ type: 'AD', data: ad }));
    }

    return items;
  }, [listings, sponsoredAds]);

  // Keep index within bounds if feed changes
  useEffect(() => {
    if (currentIndex >= combinedFeed.length) {
      setCurrentIndex(Math.max(0, combinedFeed.length - 1));
    }
  }, [combinedFeed.length, currentIndex]);

  // Keyboard navigation (ArrowUp, ArrowDown)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === 'm' || e.key === 'M') {
        setIsMuted((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, combinedFeed.length]);

  const handleNext = () => {
    if (currentIndex < combinedFeed.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  // Touch Swipe gestures
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEndY = e.changedTouches[0].clientY;
    const diff = touchStartY.current - touchEndY;
    // 50px threshold for swipe
    if (diff > 50) {
      handleNext();
    } else if (diff < -50) {
      handlePrev();
    }
  };

  // Wheel scroll with throttle
  const lastScrollTime = useRef<number>(0);
  const handleWheel = (e: React.WheelEvent) => {
    const now = Date.now();
    if (now - lastScrollTime.current < 450) return; // Debounce wheel
    lastScrollTime.current = now;

    if (e.deltaY > 30) {
      handleNext();
    } else if (e.deltaY < -30) {
      handlePrev();
    }
  };

  if (combinedFeed.length === 0) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white transition-colors">
        <Filter className="w-12 h-12 text-slate-400 dark:text-slate-600 mb-3" />
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Aucun logement trouvé</h3>
        <p className="text-sm text-slate-600 dark:text-slate-400 max-w-xs mb-4">
          Essayez d'élargir vos filtres (commune ou type de durée) pour découvrir d'autres biens vérifiés à Kinshasa.
        </p>
        <button
          onClick={() => {
            onChangeCommuneFilter('ALL');
            onChangeModeFilter('ALL');
          }}
          className="px-4 py-2 rounded-xl bg-rose-500 text-white text-xs font-semibold hover:bg-rose-600 transition-colors"
        >
          Réinitialiser les filtres
        </button>
      </div>
    );
  }

  const currentItem = combinedFeed[currentIndex];

  return (
    <div 
      ref={containerRef}
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="relative w-full h-full bg-slate-950 overflow-hidden"
    >
      {/* Quick Filter Bar Pinned on top of feed */}
      <div className="absolute top-3 left-4 right-14 z-30 flex items-center gap-1.5 overflow-x-auto no-scrollbar pointer-events-auto">
        {/* Commune quick buttons */}
        <button
          onClick={() => onChangeCommuneFilter('ALL')}
          className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap backdrop-blur-md transition-all ${
            activeCommuneFilter === 'ALL'
              ? 'bg-white text-slate-950 shadow-md'
              : 'bg-black/50 text-slate-300 border border-white/10 hover:bg-black/70'
          }`}
        >
          Toutes communes
        </button>
        <button
          onClick={() => onChangeCommuneFilter('Gombe')}
          className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap backdrop-blur-md transition-all ${
            activeCommuneFilter === 'Gombe'
              ? 'bg-rose-500 text-white shadow-md'
              : 'bg-black/50 text-slate-300 border border-white/10 hover:bg-black/70'
          }`}
        >
          Gombe
        </button>
        <button
          onClick={() => onChangeCommuneFilter('Ngaliema')}
          className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap backdrop-blur-md transition-all ${
            activeCommuneFilter === 'Ngaliema'
              ? 'bg-rose-500 text-white shadow-md'
              : 'bg-black/50 text-slate-300 border border-white/10 hover:bg-black/70'
          }`}
        >
          Ngaliema
        </button>
        <button
          onClick={() => onChangeCommuneFilter('Lingwala')}
          className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap backdrop-blur-md transition-all ${
            activeCommuneFilter === 'Lingwala'
              ? 'bg-rose-500 text-white shadow-md'
              : 'bg-black/50 text-slate-300 border border-white/10 hover:bg-black/70'
          }`}
        >
          Lingwala
        </button>

        {/* Separator */}
        <span className="text-white/30 text-xs">|</span>

        {/* Mode filter button */}
        <button
          onClick={() => {
            if (activeModeFilter === 'ALL') onChangeModeFilter('SHORT_STAY');
            else if (activeModeFilter === 'SHORT_STAY') onChangeModeFilter('LONG_TERM');
            else onChangeModeFilter('ALL');
          }}
          className="px-2.5 py-1 rounded-full bg-black/50 border border-white/15 text-amber-300 backdrop-blur-md text-xs font-semibold flex items-center gap-1 hover:bg-black/70 transition-colors whitespace-nowrap"
        >
          <SlidersHorizontal className="w-3 h-3" />
          <span>
            {activeModeFilter === 'ALL'
              ? 'Durée : Tous'
              : activeModeFilter === 'SHORT_STAY'
              ? 'Courte durée'
              : 'Longue durée'}
          </span>
        </button>

        {/* Separator */}
        <span className="text-white/30 text-xs">|</span>

        {/* Mode Éco-Data Réseau Faible Kinshasa (-85% Mo) */}
        <button
          onClick={() => setIsEcoDataMode((prev) => !prev)}
          className={`px-2.5 py-1 rounded-full backdrop-blur-md text-xs font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap ${
            isEcoDataMode
              ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/30'
              : 'bg-black/50 border border-emerald-500/30 text-emerald-400 hover:bg-black/70'
          }`}
          title="Mode basse consommation : Remplace les vidéos lourdes par des photos optimisées (-85% mégaoctets sur réseaux mobiles)"
        >
          <Zap className="w-3 h-3" />
          <span>{isEcoDataMode ? 'Éco-Data Actif (-85%)' : 'Éco-Data 3G/4G'}</span>
        </button>
      </div>

      {/* Main active item: either Listing VideoCard or SponsoredVideoCard */}
      {currentItem.type === 'LISTING' ? (
        <VideoCard
          listing={currentItem.data}
          isActive={true}
          isMuted={isMuted}
          onToggleMute={() => setIsMuted((prev) => !prev)}
          onOpenDetails={onOpenDetails}
          onOpenVerification={onOpenVerification}
          onOpenBooking={onOpenBooking}
          onOpenViewing={onOpenViewing}
          onToggleFavorite={onToggleFavorite}
          onNextVideo={handleNext}
          onPrevVideo={handlePrev}
          hasPrev={currentIndex > 0}
          hasNext={currentIndex < combinedFeed.length - 1}
          isEcoDataMode={isEcoDataMode}
        />
      ) : (
        <SponsoredVideoCard
          ad={currentItem.data}
          isActive={true}
          isMuted={isMuted}
          onToggleMute={() => setIsMuted((prev) => !prev)}
          onNextVideo={handleNext}
          onPrevVideo={handlePrev}
          hasPrev={currentIndex > 0}
          hasNext={currentIndex < combinedFeed.length - 1}
          onAdClicked={onAdClicked}
        />
      )}

      {/* Index indicator pill (top right) */}
      <div className="absolute top-3.5 right-4 z-30 pointer-events-none">
        <span className="text-[11px] font-bold text-white/90 bg-black/50 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/10 tabular-nums">
          {currentIndex + 1} / {combinedFeed.length}
        </span>
      </div>
    </div>
  );
};
