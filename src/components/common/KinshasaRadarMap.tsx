/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  MapPin, 
  ShieldCheck, 
  ShieldAlert, 
  Users, 
  Battery, 
  Navigation, 
  Radio, 
  Layers, 
  CheckCircle2, 
  Phone,
  Compass,
  Sparkles,
  Eye
} from 'lucide-react';
import { PropertyListing, FieldMission, SecurityAlert } from '../../types';

interface AgentLocation {
  id: string;
  name: string;
  phone: string;
  commune: string;
  status: 'EN_ROUTE' | 'SUR_PLACE' | 'DISPONIBLE';
  battery: number;
  accuracyMeters: number;
  xPercent: number; // Position on SVG map (0-100)
  yPercent: number;
  currentMissionTitle?: string;
  lastPing: string;
}

interface KinshasaRadarMapProps {
  listings: PropertyListing[];
  missions: FieldMission[];
  securityAlerts?: SecurityAlert[];
  onSelectListing?: (listing: PropertyListing) => void;
  heightClass?: string;
}

export const KinshasaRadarMap: React.FC<KinshasaRadarMapProps> = ({
  listings,
  missions,
  securityAlerts = [],
  onSelectListing,
  heightClass = 'h-96 sm:h-[480px]',
}) => {
  const [selectedCommune, setSelectedCommune] = useState<'ALL' | 'Gombe' | 'Ngaliema' | 'Lingwala'>('ALL');
  const [showAgents, setShowAgents] = useState(true);
  const [showListings, setShowListings] = useState(true);
  const [showAlerts, setShowAlerts] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState<AgentLocation | null>(null);
  const [selectedListingPin, setSelectedListingPin] = useState<PropertyListing | null>(null);

  // Active agents stationed across pilot communes
  const agents: AgentLocation[] = [
    {
      id: 'NZUBU-AG-01',
      name: 'Clarisse Ilunga',
      phone: '+243 82 444 0101',
      commune: 'Gombe',
      status: 'SUR_PLACE',
      battery: 84,
      accuracyMeters: 3,
      xPercent: 62,
      yPercent: 38,
      currentMissionTitle: 'Appartement Haut Standing — Gombe Ambassades',
      lastPing: 'Il y a 12s',
    },
    {
      id: 'NZUBU-AG-02',
      name: 'Alain Kambale',
      phone: '+243 81 555 0202',
      commune: 'Ngaliema',
      status: 'EN_ROUTE',
      battery: 71,
      accuracyMeters: 4,
      xPercent: 28,
      yPercent: 54,
      currentMissionTitle: 'Villa Baobab — Ma Campagne',
      lastPing: 'Il y a 5s',
    },
    {
      id: 'NZUBU-AG-04',
      name: 'Patrick Mbiya',
      phone: '+243 89 222 0404',
      commune: 'Lingwala',
      status: 'DISPONIBLE',
      battery: 92,
      accuracyMeters: 3,
      xPercent: 48,
      yPercent: 42,
      currentMissionTitle: 'Permanence relais Boulevard Triomphal',
      lastPing: 'Il y a 20s',
    },
  ];

  // Coordinates mapping on stylized Kinshasa canvas
  const getListingCoord = (id: string, commune: string) => {
    switch (id) {
      case 'nz-001':
        return { x: 68, y: 32 }; // Gombe Fleuve
      case 'nz-002':
        return { x: 24, y: 58 }; // Ngaliema Ma Campagne
      case 'nz-003':
        return { x: 46, y: 46 }; // Lingwala
      default:
        return commune === 'Ngaliema' ? { x: 30, y: 64 } : commune === 'Lingwala' ? { x: 50, y: 48 } : { x: 60, y: 36 };
    }
  };

  const filteredAgents = selectedCommune === 'ALL' 
    ? agents 
    : agents.filter((a) => a.commune === selectedCommune);

  const filteredListings = listings.filter((l) => {
    if (selectedCommune !== 'ALL' && l.commune !== selectedCommune) return false;
    return true;
  });

  return (
    <div className="relative w-full rounded-2xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col select-none">
      {/* Top Filter and Controls Bar */}
      <div className="p-3 bg-white/95 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2.5 z-20">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {(['ALL', 'Gombe', 'Ngaliema', 'Lingwala'] as const).map((commune) => (
            <button
              key={commune}
              onClick={() => {
                setSelectedCommune(commune);
                setSelectedAgent(null);
                setSelectedListingPin(null);
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
                selectedCommune === commune
                  ? 'bg-indigo-600 dark:bg-indigo-500 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {commune === 'ALL' ? 'Tout Kinshasa' : commune}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 text-[11px] font-semibold">
          <button
            onClick={() => setShowAgents(!showAgents)}
            className={`px-2 py-0.5 rounded flex items-center gap-1 border transition-colors ${
              showAgents ? 'bg-sky-500/15 dark:bg-sky-500/20 text-sky-700 dark:text-sky-300 border-sky-500/40' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-300 dark:border-slate-700'
            }`}
          >
            <Radio className="w-3 h-3 text-sky-600 dark:text-sky-400 animate-pulse" />
            <span>Agents ({agents.length})</span>
          </button>

          <button
            onClick={() => setShowListings(!showListings)}
            className={`px-2 py-0.5 rounded flex items-center gap-1 border transition-colors ${
              showListings ? 'bg-emerald-500/15 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/40' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-300 dark:border-slate-700'
            }`}
          >
            <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
            <span>Biens ({filteredListings.length})</span>
          </button>
        </div>
      </div>

      {/* Map Canvas with Stylized Kinshasa Geography */}
      <div className={`relative w-full ${heightClass} bg-slate-900 dark:bg-slate-950 overflow-hidden`}>
        {/* River Congo representation */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40" preserveAspectRatio="none">
          <defs>
            <linearGradient id="riverGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0284c7" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#0369a1" stopOpacity="0.2" />
            </linearGradient>
          </defs>
          {/* Stylized curve of the Congo River bordering Gombe and Ngaliema */}
          <path
            d="M 0,40 Q 200,20 400,30 T 800,10 L 800,0 L 0,0 Z"
            fill="url(#riverGradient)"
          />
          <path
            d="M 0,45 Q 250,25 500,35 T 1000,15"
            fill="none"
            stroke="#38bdf8"
            strokeWidth="1.5"
            strokeDasharray="4,4"
          />
        </svg>

        {/* Commune Boundaries Watermarks */}
        <div className="absolute top-12 right-12 text-slate-700 font-black text-sm uppercase tracking-widest pointer-events-none">
          Fleuve Congo
        </div>
        <div className="absolute top-20 right-28 text-slate-600 font-bold text-xs tracking-wider pointer-events-none">
          GOMBE (Golf · Batetela)
        </div>
        <div className="absolute top-36 left-12 text-slate-600 font-bold text-xs tracking-wider pointer-events-none">
          NGALIEMA (Ma Campagne · Macampagne)
        </div>
        <div className="absolute top-44 left-1/2 -translate-x-1/2 text-slate-600 font-bold text-xs tracking-wider pointer-events-none">
          LINGWALA (Triomphal)
        </div>

        {/* Pulse Radar Scanner Ring Animation */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full border border-sky-500/10 pointer-events-none animate-ping" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full border border-emerald-500/15 pointer-events-none" />

        {/* Property Pins */}
        {showListings && filteredListings.map((listing) => {
          const coord = getListingCoord(listing.id, listing.commune);
          const isSelected = selectedListingPin?.id === listing.id;

          return (
            <div
              key={listing.id}
              onClick={() => {
                setSelectedListingPin(listing);
                setSelectedAgent(null);
                if (onSelectListing) onSelectListing(listing);
              }}
              style={{ left: `${coord.x}%`, top: `${coord.y}%` }}
              className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-10 group"
            >
              <div className={`p-1.5 rounded-full shadow-lg transition-transform group-hover:scale-125 ${
                isSelected 
                  ? 'bg-rose-500 text-white ring-4 ring-rose-500/30' 
                  : 'bg-emerald-500 text-slate-950 ring-2 ring-emerald-500/20'
              }`}>
                <ShieldCheck className="w-4 h-4" />
              </div>
              <span className="absolute top-full left-1/2 -translate-x-1/2 mt-1 px-1.5 py-0.5 rounded bg-slate-900/90 border border-slate-700 text-[9px] font-bold text-white whitespace-nowrap shadow-md pointer-events-none group-hover:block hidden">
                {listing.title.slice(0, 22)}...
              </span>
            </div>
          );
        })}

        {/* Live Agent Markers */}
        {showAgents && filteredAgents.map((agent) => {
          const isSelected = selectedAgent?.id === agent.id;

          return (
            <div
              key={agent.id}
              onClick={() => {
                setSelectedAgent(agent);
                setSelectedListingPin(null);
              }}
              style={{ left: `${agent.xPercent}%`, top: `${agent.yPercent}%` }}
              className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-20 group"
            >
              {/* Radar pulse ring */}
              <div className="absolute -inset-2 rounded-full bg-sky-500/30 animate-ping pointer-events-none" />
              
              <div className={`p-1.5 rounded-full shadow-xl transition-transform group-hover:scale-125 flex items-center justify-center ${
                isSelected 
                  ? 'bg-sky-400 text-slate-950 ring-4 ring-sky-400/40' 
                  : 'bg-sky-500 text-white ring-2 ring-sky-500/30'
              }`}>
                <Navigation className="w-4 h-4 fill-current transform -rotate-45" />
              </div>

              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 px-2 py-0.5 rounded bg-slate-900/95 border border-sky-500/40 text-[10px] font-bold text-sky-300 whitespace-nowrap shadow-md flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                <span>{agent.name.split(' ')[0]}</span>
              </div>
            </div>
          );
        })}

        {/* Selected Agent Detail Popover */}
        {selectedAgent && (
          <div className="absolute bottom-3 left-3 right-3 sm:right-auto sm:w-80 p-3.5 rounded-2xl bg-slate-900/95 backdrop-blur-md border border-sky-500/40 shadow-2xl z-30 space-y-2.5 animate-slide-up">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-[10px] uppercase font-bold text-sky-400 flex items-center gap-1">
                  <Radio className="w-3 h-3 text-sky-400 animate-pulse" />
                  Agent d'inspection en direct
                </span>
                <h4 className="text-sm font-bold text-white mt-0.5">
                  {selectedAgent.name} ({selectedAgent.id})
                </h4>
                <p className="text-[11px] text-slate-300">
                  Secteur : {selectedAgent.commune} · Kinshasa
                </p>
              </div>

              <button
                onClick={() => setSelectedAgent(null)}
                className="w-5 h-5 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center text-xs"
              >
                ✕
              </button>
            </div>

            <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span>Statut opérationnel :</span>
                <span className="font-bold text-emerald-400">
                  {selectedAgent.status === 'SUR_PLACE' ? 'Sur les lieux d\'inspection' : selectedAgent.status === 'EN_ROUTE' ? 'En déplacement vers repère' : 'Disponible'}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Batterie terminal :</span>
                <span className="font-mono text-white flex items-center gap-1">
                  <Battery className="w-3 h-3 text-emerald-400" />
                  {selectedAgent.battery}%
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Précision GPS satellite :</span>
                <span className="font-mono text-emerald-300">±{selectedAgent.accuracyMeters} m ({selectedAgent.lastPing})</span>
              </div>
            </div>

            {selectedAgent.currentMissionTitle && (
              <p className="text-[11px] text-slate-300 truncate">
                Mission : <strong className="text-white">{selectedAgent.currentMissionTitle}</strong>
              </p>
            )}

            <div className="pt-1 flex items-center gap-2">
              <a
                href={`tel:${selectedAgent.phone}`}
                className="flex-1 py-1.5 px-3 rounded-lg bg-sky-500 hover:bg-sky-600 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-sky-500/20"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Appeler l'agent</span>
              </a>
            </div>
          </div>
        )}

        {/* Selected Property Pin Popover */}
        {selectedListingPin && (
          <div className="absolute bottom-3 left-3 right-3 sm:right-auto sm:w-80 p-3.5 rounded-2xl bg-slate-900/95 backdrop-blur-md border border-emerald-500/40 shadow-2xl z-30 space-y-2.5 animate-slide-up">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-[10px] uppercase font-bold text-emerald-400 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  Logement Vérifié 90 Jours
                </span>
                <h4 className="text-sm font-bold text-white line-clamp-1 mt-0.5">
                  {selectedListingPin.title}
                </h4>
                <p className="text-[11px] text-slate-300">
                  {selectedListingPin.commune} · {selectedListingPin.quartier}
                </p>
              </div>

              <button
                onClick={() => setSelectedListingPin(null)}
                className="w-5 h-5 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center text-xs"
              >
                ✕
              </button>
            </div>

            <div className="text-xs text-slate-300 space-y-1">
              <div className="flex items-center justify-between">
                <span>Loyer officiel :</span>
                <span className="font-bold text-white font-mono">
                  {new Intl.NumberFormat('fr-CD').format(selectedListingPin.pricing.amountCdf)} CDF / {selectedListingPin.pricing.priceUnit === 'PER_NIGHT' ? 'nuit' : 'mois'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Eau & Énergie :</span>
                <span className="text-emerald-400 font-semibold">
                  {selectedListingPin.utilities.water.testedWorking ? 'Eau testée' : 'Cuve'} · {selectedListingPin.utilities.electricity.type}
                </span>
              </div>
            </div>

            <button
              onClick={() => onSelectListing?.(selectedListingPin)}
              className="w-full py-1.5 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Ouvrir la fiche complète</span>
            </button>
          </div>
        )}
      </div>

      {/* Bottom Bar Info */}
      <div className="p-2.5 bg-white/95 dark:bg-slate-900/90 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400 px-4">
        <span className="flex items-center gap-1.5">
          <Compass className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
          <span>Surveillance satellitaire certifiée GPS des 3 communes pilotes</span>
        </span>
        <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
          {filteredListings.length} biens certifiés · {filteredAgents.length} agents actifs
        </span>
      </div>
    </div>
  );
};
