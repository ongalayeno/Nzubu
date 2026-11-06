/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SponsoredAd } from '../types';

export interface AdTariffPlan {
  id: string;
  name: string;
  durationDays: number;
  priceCdf: number;
  popular?: boolean;
  savingsLabel?: string;
  description: string;
}

export const AD_TARIFFS: AdTariffPlan[] = [
  {
    id: 'plan-3d',
    name: 'Flash Découverte',
    durationDays: 3,
    priceCdf: 35000,
    description: 'Idéal pour une annonce urgente ou un lancement de service ponctuel.',
  },
  {
    id: 'plan-7d',
    name: 'Booster 1 Semaine',
    durationDays: 7,
    priceCdf: 75000,
    popular: true,
    savingsLabel: 'Le plus populaire à Kinshasa',
    description: 'Excellente visibilité dans le Feed Vidéo et en tête du catalogue.',
  },
  {
    id: 'plan-14d',
    name: 'Impact 2 Semaines',
    durationDays: 14,
    priceCdf: 135000,
    savingsLabel: 'Économisez 10 %',
    description: 'Campagne soutenue touchant les locataires et propriétaires actifs.',
  },
  {
    id: 'plan-30d',
    name: 'Partenaire 1 Mois',
    durationDays: 30,
    priceCdf: 250000,
    savingsLabel: 'Meilleur tarif par jour',
    description: 'Présence continue garantie avec renouvellement automatique possible.',
  },
];

/**
 * Checks whether an ad is currently active and within its validity period.
 * Strictly enforces automated expiration without requiring manual intervention.
 */
export function isAdActive(ad: SponsoredAd): boolean {
  if (ad.status !== 'ACTIVE') return false;
  const expiryTime = new Date(ad.expiresAt).getTime();
  if (Number.isNaN(expiryTime)) return false;
  return expiryTime > Date.now();
}

/**
 * Computes remaining human-friendly time before automatic expiration.
 */
export function getRemainingAdTime(expiresAt: string): {
  days: number;
  hours: number;
  minutes: number;
  isExpired: boolean;
  label: string;
} {
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0 || Number.isNaN(diff)) {
    return { days: 0, hours: 0, minutes: 0, isExpired: true, label: 'Campagne expirée' };
  }
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  let label = '';
  if (days > 1) {
    label = `Valable encore ${days} jours`;
  } else if (days === 1) {
    label = `Valable encore 1 jour et ${hours}h`;
  } else if (hours > 0) {
    label = `Expire dans ${hours}h ${minutes}min`;
  } else {
    label = `Expire dans ${Math.max(1, minutes)} min`;
  }

  return { days, hours, minutes, isExpired: false, label };
}

/**
 * Partitions ads between active campaigns and expired/archived campaigns.
 */
export function partitionAds(ads: SponsoredAd[]): {
  activeAds: SponsoredAd[];
  expiredAds: SponsoredAd[];
  totalRevenueCdf: number;
} {
  const activeAds: SponsoredAd[] = [];
  const expiredAds: SponsoredAd[] = [];
  let totalRevenueCdf = 0;

  ads.forEach((ad) => {
    totalRevenueCdf += ad.pricePaidCdf || 0;
    if (isAdActive(ad)) {
      activeAds.push(ad);
    } else {
      expiredAds.push({ ...ad, status: 'EXPIRED' });
    }
  });

  return { activeAds, expiredAds, totalRevenueCdf };
}
