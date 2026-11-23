import React, { useMemo, useState } from 'react';
import {
  X,
  Navigation,
  MapPin,
  BatteryCharging,
  AlertTriangle,
  CheckCircle2,
  Compass,
  Fuel,
  Phone,
  ArrowRight,
  Route,
  Sparkles,
  RotateCw
} from 'lucide-react';
import { FieldMission } from '../../types';
import {
  sortMissionsByGeographicProximity,
  getCommuneGeoInfo,
  normalizeCommuneKey
} from '../../domain/routeOptimizer';

interface MotoRouteOptimizerModalProps {
  missions: FieldMission[];
  onClose: () => void;
  onSelectMission?: (missionId: string) => void;
}

const PILOT_KINSHASA_CORRIDOR_MISSIONS: FieldMission[] = [
  {
    id: 'tour-ngaliema-1',
    unitTitle: 'Villa avec Forage & Groupe — Ngaliema Macampagne',
    commune: 'Ngaliema',
    quartier: 'Macampagne',
    landmark: 'Arrêt Météo / Croisement Avenue de la Paix',
    contactPerson: 'Me Jean-Luc (Mandataire)',
    contactPhone: '+243 82 333 0303',
    scheduledTime: '15:30',
    agentId: 'NZUBU-AG-02',
    agentName: 'Alain Kambale',
    status: 'ASSIGNED',
    checklist: {
      identityVerified: false,
      mandateOrTitleChecked: false,
      physicalPresenceConfirmed: false,
      waterSupplyTested: false,
      electricityTested: false,
      roomsMatchedListing: false,
      pricingInCdfNoExcessiveDeposit: false,
      videoFilmedVerticalNoFaces: false,
      safetyEgressChecked: false,
    },
  },
  {
    id: 'tour-gombe-1',
    unitTitle: 'Appartement Haut Standing — Gombe Fleuve',
    commune: 'Gombe',
    quartier: 'Haut Commandement',
    landmark: 'Proche Ambassade de France & Clinique Ngaliema',
    contactPerson: 'Papa Jacques (Intendant)',
    contactPhone: '+243 81 555 0101',
    scheduledTime: '08:00',
    agentId: 'NZUBU-AG-02',
    agentName: 'Alain Kambale',
    status: 'ASSIGNED',
    checklist: {
      identityVerified: false,
      mandateOrTitleChecked: false,
      physicalPresenceConfirmed: false,
      waterSupplyTested: false,
      electricityTested: false,
      roomsMatchedListing: false,
      pricingInCdfNoExcessiveDeposit: false,
      videoFilmedVerticalNoFaces: false,
      safetyEgressChecked: false,
    },
  },
  {
    id: 'tour-lingwala-1',
    unitTitle: 'Studio Équipé — Lingwala Palais du Peuple',
    commune: 'Lingwala',
    quartier: 'Kabinda',
    landmark: 'Derrière RTNC & Hôpital Chinois',
    contactPerson: 'Maman Sarah (Propriétaire)',
    contactPhone: '+243 99 444 0202',
    scheduledTime: '12:30',
    agentId: 'NZUBU-AG-02',
    agentName: 'Alain Kambale',
    status: 'ASSIGNED',
    checklist: {
      identityVerified: false,
      mandateOrTitleChecked: false,
      physicalPresenceConfirmed: false,
      waterSupplyTested: false,
      electricityTested: false,
      roomsMatchedListing: false,
      pricingInCdfNoExcessiveDeposit: false,
      videoFilmedVerticalNoFaces: false,
      safetyEgressChecked: false,
    },
  },
  {
    id: 'tour-gombe-2',
    unitTitle: 'Duplex Résidentiel — Gombe Socimat',
    commune: 'Gombe',
    quartier: 'Socimat',
    landmark: 'Rond-point Socimat / Avenue Colonel Mondjiba',
    contactPerson: 'Mme Nadia (Gestionnaire)',
    contactPhone: '+243 81 222 0909',
    scheduledTime: '09:30',
    agentId: 'NZUBU-AG-02',
    agentName: 'Alain Kambale',
    status: 'ASSIGNED',
    checklist: {
      identityVerified: false,
      mandateOrTitleChecked: false,
      physicalPresenceConfirmed: false,
      waterSupplyTested: false,
      electricityTested: false,
      roomsMatchedListing: false,
      pricingInCdfNoExcessiveDeposit: false,
      videoFilmedVerticalNoFaces: false,
      safetyEgressChecked: false,
    },
  },
];

export const MotoRouteOptimizerModal: React.FC<MotoRouteOptimizerModalProps> = ({
  missions,
  onClose,
  onSelectMission,
}) => {
  const [ultraBatterySaver, setUltraBatterySaver] = useState<boolean>(false);
  const [startCommune, setStartCommune] = useState<string>('Gombe');
  const [sortMode, setSortMode] = useState<'AUTO_PROXIMITY' | 'ORIGINAL_ORDER'>('AUTO_PROXIMITY');
  const [completedOverrides, setCompletedOverrides] = useState<Record<string, boolean>>({});
  const [activeMissionId, setActiveMissionId] = useState<string | null>(null);
  const [previewSampleRoute, setPreviewSampleRoute] = useState<boolean>(false);

  const effectiveMissions = missions.length > 0 ? missions : (previewSampleRoute ? PILOT_KINSHASA_CORRIDOR_MISSIONS : []);

  const availableStartCommunes = useMemo(() => {
    const defaults = ['Gombe', 'Lingwala', 'Ngaliema'];
    const set = new Set<string>(defaults);
    effectiveMissions.forEach((m) => {
      if (m.commune) set.add(getCommuneGeoInfo(m.commune).name);
    });
    return Array.from(set);
  }, [effectiveMissions]);

  const routeResult = useMemo(
    () => sortMissionsByGeographicProximity(effectiveMissions, startCommune, sortMode),
    [effectiveMissions, startCommune, sortMode]
  );

  const toggleStopCompletion = (missionId: string, currentCompleted: boolean) => {
    setCompletedOverrides((prev) => ({
      ...prev,
      [missionId]: !currentCompleted,
    }));
  };

  const estimatedFuelLiters = Math.max(0.5, Math.round((routeResult.totalOptimizedDistanceKm / 15 + 0.6) * 10) / 10);

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 backdrop-blur-sm animate-fade-in overflow-y-auto ${
        ultraBatterySaver
          ? 'bg-black text-white'
          : 'bg-slate-900/60 dark:bg-slate-950/85 text-slate-900 dark:text-white'
      }`}
    >
      <div
        className={`border rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl my-auto transition-colors ${
          ultraBatterySaver
            ? 'bg-black border-zinc-700 text-white'
            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white'
        }`}
      >
        {/* Header */}
        <div
          className={`p-5 border-b flex flex-wrap items-center justify-between gap-3 ${
            ultraBatterySaver
              ? 'border-zinc-800 bg-black'
              : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center border shrink-0 ${
                ultraBatterySaver
                  ? 'bg-white text-black border-white'
                  : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
              }`}
            >
              <Navigation className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-bold text-base">
                  Optimiseur Tournée Moto Kinshasa
                </h3>
                <span
                  className={`text-[11px] font-medium ${
                    ultraBatterySaver ? 'text-zinc-400' : 'text-emerald-700 dark:text-emerald-400'
                  }`}
                >
                  · Regroupement géographique automatique
                </span>
              </div>
              <p className={`text-xs mt-0.5 ${ultraBatterySaver ? 'text-zinc-400' : 'text-slate-600 dark:text-slate-400'}`}>
                Classement intelligent par proximité de communes pour éviter les allers-retours.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Battery Mode Toggle */}
            <button
              type="button"
              onClick={() => setUltraBatterySaver(!ultraBatterySaver)}
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border whitespace-nowrap ${
                ultraBatterySaver
                  ? 'bg-white text-black border-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:text-slate-950 dark:hover:text-white'
              }`}
              title="Mode Économie Batterie Extrême pour délestage"
            >
              <BatteryCharging className="w-4 h-4" />
              <span className="hidden sm:inline">
                {ultraBatterySaver ? 'OLED Éco Actif' : 'Mode Éco Batterie'}
              </span>
            </button>

            <button
              type="button"
              onClick={onClose}
              aria-label="Fermer l'optimiseur"
              className={`p-2 rounded-xl transition-colors ${
                ultraBatterySaver
                  ? 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Automatic Proximity Sorting Controls */}
        <div
          className={`p-3.5 border-b flex flex-wrap items-center justify-between gap-3 text-xs ${
            ultraBatterySaver
              ? 'bg-zinc-950 border-zinc-800 text-zinc-200'
              : 'bg-slate-50/70 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200'
          }`}
        >
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-1.5 font-semibold">
              <MapPin className="w-3.5 h-3.5 text-rose-500" />
              <span>Départ moto :</span>
              <select
                value={startCommune}
                onChange={(e) => setStartCommune(e.target.value)}
                className={`px-2.5 py-1 rounded-lg border text-xs font-bold focus:outline-none ${
                  ultraBatterySaver
                    ? 'bg-black border-zinc-700 text-white'
                    : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white'
                }`}
              >
                {availableStartCommunes.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>

            <div
              className={`flex items-center gap-1 p-0.5 rounded-lg border ${
                ultraBatterySaver
                  ? 'bg-black border-zinc-800'
                  : 'bg-slate-200/70 dark:bg-slate-900 border-slate-300 dark:border-slate-800'
              }`}
            >
              <button
                type="button"
                onClick={() => setSortMode('AUTO_PROXIMITY')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors flex items-center gap-1 whitespace-nowrap ${
                  sortMode === 'AUTO_PROXIMITY'
                    ? ultraBatterySaver
                      ? 'bg-white text-black'
                      : 'bg-emerald-500 text-slate-950 shadow-sm'
                    : ultraBatterySaver
                    ? 'text-zinc-400 hover:text-white'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Route className="w-3 h-3" />
                <span>Tri Auto Proximité</span>
              </button>
              <button
                type="button"
                onClick={() => setSortMode('ORIGINAL_ORDER')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors whitespace-nowrap ${
                  sortMode === 'ORIGINAL_ORDER'
                    ? ultraBatterySaver
                      ? 'bg-white text-black'
                      : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                    : ultraBatterySaver
                    ? 'text-zinc-400 hover:text-white'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span>Ordre initial</span>
              </button>
            </div>
          </div>

          {effectiveMissions.length > 0 && (
            <div className="flex items-center gap-3 font-mono text-[11px] tabular-nums">
              <span>
                Total : <strong className={ultraBatterySaver ? 'text-white' : 'text-slate-900 dark:text-white'}>{routeResult.totalOptimizedDistanceKm} km</strong>
              </span>
              {routeResult.distanceSavedKm > 0 && sortMode === 'AUTO_PROXIMITY' && (
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                  -{routeResult.distanceSavedKm} km évités
                </span>
              )}
            </div>
          )}
        </div>

        {/* Grouped Commune Sequence Strip */}
        {routeResult.communeSequence.length > 0 && (
          <div
            className={`px-4 py-2.5 border-b text-xs flex flex-wrap items-center justify-between gap-2 ${
              ultraBatterySaver
                ? 'bg-black border-zinc-800 text-zinc-300'
                : 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20 text-amber-900 dark:text-amber-200'
            }`}
          >
            <div className="flex flex-wrap items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-500 dark:text-amber-400 shrink-0" />
              <span className="font-bold">Itinéraire groupé :</span>
              {routeResult.communeSequence.map((cluster, idx) => (
                <React.Fragment key={`${cluster.commune}-${idx}`}>
                  {idx > 0 && <span aria-hidden="true" className="opacity-60">➔</span>}
                  <span className="font-semibold">
                    {cluster.commune} ({cluster.count})
                  </span>
                </React.Fragment>
              ))}
            </div>
            <div className="font-mono font-bold text-emerald-700 dark:text-emerald-400 text-[11px] tabular-nums">
              ~{routeResult.totalSavedMinutes} min économisées
            </div>
          </div>
        )}

        {/* Stops list or Empty State */}
        <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
          {effectiveMissions.length === 0 ? (
            <div
              className={`p-8 rounded-2xl border text-center space-y-3 ${
                ultraBatterySaver
                  ? 'bg-zinc-950 border-zinc-800 text-zinc-300'
                  : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              <Compass className="w-10 h-10 mx-auto text-amber-500" />
              <h4 className={`text-sm font-bold ${ultraBatterySaver ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                Aucune mission active à optimiser
              </h4>
              <p className="text-xs max-w-md mx-auto">
                Dès qu’un logement est soumis par un bailleur ou qu’une mission terrain est créée, les arrêts sont automatiquement regroupés par proximité de communes (Gombe, Lingwala, Ngaliema).
              </p>
              <button
                type="button"
                onClick={() => setPreviewSampleRoute(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Simuler une tournée multi-communes (Gombe · Lingwala · Ngaliema)</span>
              </button>
            </div>
          ) : (
            routeResult.stops.map((stop, idx) => {
              const isCompleted = completedOverrides[stop.missionId] ?? stop.isCompleted;
              const isCurrent = (activeMissionId ? activeMissionId === stop.missionId : idx === 0) && !isCompleted;
              const prevStop = idx > 0 ? routeResult.stops[idx - 1] : null;
              const isNewCommuneCluster =
                !prevStop || normalizeCommuneKey(prevStop.commune) !== normalizeCommuneKey(stop.commune);

              return (
                <React.Fragment key={stop.missionId}>
                  {isNewCommuneCluster && (
                    <div className="flex items-center justify-between text-xs pt-1">
                      <span
                        className={`font-bold flex items-center gap-1.5 ${
                          ultraBatterySaver ? 'text-white' : 'text-slate-900 dark:text-slate-200'
                        }`}
                      >
                        <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                        <span>
                          Zone {stop.communeGroupIndex + 1} · Commune de {stop.commune} ({stop.communeGroupSize} arrêt{stop.communeGroupSize > 1 ? 's' : ''})
                        </span>
                      </span>
                      <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 tabular-nums">
                        {stop.distanceFromPrevKm} km depuis l’étape préc.
                      </span>
                    </div>
                  )}

                  <div
                    className={`p-4 rounded-2xl border transition-all ${
                      ultraBatterySaver
                        ? isCompleted
                          ? 'bg-zinc-950 border-zinc-800 opacity-60'
                          : isCurrent
                          ? 'bg-black border-white'
                          : 'bg-zinc-950 border-zinc-800'
                        : isCompleted
                        ? 'bg-slate-50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 opacity-60'
                        : isCurrent
                        ? 'bg-amber-50/40 dark:bg-slate-900 border-amber-400 dark:border-amber-500/60 shadow-sm'
                        : 'bg-white dark:bg-slate-950/60 border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <button
                          type="button"
                          onClick={() => toggleStopCompletion(stop.missionId, isCompleted)}
                          aria-label={isCompleted ? 'Marquer comme à faire' : 'Marquer comme terminé'}
                          className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                            isCompleted
                              ? 'bg-emerald-500 text-slate-950 border-emerald-500'
                              : ultraBatterySaver
                              ? 'bg-zinc-900 text-zinc-300 border-zinc-700'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500'
                          }`}
                        >
                          {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : <span className="font-bold text-xs">{idx + 1}</span>}
                        </button>

                        <div>
                          <div className="flex flex-wrap items-center gap-2 text-[11px]">
                            <span
                              className={`font-mono font-bold uppercase ${
                                stop.timeSlot === 'MORNING'
                                  ? 'text-amber-600 dark:text-amber-300'
                                  : stop.timeSlot === 'MIDDAY'
                                  ? 'text-sky-600 dark:text-sky-300'
                                  : 'text-indigo-600 dark:text-indigo-300'
                              }`}
                            >
                              {stop.timeSlot === 'MORNING'
                                ? 'Matin (08h00)'
                                : stop.timeSlot === 'MIDDAY'
                                ? 'Midi (12h30)'
                                : 'Après-Midi (15h30)'}
                            </span>
                            <span aria-hidden="true" className="opacity-40">·</span>
                            <span className="font-bold">
                              {stop.commune} · {stop.quartier}
                            </span>
                          </div>

                          <h4 className={`text-sm font-semibold mt-1 ${ultraBatterySaver ? 'text-white' : 'text-slate-900 dark:text-slate-100'}`}>
                            {stop.unitTitle}
                          </h4>

                          <div className={`text-xs mt-1 flex items-center gap-1.5 ${ultraBatterySaver ? 'text-zinc-400' : 'text-slate-600 dark:text-slate-400'}`}>
                            <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                            <span>
                              Repère : <strong className={ultraBatterySaver ? 'text-zinc-200' : 'text-slate-800 dark:text-slate-200'}>{stop.landmark}</strong>
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right tabular-nums">
                        <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold block">
                          +{stop.estimatedTrafficDelayMinutes} min sauvées
                        </span>
                        <span className={`text-[10px] font-mono ${ultraBatterySaver ? 'text-zinc-400' : 'text-slate-500'}`}>
                          ~{stop.distanceFromPrevKm} km
                        </span>
                      </div>
                    </div>

                    {/* Corridor recommendation */}
                    <div
                      className={`mt-3 p-3 rounded-xl border text-xs space-y-1 ${
                        ultraBatterySaver
                          ? 'bg-black border-zinc-700 text-zinc-300'
                          : 'bg-slate-50 dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-bold text-amber-600 dark:text-amber-400 text-[11px]">
                        <Compass className="w-3.5 h-3.5" />
                        <span>Itinéraire Moto Recommandé (Anti-bouchon) :</span>
                      </div>
                      <p className="text-[11px] leading-relaxed">{stop.recommendedCorridor}</p>
                    </div>

                    {/* Contact and action */}
                    <div
                      className={`mt-3 pt-2.5 border-t flex flex-wrap items-center justify-between gap-2 text-xs ${
                        ultraBatterySaver ? 'border-zinc-800' : 'border-slate-200 dark:border-slate-800/80'
                      }`}
                    >
                      <div className={`flex items-center gap-1.5 ${ultraBatterySaver ? 'text-zinc-300' : 'text-slate-600 dark:text-slate-400'}`}>
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>
                          Contact : <strong className={ultraBatterySaver ? 'text-white' : 'text-slate-900 dark:text-white'}>{stop.contactPerson}</strong> ({stop.contactPhone})
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {missions.some((m) => m.id === stop.missionId) && onSelectMission && (
                          <button
                            type="button"
                            onClick={() => {
                              setActiveMissionId(stop.missionId);
                              onSelectMission(stop.missionId);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1 shadow-sm transition-all"
                          >
                            <span>Ouvrir l'inspection</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </React.Fragment>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div
          className={`p-4 border-t flex flex-wrap items-center justify-between gap-3 ${
            ultraBatterySaver
              ? 'border-zinc-800 bg-black'
              : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60'
          }`}
        >
          <div className={`flex items-center gap-2 text-xs ${ultraBatterySaver ? 'text-zinc-300' : 'text-slate-600 dark:text-slate-400'}`}>
            <Fuel className="w-4 h-4 text-amber-500 dark:text-amber-400" />
            <span>
              Carburant estimé : <strong className={ultraBatterySaver ? 'text-white' : 'text-slate-900 dark:text-white'}>~{estimatedFuelLiters} L</strong>
            </span>
            {previewSampleRoute && missions.length === 0 && (
              <button
                type="button"
                onClick={() => setPreviewSampleRoute(false)}
                className="ml-2 inline-flex items-center gap-1 text-[11px] underline text-slate-500 hover:text-slate-900 dark:hover:text-white"
              >
                <RotateCw className="w-3 h-3" />
                <span>Réinitialiser</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className={`px-5 py-2 rounded-xl font-bold text-xs transition-colors ${
                ultraBatterySaver
                  ? 'bg-zinc-800 hover:bg-zinc-700 text-white'
                  : 'bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-900 dark:text-white'
              }`}
            >
              Fermer la tournée
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
