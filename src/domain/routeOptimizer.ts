/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FieldMission, InspectionRouteStop } from '../types';

export interface LatLng {
  lat: number;
  lng: number;
}

export interface CommuneGeoInfo {
  name: string;
  coords: LatLng;
  recommendedSlot: 'MORNING' | 'MIDDAY' | 'AFTERNOON';
  corridor: string;
  avoidNote: string;
  estimatedTrafficMinutesSaved: number;
}

export const KINSHASA_COMMUNES_GEO: Record<string, CommuneGeoInfo> = {
  gombe: {
    name: 'Gombe',
    coords: { lat: -4.3042, lng: 15.3084 },
    recommendedSlot: 'MORNING',
    corridor: 'Axe Boulevard du 30 Juin avant 08h30',
    avoidNote: 'Éviter carrefour Batetela & Rond-Point Forescom après 09h00',
    estimatedTrafficMinutesSaved: 55,
  },
  barumbu: {
    name: 'Barumbu',
    coords: { lat: -4.3168, lng: 15.3185 },
    recommendedSlot: 'MORNING',
    corridor: 'Avenue Kabambare / Boulevard Lumumba Nord',
    avoidNote: 'Contourner le Marché Central via Av. Bokasa tôt le matin',
    estimatedTrafficMinutesSaved: 35,
  },
  kinshasa: {
    name: 'Kinshasa',
    coords: { lat: -4.3248, lng: 15.3132 },
    recommendedSlot: 'MORNING',
    corridor: 'Avenue du Commerce / Kato',
    avoidNote: 'Éviter les artères encombrées de Gambela',
    estimatedTrafficMinutesSaved: 30,
  },
  lingwala: {
    name: 'Lingwala',
    coords: { lat: -4.3245, lng: 15.2975 },
    recommendedSlot: 'MIDDAY',
    corridor: 'Avenue Mushie / Kalembelembe (axe fluide 11h30–14h)',
    avoidNote: 'Éviter Avenue des Huileries & Boulevard Triomphal aux heures de pointe',
    estimatedTrafficMinutesSaved: 40,
  },
  'kasa-vubu': {
    name: 'Kasa-Vubu',
    coords: { lat: -4.3375, lng: 15.3022 },
    recommendedSlot: 'MIDDAY',
    corridor: 'Avenue Assossa / Force Publique',
    avoidNote: 'Éviter le Rond-Point Victoire en fin d’après-midi',
    estimatedTrafficMinutesSaved: 35,
  },
  bandalungwa: {
    name: 'Bandalungwa',
    coords: { lat: -4.3395, lng: 15.2845 },
    recommendedSlot: 'MIDDAY',
    corridor: 'Avenue Kasa-Vubu via Makelele',
    avoidNote: 'Éviter le pont Makelele en heure de pointe',
    estimatedTrafficMinutesSaved: 35,
  },
  kintambo: {
    name: 'Kintambo',
    coords: { lat: -4.3272, lng: 15.2721 },
    recommendedSlot: 'AFTERNOON',
    corridor: 'Détour par Avenue OUA / Colonel Mondjiba',
    avoidNote: 'Contourner le goulot de Kintambo Magasin',
    estimatedTrafficMinutesSaved: 45,
  },
  ngaliema: {
    name: 'Ngaliema',
    coords: { lat: -4.3422, lng: 15.2524 },
    recommendedSlot: 'AFTERNOON',
    corridor: 'Montée par Avenue Mondjiba & Route de Matadi / Macampagne',
    avoidNote: 'Éviter le goulot Kintambo Magasin & carrefour Pompage',
    estimatedTrafficMinutesSaved: 50,
  },
  'mont-ngafula': {
    name: 'Mont-Ngafula',
    coords: { lat: -4.402, lng: 15.265 },
    recommendedSlot: 'AFTERNOON',
    corridor: 'Route By-Pass / Avenue de l’Université',
    avoidNote: 'Anticiper la montée Triangle / Matadi Kibala',
    estimatedTrafficMinutesSaved: 40,
  },
  limete: {
    name: 'Limete',
    coords: { lat: -4.3485, lng: 15.3352 },
    recommendedSlot: 'MIDDAY',
    corridor: 'Avenue Poids Lourds / 7ème Rue Résidentielle',
    avoidNote: 'Éviter l’échangeur de Limete aux heures de bureau',
    estimatedTrafficMinutesSaved: 40,
  },
};

export function normalizeCommuneKey(commune: string): string {
  return commune
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function getCommuneGeoInfo(commune: string): CommuneGeoInfo {
  const key = normalizeCommuneKey(commune);
  if (KINSHASA_COMMUNES_GEO[key]) {
    return KINSHASA_COMMUNES_GEO[key];
  }
  return {
    name: commune || 'Kinshasa',
    coords: { lat: -4.3317, lng: 15.3139 },
    recommendedSlot: 'MIDDAY',
    corridor: `Axe principal de ${commune || 'Kinshasa'}`,
    avoidNote: 'Éviter les grands axes saturés aux heures de pointe',
    estimatedTrafficMinutesSaved: 30,
  };
}

export function haversineDistanceKm(a: LatLng, b: LatLng): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;

  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const h = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng;
  return 2 * R * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function getMissionCoords(mission: FieldMission): LatLng {
  if (mission.gpsCoordinates) {
    return {
      lat: mission.gpsCoordinates.latitude,
      lng: mission.gpsCoordinates.longitude,
    };
  }
  return getCommuneGeoInfo(mission.commune).coords;
}

function computePathDistanceKm(missions: FieldMission[], startCoords: LatLng): number {
  if (missions.length === 0) return 0;
  let total = 0;
  let current = startCoords;
  for (const m of missions) {
    const target = getMissionCoords(m);
    total += haversineDistanceKm(current, target);
    current = target;
  }
  return Math.round(total * 10) / 10;
}

export interface OptimizedRouteStop extends InspectionRouteStop {
  status: FieldMission['status'];
  distanceFromPrevKm: number;
  communeGroupIndex: number;
  communeGroupSize: number;
}

export interface CommuneClusterSummary {
  commune: string;
  count: number;
  distanceKmFromPrev: number;
  timeSlot: 'MORNING' | 'MIDDAY' | 'AFTERNOON';
}

export interface RouteOptimizationResult {
  stops: OptimizedRouteStop[];
  communeSequence: CommuneClusterSummary[];
  totalOptimizedDistanceKm: number;
  unoptimizedDistanceKm: number;
  distanceSavedKm: number;
  totalSavedMinutes: number;
}

function slotFromIndex(clusterIdx: number, totalClusters: number, defaultSlot: 'MORNING' | 'MIDDAY' | 'AFTERNOON'): 'MORNING' | 'MIDDAY' | 'AFTERNOON' {
  if (totalClusters <= 1) return defaultSlot;
  if (clusterIdx === 0) return 'MORNING';
  if (clusterIdx === totalClusters - 1 && totalClusters >= 3) return 'AFTERNOON';
  return 'MIDDAY';
}

/**
 * Regroupe automatiquement les missions par commune et ordonne les groupes
 * par proximité géographique (plus proche voisin à partir de startCommune,
 * ex: Gombe -> Lingwala -> Ngaliema) afin de minimiser les déplacements à moto.
 */
export function sortMissionsByGeographicProximity(
  missions: FieldMission[],
  startCommune: string = 'Gombe',
  mode: 'AUTO_PROXIMITY' | 'ORIGINAL_ORDER' = 'AUTO_PROXIMITY'
): RouteOptimizationResult {
  if (missions.length === 0) {
    return {
      stops: [],
      communeSequence: [],
      totalOptimizedDistanceKm: 0,
      unoptimizedDistanceKm: 0,
      distanceSavedKm: 0,
      totalSavedMinutes: 0,
    };
  }

  const startInfo = getCommuneGeoInfo(startCommune);
  const unoptimizedDistanceKm = computePathDistanceKm(missions, startInfo.coords);

  let orderedMissions: FieldMission[] = [];
  const communeSequence: CommuneClusterSummary[] = [];

  if (mode === 'ORIGINAL_ORDER') {
    orderedMissions = [...missions];
    const seen = new Map<string, number>();
    orderedMissions.forEach((m) => {
      const name = getCommuneGeoInfo(m.commune).name;
      seen.set(name, (seen.get(name) || 0) + 1);
    });
    let prev = startInfo.coords;
    let idx = 0;
    for (const [name, count] of seen.entries()) {
      const geo = getCommuneGeoInfo(name);
      communeSequence.push({
        commune: name,
        count,
        distanceKmFromPrev: Math.round(haversineDistanceKm(prev, geo.coords) * 10) / 10,
        timeSlot: slotFromIndex(idx, seen.size, geo.recommendedSlot),
      });
      prev = geo.coords;
      idx += 1;
    }
  } else {
    // 1. Grouper les missions par commune normalisée
    const groups = new Map<string, { displayName: string; geo: CommuneGeoInfo; items: FieldMission[] }>();
    for (const mission of missions) {
      const key = normalizeCommuneKey(mission.commune || 'Kinshasa');
      const geo = getCommuneGeoInfo(mission.commune);
      if (!groups.has(key)) {
        groups.set(key, { displayName: geo.name, geo, items: [] });
      }
      groups.get(key)!.items.push(mission);
    }

    // 2. Ordonner les clusters de communes par proximité géographique (nearest-neighbor)
    const remainingKeys = Array.from(groups.keys());
    const orderedClusterKeys: string[] = [];
    let currentAnchor: LatLng = startInfo.coords;

    // Si la commune de départ est présente dans les missions, elle est visitée en premier
    const startKey = normalizeCommuneKey(startCommune);
    if (groups.has(startKey)) {
      orderedClusterKeys.push(startKey);
      remainingKeys.splice(remainingKeys.indexOf(startKey), 1);
      currentAnchor = groups.get(startKey)!.geo.coords;
    }

    while (remainingKeys.length > 0) {
      let bestIdx = 0;
      let bestDist = Infinity;
      for (let i = 0; i < remainingKeys.length; i++) {
        const candidateGeo = groups.get(remainingKeys[i])!.geo;
        const dist = haversineDistanceKm(currentAnchor, candidateGeo.coords);
        if (dist < bestDist) {
          bestDist = dist;
          bestIdx = i;
        }
      }
      const nextKey = remainingKeys.splice(bestIdx, 1)[0];
      orderedClusterKeys.push(nextKey);
      currentAnchor = groups.get(nextKey)!.geo.coords;
    }

    // 3. À l'intérieur de chaque commune, trier les missions par proximité GPS puis quartier/heure
    let prevClusterCoords = startInfo.coords;
    orderedClusterKeys.forEach((key, clusterIdx) => {
      const group = groups.get(key)!;
      const clusterDist = Math.round(haversineDistanceKm(prevClusterCoords, group.geo.coords) * 10) / 10;
      communeSequence.push({
        commune: group.displayName,
        count: group.items.length,
        distanceKmFromPrev: clusterDist,
        timeSlot: slotFromIndex(clusterIdx, orderedClusterKeys.length, group.geo.recommendedSlot),
      });
      prevClusterCoords = group.geo.coords;

      // Sub-sort inside the commune by nearest-neighbor GPS (or quartier + scheduledTime)
      const unvisited = [...group.items];
      let subAnchor = group.geo.coords;
      while (unvisited.length > 0) {
        unvisited.sort((a, b) => {
          const distA = a.gpsCoordinates ? haversineDistanceKm(subAnchor, getMissionCoords(a)) : 0;
          const distB = b.gpsCoordinates ? haversineDistanceKm(subAnchor, getMissionCoords(b)) : 0;
          if (Math.abs(distA - distB) > 0.05) return distA - distB;
          const qCompare = (a.quartier || '').localeCompare(b.quartier || '', 'fr');
          if (qCompare !== 0) return qCompare;
          return (a.scheduledTime || '').localeCompare(b.scheduledTime || '', 'fr');
        });
        const nextMission = unvisited.shift()!;
        orderedMissions.push(nextMission);
        subAnchor = getMissionCoords(nextMission);
      }
    });
  }

  const totalOptimizedDistanceKm = computePathDistanceKm(orderedMissions, startInfo.coords);
  const distanceSavedKm = Math.max(0, Math.round((unoptimizedDistanceKm - totalOptimizedDistanceKm) * 10) / 10);

  // Build final stops list
  const communeCountMap = new Map<string, number>();
  orderedMissions.forEach((m) => {
    const k = normalizeCommuneKey(m.commune);
    communeCountMap.set(k, (communeCountMap.get(k) || 0) + 1);
  });

  const seenClusterOrder = new Map<string, number>();
  let clusterCounter = 0;
  let prevStopCoords = startInfo.coords;

  const stops: OptimizedRouteStop[] = orderedMissions.map((m) => {
    const k = normalizeCommuneKey(m.commune);
    if (!seenClusterOrder.has(k)) {
      seenClusterOrder.set(k, clusterCounter);
      clusterCounter += 1;
    }
    const cIdx = seenClusterOrder.get(k)!;
    const geo = getCommuneGeoInfo(m.commune);
    const coords = getMissionCoords(m);
    const distFromPrev = Math.round(haversineDistanceKm(prevStopCoords, coords) * 10) / 10;
    prevStopCoords = coords;

    const totalClusters = communeSequence.length || 1;
    const timeSlot = slotFromIndex(cIdx, totalClusters, geo.recommendedSlot);

    return {
      missionId: m.id,
      unitTitle: m.unitTitle,
      commune: geo.name,
      quartier: m.quartier,
      landmark: m.landmark,
      contactPerson: m.contactPerson,
      contactPhone: m.contactPhone,
      timeSlot,
      estimatedTrafficDelayMinutes: geo.estimatedTrafficMinutesSaved,
      recommendedCorridor: `${geo.corridor} (${geo.avoidNote})`,
      isCompleted: m.status === 'APPROVED' || m.status === 'REPORT_SUBMITTED',
      status: m.status,
      distanceFromPrevKm: distFromPrev,
      communeGroupIndex: cIdx,
      communeGroupSize: communeCountMap.get(k) || 1,
    };
  });

  // Minutes saved = sum of unique commune corridor savings + ~4 min per km saved from clustering
  const uniqueClusterMinutes = communeSequence.reduce(
    (acc, c) => acc + getCommuneGeoInfo(c.commune).estimatedTrafficMinutesSaved,
    0
  );
  const totalSavedMinutes = uniqueClusterMinutes + Math.round(distanceSavedKm * 4);

  return {
    stops,
    communeSequence,
    totalOptimizedDistanceKm,
    unoptimizedDistanceKm,
    distanceSavedKm,
    totalSavedMinutes,
  };
}
