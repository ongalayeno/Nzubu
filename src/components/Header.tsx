/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Smartphone, Monitor, ShieldCheck, Video, Building2, ClipboardCheck, Settings2 } from 'lucide-react';
import { UserRole } from '../types';

interface HeaderProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  isMobileDeviceView: boolean;
  onToggleDeviceView: () => void;
  onOpenCompliance: () => void;
  unresolvedSafetyAlertsCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentRole,
  onRoleChange,
  isMobileDeviceView,
  onToggleDeviceView,
  onOpenCompliance,
  unresolvedSafetyAlertsCount = 0,
}) => {
  return (
    <header className="sticky top-0 z-50 bg-slate-950/95 backdrop-blur-md border-b border-slate-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand Zone: 1-line text wordmark with Kinshasa tag */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center font-black text-white text-base shadow-sm">
              N
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-extrabold tracking-tight text-white leading-tight">
                NZUBU
              </span>
              <span className="text-[10px] text-slate-400 font-medium tracking-wide">
                Kinshasa · Immobilier Vidéo
              </span>
            </div>
          </div>
        </div>

        {/* Center Zone: Role selector tabs */}
        <nav className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl overflow-x-auto no-scrollbar">
          <button
            onClick={() => onRoleChange('CLIENT')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              currentRole === 'CLIENT'
                ? 'bg-rose-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            <span>Feed Client</span>
          </button>

          <button
            onClick={() => onRoleChange('PARTNER')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              currentRole === 'PARTNER'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Espace Bailleur / Hôte</span>
          </button>

          <button
            onClick={() => onRoleChange('FIELD_AGENT')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              currentRole === 'FIELD_AGENT'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ClipboardCheck className="w-3.5 h-3.5" />
            <span>Agent Terrain PWA</span>
          </button>

          <button
            onClick={() => onRoleChange('OPERATIONS_ADMIN')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors relative ${
              currentRole === 'OPERATIONS_ADMIN'
                ? 'bg-indigo-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Settings2 className="w-3.5 h-3.5" />
            <span>Opérations & Admin</span>
            {unresolvedSafetyAlertsCount > 0 && (
              <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-black animate-pulse shadow-sm shadow-rose-500/50">
                <span>🚨</span>
                <span>{unresolvedSafetyAlertsCount}</span>
              </span>
            )}
          </button>
        </nav>

        {/* Right Zone: Controls for Device Simulation and Legal Compliance */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onOpenCompliance}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors whitespace-nowrap"
            title="Cadre légal RDC (Loi 15/025, Code du Numérique, BCC CDF)"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Conformité RDC</span>
          </button>

          <button
            onClick={onToggleDeviceView}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap ${
              isMobileDeviceView
                ? 'bg-slate-800 text-amber-400 border-amber-500/40'
                : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800 hover:text-white'
            }`}
            title="Basculer entre vue mobile smartphone et vue plein écran"
          >
            {isMobileDeviceView ? (
              <>
                <Monitor className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Vue Plein Écran</span>
              </>
            ) : (
              <>
                <Smartphone className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Cadre Mobile</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
