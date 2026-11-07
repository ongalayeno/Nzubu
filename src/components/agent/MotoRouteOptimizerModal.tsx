import React, { useState } from 'react';
import { 
  X, 
  Navigation, 
  Clock, 
  MapPin, 
  BatteryCharging, 
  Zap, 
  AlertTriangle, 
  CheckCircle2, 
  Compass, 
  Fuel, 
  Phone,
  ArrowRight,
  ShieldAlert,
  Sparkles
} from 'lucide-react';
import { FieldMission, InspectionRouteStop } from '../../types';

interface MotoRouteOptimizerModalProps {
  missions: FieldMission[];
  onClose: () => void;
  onSelectMission?: (missionId: string) => void;
}

const DEFAULT_STOPS: InspectionRouteStop[] = [
  {
    missionId: 'm1',
    unitTitle: 'Appartement Haut Standing Gombe Fleuve',
    commune: 'Gombe',
    quartier: 'Haut Commandement',
    landmark: 'Proche Ambassade de France & Clinique Ngaliema',
    contactPerson: 'Papa Jacques (Intendant)',
    contactPhone: '+243 81 555 0101',
    timeSlot: 'MORNING',
    estimatedTrafficDelayMinutes: 55,
    recommendedCorridor: 'Axe Boulevard du 30 Juin avant 08h30 (Éviter carrefour Batetela)',
    isCompleted: false
  },
  {
    missionId: 'm2',
    unitTitle: 'Studio Équipé Lingwala - Palais du Peuple',
    commune: 'Lingwala',
    quartier: 'Kabinda',
    landmark: 'Derrière RTNC & Hôpital Chinois',
    contactPerson: 'Maman Sarah (Propriétaire)',
    contactPhone: '+243 99 444 0202',
    timeSlot: 'MIDDAY',
    estimatedTrafficDelayMinutes: 40,
    recommendedCorridor: 'Emprunter Avenue Mushie / Kalembelembe (Éviter Avenue des Huileries saturée)',
    isCompleted: false
  },
  {
    missionId: 'm3',
    unitTitle: 'Villa avec Forage & Groupe - Ngaliema Macampagne',
    commune: 'Ngaliema',
    quartier: 'Macampagne',
    landmark: 'Arrêt Météo / Croisement Avenue de la Paix',
    contactPerson: 'Me Jean-Luc (Mandataire)',
    contactPhone: '+243 82 333 0303',
    timeSlot: 'AFTERNOON',
    estimatedTrafficDelayMinutes: 50,
    recommendedCorridor: 'Monter par Avenue Mondjiba & Ngaliema (Éviter goulot Kintambo Magasin)',
    isCompleted: false
  }
];

export const MotoRouteOptimizerModal: React.FC<MotoRouteOptimizerModalProps> = ({
  missions,
  onClose,
  onSelectMission
}) => {
  const [stops, setStops] = useState<InspectionRouteStop[]>(DEFAULT_STOPS);
  const [ultraBatterySaver, setUltraBatterySaver] = useState<boolean>(false);
  const [activeStopIndex, setActiveStopIndex] = useState<number>(0);

  const toggleStopCompletion = (index: number) => {
    setStops(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], isCompleted: !copy[index].isCompleted };
      return copy;
    });
  };

  const totalSavedMinutes = stops.reduce((acc, curr) => acc + curr.estimatedTrafficDelayMinutes, 0);

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 backdrop-blur-sm animate-fade-in overflow-y-auto ${
      ultraBatterySaver ? 'bg-black text-white' : 'bg-slate-950/85 text-white'
    }`}>
      <div className={`border rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl my-auto transition-colors ${
        ultraBatterySaver 
          ? 'bg-black border-slate-700' 
          : 'bg-slate-900 border-slate-800'
      }`}>
        {/* Header */}
        <div className={`p-5 border-b flex items-center justify-between ${
          ultraBatterySaver ? 'border-slate-800 bg-black' : 'border-slate-800 bg-slate-950/50'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border ${
              ultraBatterySaver 
                ? 'bg-white text-black border-white' 
                : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
            }`}>
              <Navigation className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-base">
                  Optimiseur Tournée Moto Kinshasa
                </h3>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                  ultraBatterySaver 
                    ? 'bg-zinc-800 text-zinc-200 border-zinc-700' 
                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                }`}>
                  Anti-Embouteillages
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Ordre de passage optimisé : Gombe (Matin) ➔ Lingwala (Midi) ➔ Ngaliema (Après-midi).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Battery Mode Toggle */}
            <button
              type="button"
              onClick={() => setUltraBatterySaver(!ultraBatterySaver)}
              className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border ${
                ultraBatterySaver
                  ? 'bg-white text-black border-white'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
              }`}
              title="Mode Économie Batterie Extrême pour délestage"
            >
              <BatteryCharging className="w-4 h-4" />
              <span className="hidden sm:inline">
                {ultraBatterySaver ? 'OLED Éco Actif' : 'Mode Éco Batterie'}
              </span>
            </button>

            <button 
              onClick={onClose}
              className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Traffic corridor banner */}
        <div className={`p-3.5 border-b text-xs flex flex-wrap items-center justify-between gap-2 ${
          ultraBatterySaver 
            ? 'bg-zinc-950 border-zinc-800 text-zinc-300' 
            : 'bg-amber-500/10 border-amber-500/20 text-amber-200'
        }`}>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>Goulots d'étranglement signalés :</strong> Kintambo Magasin saturé · Ralentissement Huileries / Triomphal.
            </span>
          </div>
          <div className="font-mono font-bold text-emerald-400 text-[11px]">
            ⚡ ~{totalSavedMinutes} min économisées
          </div>
        </div>

        {/* Stops list */}
        <div className="p-5 space-y-4 max-h-[65vh] overflow-y-auto">
          {stops.map((stop, idx) => {
            const isCompleted = stop.isCompleted;
            const isCurrent = activeStopIndex === idx && !isCompleted;

            return (
              <div
                key={stop.missionId}
                className={`p-4 rounded-2xl border transition-all ${
                  ultraBatterySaver
                    ? isCompleted
                      ? 'bg-zinc-950 border-zinc-800 opacity-60'
                      : isCurrent
                      ? 'bg-black border-white'
                      : 'bg-zinc-950 border-zinc-800'
                    : isCompleted
                    ? 'bg-slate-950/40 border-slate-800 opacity-60'
                    : isCurrent
                    ? 'bg-slate-900 border-amber-500/60 shadow-lg shadow-amber-500/5'
                    : 'bg-slate-950/60 border-slate-800'
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <button
                      type="button"
                      onClick={() => toggleStopCompletion(idx)}
                      className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                        isCompleted
                          ? 'bg-emerald-500 text-slate-950 border-emerald-500'
                          : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-500'
                      }`}
                    >
                      {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : <span className="font-bold text-xs">{idx + 1}</span>}
                    </button>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono uppercase ${
                          stop.timeSlot === 'MORNING'
                            ? 'bg-amber-500/20 text-amber-300'
                            : stop.timeSlot === 'MIDDAY'
                            ? 'bg-sky-500/20 text-sky-300'
                            : 'bg-purple-500/20 text-purple-300'
                        }`}>
                          {stop.timeSlot === 'MORNING' ? 'Étape 1 · Matin (08h00)' : stop.timeSlot === 'MIDDAY' ? 'Étape 2 · Midi (12h30)' : 'Étape 3 · Après-Midi (15h30)'}
                        </span>
                        <span className="text-xs font-bold text-white">
                          {stop.commune} · {stop.quartier}
                        </span>
                      </div>

                      <h4 className="text-sm font-semibold text-slate-100 mt-1">
                        {stop.unitTitle}
                      </h4>

                      <div className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                        <span>Repère : <strong className="text-slate-200">{stop.landmark}</strong></span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-emerald-400 font-bold block">
                      +{stop.estimatedTrafficDelayMinutes} min sauvées
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      Passage optimisé
                    </span>
                  </div>
                </div>

                {/* Corridor recommendation */}
                <div className={`mt-3 p-3 rounded-xl border text-xs space-y-1 ${
                  ultraBatterySaver
                    ? 'bg-black border-zinc-700 text-zinc-300'
                    : 'bg-slate-900/80 border-slate-800 text-slate-300'
                }`}>
                  <div className="flex items-center gap-1.5 font-bold text-amber-400 text-[11px]">
                    <Compass className="w-3.5 h-3.5" />
                    <span>Itinéraire Moto Recommandé (Anti-bouchon) :</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    {stop.recommendedCorridor}
                  </p>
                </div>

                {/* Contact and action */}
                <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Phone className="w-3.5 h-3.5 text-slate-500" />
                    <span>Contact sur place : <strong className="text-white">{stop.contactPerson}</strong> ({stop.contactPhone})</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveStopIndex(idx);
                        if (onSelectMission) {
                          onSelectMission(stop.missionId);
                        }
                      }}
                      className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1 shadow-sm transition-all"
                    >
                      <span>Ouvrir l'inspection</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className={`p-4 border-t flex flex-wrap items-center justify-between gap-3 ${
          ultraBatterySaver ? 'border-zinc-800 bg-black' : 'border-slate-800 bg-slate-950/60'
        }`}>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Fuel className="w-4 h-4 text-amber-400" />
            <span>Consommation carburant moto estimée : <strong>~2.8L / journée</strong></span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors"
            >
              Fermer la tournée
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
