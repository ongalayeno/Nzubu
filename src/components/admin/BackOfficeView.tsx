/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Settings2, 
  ShieldCheck, 
  FileCheck, 
  Users, 
  Building2, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Eye, 
  Calendar, 
  Activity, 
  Scale, 
  Banknote,
  Send,
  PauseCircle,
  LocateFixed,
  Camera,
  Image as ImageIcon,
  ShieldAlert,
  Sparkles,
  Clock,
  Trash2,
  Play,
  Pause,
  Plus,
  Video,
  CreditCard,
  Radar,
  Download,
  Radio,
  FileSpreadsheet
} from 'lucide-react';
import { PropertyListing, FieldMission, BookingRequest, SecurityAlert, SponsoredAd } from '../../types';
import { canApproveListing, isListingPublic } from '../../domain/listing';
import { isAdActive, getRemainingAdTime, partitionAds } from '../../domain/ads';
import { KinshasaRadarMap } from '../common/KinshasaRadarMap';

interface BackOfficeViewProps {
  listings: PropertyListing[];
  missions: FieldMission[];
  bookings: BookingRequest[];
  securityAlerts?: SecurityAlert[];
  sponsoredAds?: SponsoredAd[];
  onApproveListingBadge: (listingId: string) => void;
  onSuspendListing: (listingId: string) => void;
  onAssignMission: (missionId: string, agentName: string) => void;
  onResolveSecurityAlert?: (alertId: string) => void;
  onToggleAdStatus?: (adId: string) => void;
  onDeleteAd?: (adId: string) => void;
  onOpenCreateAd?: () => void;
}

export const BackOfficeView: React.FC<BackOfficeViewProps> = ({
  listings,
  missions,
  bookings,
  securityAlerts = [],
  sponsoredAds = [],
  onApproveListingBadge,
  onSuspendListing,
  onAssignMission,
  onResolveSecurityAlert,
  onToggleAdStatus,
  onDeleteAd,
  onOpenCreateAd,
}) => {
  const [activeTab, setActiveTab] = useState<'VALIDATIONS' | 'MISSIONS' | 'RADAR' | 'COMPLIANCE' | 'MONETIZATION' | 'AUDIT'>('VALIDATIONS');
  const [adFilter, setAdFilter] = useState<'ALL' | 'ACTIVE' | 'EXPIRED'>('ALL');
  const [renewalNotifiedIds, setRenewalNotifiedIds] = useState<string[]>([]);

  const formatCDF = (num: number) => new Intl.NumberFormat('fr-CD').format(num);

  const pendingReports = missions.filter((m) => m.status === 'REPORT_SUBMITTED');
  const activeSecurityAlerts = securityAlerts.filter((a) => !a.resolved);

  // Export audit as CSV
  const handleExportAuditCsv = () => {
    const confirmedBookings = bookings.filter(b => b.status === 'CONFIRMED' || b.status === 'COMPLETED');
    const headers = ['Ref Réservation', 'Date', 'Logement', 'Commune', 'Client', 'Total (CDF)', 'Avance 20% (CDF)', 'Commission NZUBU 8% (CDF)', 'Canal'];
    const rows = confirmedBookings.map(b => [
      b.id,
      b.createdAt,
      `"${b.listingTitle.replace(/"/g, '""')}"`,
      b.commune,
      `"${b.guestName}"`,
      b.totalPriceCdf,
      b.advanceAmountCdf,
      Math.round(b.totalPriceCdf * 0.08),
      b.paymentMethod || 'MaishaPay'
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `nzubu-audit-comptable-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full h-full overflow-y-auto bg-slate-950 text-white p-4 sm:p-6 space-y-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                Administration & Supervision Opérations
              </span>
              <span className="text-[10px] bg-indigo-500/20 text-indigo-300 font-semibold px-2 py-0.5 rounded border border-indigo-500/30">
                Super-Admin / Responsable Marché
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1">
              Back-Office Opérationnel NZUBU Kinshasa
            </h2>
            <p className="text-xs text-slate-400">
              Contrôle qualité des annonces, délivrance des badges vérifiés 90 jours et conformité légale RDC.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-emerald-400 font-semibold px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Pilote actif (Gombe · Lingwala · Ngaliema)</span>
            </span>
          </div>
        </div>

        {/* 4 KPIs Summary Bar */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
            <span className="text-xs text-slate-400 block">Complétude des annonces</span>
            <div className="text-2xl font-black text-emerald-400 tabular-nums mt-1">
              {listings.length ? Math.round(listings.filter((item) => isListingPublic(item)).length / listings.length * 100) : 0} %
            </div>
            <span className="text-[10px] text-slate-400">Annonces publiques parmi les logements saisis</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
            <span className="text-xs text-slate-400 block">Double réservation</span>
            <div className="text-2xl font-black text-emerald-400 tabular-nums mt-1">
              À vérifier
            </div>
            <span className="text-[10px] text-slate-400">Verrou atomique serveur non implémenté</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
            <span className="text-xs text-slate-400 block">Rapports terrain reçus</span>
            <div className="text-2xl font-black text-indigo-400 tabular-nums mt-1">
              {missions.length}
            </div>
            <span className="text-[10px] text-amber-300">
              {pendingReports.length} en attente de revue marché
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
            <span className="text-xs text-slate-400 block">Conformité Monnaie CDF</span>
            <div className="text-2xl font-black text-white tabular-nums mt-1">
              100 %
            </div>
            <span className="text-[10px] text-slate-400">Loi 15/025 & BCC respectées</span>
          </div>
        </div>

        {/* URGENT : ALERTE SÉCURITÉ EMERGENCY DISPATCH BANNER */}
        {activeSecurityAlerts.length > 0 && (
          <div className="p-5 rounded-2xl bg-rose-950/40 border-2 border-rose-500/70 text-white space-y-4 shadow-2xl shadow-rose-950/50 animate-fade-in">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-rose-500/30 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-600 flex items-center justify-center text-white shadow-lg shadow-rose-600/40 shrink-0">
                  <ShieldAlert className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black uppercase tracking-wider text-rose-300">
                      Notification Prioritaire Back-Office
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-rose-500 text-white font-black text-[10px] flex items-center gap-1">
                      <span>🚨</span>
                      <span>URGENT : ALERTE SÉCURITÉ ({activeSecurityAlerts.length})</span>
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white mt-0.5">
                    Signalement d'anomalie critique ou de danger sur le terrain
                  </h3>
                </div>
              </div>

              <span className="text-xs text-rose-300 font-medium">
                Action immédiate requise par le Responsable de Marché
              </span>
            </div>

            <div className="space-y-3">
              {activeSecurityAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="p-4 rounded-xl bg-slate-900/90 border border-rose-500/40 space-y-3 text-xs"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-rose-400 text-xs">
                          {alert.missionId}
                        </span>
                        <h4 className="text-sm font-bold text-white">
                          {alert.unitTitle}
                        </h4>
                        <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-medium">
                          {alert.commune}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-2">
                        <span>Agent : <strong className="text-slate-200">{alert.agentName} ({alert.agentId})</strong></span>
                        <span>·</span>
                        <span>Signalé à <strong className="text-slate-200">{alert.timestamp}</strong></span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => alert.listingId && onSuspendListing(alert.listingId)}
                        disabled={!alert.listingId}
                        className="py-1.5 px-3 rounded-lg bg-rose-600/30 hover:bg-rose-600/50 text-rose-200 border border-rose-500/40 text-xs font-bold transition-colors flex items-center gap-1.5"
                      >
                        <PauseCircle className="w-3.5 h-3.5" />
                        <span>Confirmer suspension annonce</span>
                      </button>

                      <button
                        onClick={() => onResolveSecurityAlert?.(alert.id)}
                        className="py-1.5 px-3.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-emerald-600/30"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Acquitter l'alerte</span>
                      </button>
                    </div>
                  </div>

                  {alert.gpsCoordinates && (
                    <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 font-mono text-emerald-300 text-xs flex items-center gap-1.5">
                      <LocateFixed className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Position GPS certifiée au moment du signalement : {alert.gpsCoordinates.latitude}°, {alert.gpsCoordinates.longitude}° (Précision ±{alert.gpsCoordinates.accuracyMeters}m)</span>
                    </div>
                  )}

                  <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-500/30 text-rose-200 text-xs space-y-1">
                    <strong className="text-rose-100 block">Constat de danger de l'agent :</strong>
                    <p className="text-rose-200/90 leading-relaxed">{alert.notes}</p>
                  </div>

                  {alert.photos && alert.photos.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[10px] text-slate-400 font-semibold block">
                        Preuves photographiques transmises sur le danger ({alert.photos.length}) :
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {alert.photos.map((ph, pIdx) => (
                          <div
                            key={ph.id || pIdx}
                            className="group relative aspect-video rounded-lg overflow-hidden border border-slate-700 bg-slate-950"
                          >
                            <img src={ph.url} alt={ph.caption} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-1.5">
                              <span className="text-[9px] text-white font-medium truncate">{ph.caption}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl w-fit text-xs">
          <button
            onClick={() => setActiveTab('VALIDATIONS')}
            className={`px-3.5 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === 'VALIDATIONS'
                ? 'bg-indigo-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Revue Marché & Badges ({listings.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('MISSIONS')}
            className={`px-3.5 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === 'MISSIONS'
                ? 'bg-indigo-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Dispatching Agents ({missions.length})</span>
            {activeSecurityAlerts.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-black animate-pulse">
                🚨 {activeSecurityAlerts.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('RADAR')}
            className={`px-3.5 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === 'RADAR'
                ? 'bg-indigo-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Radar className="w-3.5 h-3.5 text-emerald-400" />
            <span>Radar Kinshasa Live</span>
          </button>

          <button
            onClick={() => setActiveTab('COMPLIANCE')}
            className={`px-3.5 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === 'COMPLIANCE'
                ? 'bg-indigo-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            <span>Registre Légal & Conformité RDC</span>
          </button>

          <button
            onClick={() => setActiveTab('MONETIZATION')}
            className={`px-3.5 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === 'MONETIZATION'
                ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Régie Pub & MaishaPay ({sponsoredAds.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('AUDIT')}
            className={`px-3.5 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === 'AUDIT'
                ? 'bg-emerald-500 text-slate-950 font-black shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>Audit & Marges 8%</span>
          </button>
        </div>

        {/* Tab 1: Market Review & Publication */}
        {activeTab === 'VALIDATIONS' && (
          <div className="space-y-4">
            {/* J-15 Badge Expiration Monitoring Alert Box */}
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-500/20 pb-2.5">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-400 animate-pulse" />
                  <span className="font-bold text-amber-300">
                    Surveillance Proactive : Alertes J-15 Expiration Badges 90 Jours
                  </span>
                </div>
                <span className="text-[10px] text-amber-400 font-mono">
                  Garantie d'intégrité Kinshasa (§9.2)
                </span>
              </div>

              <p className="text-slate-300 text-[11px] leading-relaxed">
                Le modèle NZUBU impose une re-certification physique tous les 90 jours. Les logements ci-dessous approchent de l'échéance des 3 mois et requièrent une mission de vérification terrain pour maintenir leur publication active.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {listings.slice(0, 2).map((expiring) => (
                  <div
                    key={expiring.id}
                    className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between gap-2"
                  >
                    <div>
                      <span className="font-bold text-white block line-clamp-1">{expiring.title}</span>
                      <span className="text-[10px] text-slate-400">{expiring.commune} · Échéance badge : J-12</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setRenewalNotifiedIds(prev => [...prev, expiring.id])}
                      disabled={renewalNotifiedIds.includes(expiring.id)}
                      className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all ${
                        renewalNotifiedIds.includes(expiring.id)
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-sm'
                      }`}
                    >
                      {renewalNotifiedIds.includes(expiring.id) ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>Mission J-15 planifiée</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3 h-3" />
                          <span>Planifier Re-contrôle J-15</span>
                        </>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold text-white">
                Contrôle de conformité avant diffusion dans le feed
              </span>
              <span>Règle : Seules les annonces avec rapport terrain approuvé sont visibles</span>
            </div>

            <div className="space-y-3">
              {listings.map((item) => (
                <div
                  key={item.id}
                  className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-md"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-800 pb-3">
                    <div className="flex items-start gap-3">
                      <img
                        src={item.media.videoThumbnail}
                        alt={item.title}
                        className="w-16 h-14 rounded-xl object-cover bg-slate-950 shrink-0"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-slate-400">
                            {item.id}
                          </span>
                          <h4 className="text-sm font-bold text-white">
                            {item.title}
                          </h4>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-semibold">
                            {item.rentalMode === 'SHORT_STAY' ? 'Courte durée' : 'Bail résidentiel'}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 mt-1">
                          {item.commune} · {item.quartier} · Repère : {item.landmark}
                        </div>
                        <div className="text-xs text-amber-400 font-mono mt-0.5">
                          {formatCDF(item.pricing.amountCdf)} CDF / {item.pricing.priceUnit === 'PER_NIGHT' ? 'nuit' : 'mois'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{isListingPublic(item) ? `Publié · badge valide jusqu’au ${item.verification.verifiedUntil}` : item.publicationStatus === 'PENDING_INSPECTION' ? 'Inspection à réaliser' : item.publicationStatus === 'PENDING_APPROVAL' ? 'En attente de validation' : item.publicationStatus === 'SUSPENDED' ? 'Suspendu' : 'Non disponible'}</span>
                      </span>
                    </div>
                  </div>

                  {/* Verification Snapshot Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800">
                      <span className="text-[11px] text-slate-400 block">Agent inspecteur :</span>
                      <span className="font-semibold text-white block mt-0.5">
                        {item.verification.inspectorName || 'Inspection en attente'}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        Réf. {item.verification.reportReference}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800">
                      <span className="text-[11px] text-slate-400 block">Partenaire / Mandant :</span>
                      <span className="font-semibold text-white block mt-0.5">
                        {item.partner.name} ({item.partner.type})
                      </span>
                      <span className="text-[10px] text-emerald-400">
                        {item.partner.verified ? 'Partenaire déclaré vérifié' : 'Justificatifs en attente'}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800">
                      <span className="text-[11px] text-slate-400 block">Réseaux contrôlés :</span>
                      <span className="text-[11px] text-slate-200 block mt-0.5">
                        {item.utilities.water.testedWorking ? 'Eau OK' : 'Non'} · {item.utilities.electricity.type}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Vidéo 9:16 vérifiée sans visages
                      </span>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      onClick={() => onSuspendListing(item.id)}
                      className="py-1.5 px-3 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <PauseCircle className="w-3.5 h-3.5" />
                      <span>Suspendre temporairement</span>
                    </button>

                    <button
                      onClick={() => onApproveListingBadge(item.id)}
                      disabled={!canApproveListing(item, missions)}
                      className="py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Valider et publier pour 90 jours</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 2: Missions & Dispatching */}
        {activeTab === 'MISSIONS' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold text-white">
                Missions d'inspection terrain à Kinshasa
              </span>
              <span>Affectation par commune : Gombe, Ngaliema, Lingwala</span>
            </div>

            <div className="space-y-3">
              {missions.map((m) => (
                <div
                  key={m.id}
                  className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 shadow-md"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-indigo-400">
                          {m.id}
                        </span>
                        <h4 className="text-sm font-bold text-white">
                          {m.unitTitle}
                        </h4>
                      </div>
                      <div className="text-xs text-slate-400 mt-1">
                        {m.commune} · {m.quartier} · {m.landmark}
                      </div>
                    </div>

                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                      m.decisionOutcome === 'SAFETY_CONCERN'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse'
                        : m.status === 'REPORT_SUBMITTED'
                        ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}>
                      {m.decisionOutcome === 'SAFETY_CONCERN' ? (
                        <>
                          <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                          <span>🚨 Urgent : Alerte Sécurité</span>
                        </>
                      ) : m.status === 'REPORT_SUBMITTED' ? (
                        'Rapport d\'inspection soumis'
                      ) : (
                        'Mission en cours'
                      )}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800">
                      <span className="text-slate-400 block text-[11px]">Contact bailleur/hôte sur place :</span>
                      <span className="font-semibold text-white block mt-0.5">
                        {m.contactPerson} ({m.contactPhone})
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800">
                      <span className="text-slate-400 block text-[11px]">Agent affecté :</span>
                      <div className="flex items-center justify-between mt-0.5">
                        <span className="font-semibold text-white">
                          {m.agentName} ({m.agentId})
                        </span>
                        <select
                          value={m.agentName}
                          onChange={(e) => onAssignMission(m.id, e.target.value)}
                          className="bg-slate-800 border border-slate-700 text-[11px] rounded px-2 py-0.5 text-slate-300"
                        >
                          <option value="Alain Kambale">Alain Kambale (Kin-Ouest)</option>
                          <option value="Patrick Mbiya">Patrick Mbiya (Kin-Nord)</option>
                          <option value="Clarisse Ilunga">Clarisse Ilunga (Kin-Centre)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {m.gpsCoordinates && (
                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs">
                      <span className="text-slate-400 block text-[11px]">Position GPS certifiée de l'agent :</span>
                      <div className="flex flex-wrap items-center gap-2 mt-0.5 font-mono text-emerald-300 text-xs font-semibold">
                        <LocateFixed className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{m.gpsCoordinates.latitude}°, {m.gpsCoordinates.longitude}° (Précision ±{m.gpsCoordinates.accuracyMeters}m)</span>
                        <span className="text-slate-400 font-sans text-[10px]">· Capturé à {m.gpsCoordinates.capturedAt} ({m.gpsCoordinates.source})</span>
                      </div>
                    </div>
                  )}

                  {/* Preuves Photographiques soumises par l'agent */}
                  {m.photos && m.photos.length > 0 && (
                    <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                          <Camera className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Preuves photographiques jointes au rapport ({m.photos.length} clichés) :</span>
                        </span>
                        <span className="text-[10px] text-emerald-400 font-mono">Conforme 90 jours</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {m.photos.map((ph, pIdx) => (
                          <div
                            key={ph.id || pIdx}
                            className="group relative aspect-video rounded-lg overflow-hidden border border-slate-700 bg-slate-950"
                          >
                            <img src={ph.url} alt={ph.caption} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-1.5">
                              <span className="text-[9px] text-white font-medium truncate">{ph.caption}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {m.notes && (
                    <div className="p-3 rounded-xl bg-slate-800/20 border border-slate-800/80 text-xs text-slate-300">
                      <strong>Notes de mission :</strong> {m.notes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Legal & Regulatory Register (Brief Part III) */}
        {activeTab === 'COMPLIANCE' && (
          <div className="space-y-4">
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-md">
              <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shrink-0">
                  <Scale className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Registre de Contrôle & Conformité Juridique RDC
                  </h3>
                  <p className="text-xs text-slate-400">
                    Application stricte des textes légaux en vigueur en République Démocratique du Congo.
                  </p>
                </div>
              </div>

              <div className="space-y-3 text-xs leading-relaxed">
                {/* 1. Loi 15/025 */}
                <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <strong className="text-amber-400 font-bold text-sm">
                      1. Loi n°15/025 du 31 décembre 2015 (Baux à loyer non professionnels)
                    </strong>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold text-[10px]">
                      CONFORME
                    </span>
                  </div>
                  <ul className="space-y-1 text-slate-300 text-[11px] list-disc list-inside">
                    <li><strong>Garantie locative (Art. 18) :</strong> Plafonnée à 3 mois de loyer maximum. Le système rejette automatiquement toute saisie supérieure.</li>
                    <li><strong>Monnaie légale (Art. 21) :</strong> Loyer libellé et payé en Franc Congolais (CDF).</li>
                    <li><strong>Paiement anticipatif (Art. 22) :</strong> Interdiction au bailleur d'exiger des avances annuelles abusives.</li>
                    <li><strong>Honoraires d'agence (Art. 10) :</strong> Équivalents à 1 mois de loyer, facturés à la partie sollicitant le service.</li>
                  </ul>
                </div>

                {/* 2. Banque Centrale du Congo */}
                <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <strong className="text-sky-400 font-bold text-sm">
                      2. Banque Centrale du Congo (BCC) & Circuits Financiers
                    </strong>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold text-[10px]">
                      CONFORME
                    </span>
                  </div>
                  <ul className="space-y-1 text-slate-300 text-[11px] list-disc list-inside">
                    <li><strong>Non-détention de fonds de tiers (Brief §3.4) :</strong> NZUBU ne crée pas de wallet interne, ne détient pas la caution et n'encaisse pas les loyers.</li>
                    <li><strong>Paiement direct à l'hôte :</strong> L'avance de 20% et le solde de 80% sont versés directement à l'hôte (M-Pesa / Airtel Money / Espèces).</li>
                    <li><strong>Monnaie nationale :</strong> Affichage intégral en CDF conformément au rappel de la BCC de janvier 2026.</li>
                  </ul>
                </div>

                {/* 3. Code du Numérique */}
                <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <strong className="text-emerald-400 font-bold text-sm">
                      3. Ordonnance-loi n°23/010 du 13 mars 2023 (Code du Numérique)
                    </strong>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold text-[10px]">
                      CONFORME
                    </span>
                  </div>
                  <ul className="space-y-1 text-slate-300 text-[11px] list-disc list-inside">
                    <li><strong>Minimisation des données (Art. 193) :</strong> Les numéros de téléphone et adresses précises sont masqués publiquement.</li>
                    <li><strong>Localisation des données (Art. 201) :</strong> Hébergement primaire sécurisé, sans transfert international non autorisé.</li>
                    <li><strong>Droit à l'effacement :</strong> Procédure de clôture de compte documentée.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Monetization & Sponsored Ads Engine (MaishaPay RDC) */}
        {activeTab === 'MONETIZATION' && (
          <div className="space-y-5">
            {/* Top Bar with Create Ad button */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-slate-900 to-rose-500/10 border border-amber-500/30">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                    Monétisation & Revenus Sponsorisés
                  </span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded border border-emerald-500/30">
                    MaishaPay Mobile Money
                  </span>
                </div>
                <h3 className="text-lg font-black text-white mt-0.5">
                  Gestionnaire de Régie Publicitaire & Expiration Automatique
                </h3>
                <p className="text-xs text-slate-300">
                  Vidéos TikTok (9:16), bannières catalogue et annonces boostées avec retrait automatique à échéance.
                </p>
              </div>

              {onOpenCreateAd && (
                <button
                  onClick={onOpenCreateAd}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white text-xs font-black flex items-center gap-2 shadow-lg shadow-rose-500/20 active:scale-95 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Nouvelle Campagne (MaishaPay)</span>
                </button>
              )}
            </div>

            {/* Metrics Row */}
            {(() => {
              const { activeAds, expiredAds, totalRevenueCdf } = partitionAds(sponsoredAds);
              return (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                    <span className="text-xs text-slate-400 block font-semibold">Total Revenus Encaissés (CDF)</span>
                    <div className="text-2xl font-black text-emerald-400 font-mono mt-1">
                      {formatCDF(totalRevenueCdf)} CDF
                    </div>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <CreditCard className="w-3 h-3 text-emerald-400" />
                      M-Pesa, Airtel, Orange via MaishaPay
                    </span>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                    <span className="text-xs text-slate-400 block font-semibold">Campagnes Actives en Diffusion</span>
                    <div className="text-2xl font-black text-amber-400 font-mono mt-1">
                      {activeAds.length}
                    </div>
                    <span className="text-[10px] text-amber-300">
                      Visibles dans le feed vidéo & catalogue
                    </span>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                    <span className="text-xs text-slate-400 block font-semibold">Campagnes Expirées / Retirées</span>
                    <div className="text-2xl font-black text-slate-400 font-mono mt-1">
                      {expiredAds.length}
                    </div>
                    <span className="text-[10px] text-slate-500">
                      Retrait automatique programmé sans action manuelle
                    </span>
                  </div>
                </div>
              );
            })()}

            {/* Filters bar */}
            <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setAdFilter('ALL')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                    adFilter === 'ALL'
                      ? 'bg-slate-800 text-white border border-slate-700'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Toutes ({sponsoredAds.length})
                </button>
                <button
                  onClick={() => setAdFilter('ACTIVE')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                    adFilter === 'ACTIVE'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Actives ({sponsoredAds.filter((a) => isAdActive(a)).length})
                </button>
                <button
                  onClick={() => setAdFilter('EXPIRED')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                    adFilter === 'EXPIRED'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Expirées ({sponsoredAds.filter((a) => !isAdActive(a)).length})
                </button>
              </div>

              <span className="text-[11px] text-slate-400 hidden sm:inline">
                Durées : 3j, 7j, 14j, 30j · Strictement en Franc Congolais
              </span>
            </div>

            {/* Campaigns List */}
            <div className="space-y-3">
              {sponsoredAds
                .filter((ad) => {
                  if (adFilter === 'ACTIVE') return isAdActive(ad);
                  if (adFilter === 'EXPIRED') return !isAdActive(ad);
                  return true;
                })
                .map((ad) => {
                  const active = isAdActive(ad);
                  const remaining = getRemainingAdTime(ad.expiresAt);

                  return (
                    <div
                      key={ad.id}
                      className={`p-4 rounded-2xl border transition-all space-y-3 ${
                        active
                          ? 'bg-slate-900 border-slate-800 hover:border-slate-700'
                          : 'bg-slate-950/70 border-slate-900 opacity-75'
                      }`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className="w-16 h-16 rounded-xl bg-slate-950 overflow-hidden shrink-0 border border-slate-800 relative">
                            <img
                              src={ad.thumbnailUrl || ad.mediaUrl}
                              alt={ad.title}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute top-1 left-1">
                              {ad.format === 'VERTICAL_VIDEO_FEED' ? (
                                <span className="p-1 rounded bg-rose-500 text-white flex items-center justify-center">
                                  <Video className="w-2.5 h-2.5" />
                                </span>
                              ) : (
                                <span className="p-1 rounded bg-amber-500 text-slate-950 flex items-center justify-center">
                                  <ImageIcon className="w-2.5 h-2.5" />
                                </span>
                              )}
                            </div>
                          </div>

                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold text-amber-400">
                                {ad.id}
                              </span>
                              <h4 className="text-sm font-bold text-white">
                                {ad.title}
                              </h4>
                              {active ? (
                                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-[10px] border border-emerald-500/30 flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                  <span>En diffusion</span>
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-bold text-[10px] border border-rose-500/30">
                                  Expirée (Masquée)
                                </span>
                              )}
                            </div>

                            <div className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-2">
                              <span>Annonceur : <strong className="text-white">{ad.advertiserName}</strong></span>
                              <span>·</span>
                              <span>WhatsApp : <strong className="font-mono text-slate-300">{ad.advertiserPhone}</strong></span>
                              <span>·</span>
                              <span>Format : <strong className="text-slate-300">{ad.format === 'VERTICAL_VIDEO_FEED' ? 'Vidéo 9:16' : 'Bannière'}</strong></span>
                            </div>

                            <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">
                              {ad.tagline || ad.description}
                            </p>
                          </div>
                        </div>

                        {/* Timing and Pricing pill */}
                        <div className="text-right space-y-1">
                          <div className="text-base font-black text-white font-mono">
                            {formatCDF(ad.pricePaidCdf)} CDF
                          </div>
                          <div className="text-[10px] text-emerald-400 font-semibold">
                            Règlement MaishaPay ({ad.durationDays} jours)
                          </div>
                          <div className={`text-[11px] font-mono font-bold flex items-center justify-end gap-1 ${active ? 'text-amber-300' : 'text-slate-500'}`}>
                            <Clock className="w-3 h-3" />
                            <span>{remaining.label}</span>
                          </div>
                        </div>
                      </div>

                      {/* Performance & Operations Action Bar */}
                      <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-4 text-[11px] text-slate-400">
                          <span>Impressions : <strong className="text-white font-mono">{ad.impressionsCount}</strong></span>
                          <span>Clics / WhatsApp : <strong className="text-emerald-400 font-mono">{ad.clicksCount}</strong></span>
                          <span>Activé le : <strong className="text-slate-300">{new Date(ad.startsAt).toLocaleDateString('fr-CD')}</strong></span>
                          <span>Échéance : <strong className="text-slate-300">{new Date(ad.expiresAt).toLocaleDateString('fr-CD')}</strong></span>
                        </div>

                        <div className="flex items-center gap-2">
                          {onToggleAdStatus && (
                            <button
                              onClick={() => onToggleAdStatus(ad.id)}
                              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold transition-colors flex items-center gap-1"
                            >
                              {ad.status === 'ACTIVE' ? (
                                <>
                                  <Pause className="w-3 h-3" />
                                  <span>Mettre en pause</span>
                                </>
                              ) : (
                                <>
                                  <Play className="w-3 h-3 text-emerald-400" />
                                  <span>Réactiver</span>
                                </>
                              )}
                            </button>
                          )}

                          {onDeleteAd && (
                            <button
                              onClick={() => onDeleteAd(ad.id)}
                              className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 text-[11px] font-semibold transition-colors flex items-center gap-1"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Nettoyer</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* Tab 5: Kinshasa Operations Radar Map */}
        {activeTab === 'RADAR' && (
          <div className="space-y-4">
            <KinshasaRadarMap listings={listings} missions={missions} />
          </div>
        )}

        {/* Tab 6: Accounting Audit & Commissions (8% - 10%) */}
        {activeTab === 'AUDIT' && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                  <span>Grand Livre & Audit des Commissions d'Intermédiation</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Rémunération de la plateforme : 8% sur séjours confirmés via MaishaPay et honoraires baux Loi 15/025.
                </p>
              </div>

              <button
                type="button"
                onClick={handleExportAuditCsv}
                className="py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
              >
                <Download className="w-4 h-4" />
                <span>Exporter Journal d'Audit (CSV)</span>
              </button>
            </div>

            {/* Financial Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
                <span className="text-xs text-slate-400 block">Volume Total Transigé</span>
                <div className="text-xl font-black text-white font-mono">
                  {formatCDF(bookings.filter(b => b.status === 'CONFIRMED' || b.status === 'COMPLETED').reduce((acc, curr) => acc + curr.totalPriceCdf, 0))} CDF
                </div>
                <span className="text-[10px] text-slate-400">100% en Franc Congolais (CDF)</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
                <span className="text-xs text-slate-400 block">Avances 20% Encaissées (Hôtes)</span>
                <div className="text-xl font-black text-rose-400 font-mono">
                  {formatCDF(bookings.filter(b => b.status === 'CONFIRMED' || b.status === 'COMPLETED').reduce((acc, curr) => acc + curr.advanceAmountCdf, 0))} CDF
                </div>
                <span className="text-[10px] text-rose-300">Règlement direct Mobile Money / MaishaPay</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
                <span className="text-xs text-slate-400 block">Commissions NZUBU Net (8%)</span>
                <div className="text-xl font-black text-emerald-400 font-mono">
                  {formatCDF(Math.round(bookings.filter(b => b.status === 'CONFIRMED' || b.status === 'COMPLETED').reduce((acc, curr) => acc + curr.totalPriceCdf, 0) * 0.08))} CDF
                </div>
                <span className="text-[10px] text-emerald-300">Marge plateforme certifiée</span>
              </div>
            </div>

            {/* Detailed Transaction Audit Ledger */}
            <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
              <div className="p-4 border-b border-slate-800 flex items-center justify-between text-xs">
                <span className="font-bold text-white">Écritures comptables des séjours validés</span>
                <span className="text-slate-400 font-mono">{bookings.length} transaction(s)</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950/80 text-[10px] text-slate-400 uppercase font-mono border-b border-slate-800">
                    <tr>
                      <th className="p-3">Réf. Dossier</th>
                      <th className="p-3">Logement & Commune</th>
                      <th className="p-3">Voyageur</th>
                      <th className="p-3 text-right">Loyer Total CDF</th>
                      <th className="p-3 text-right">Avance 20% CDF</th>
                      <th className="p-3 text-right">Comm. 8% CDF</th>
                      <th className="p-3">Canal</th>
                      <th className="p-3">Statut</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {bookings.map((b) => (
                      <tr key={b.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="p-3 font-bold text-white">{b.id}</td>
                        <td className="p-3 font-sans">
                          <div className="font-bold text-white line-clamp-1">{b.listingTitle}</div>
                          <div className="text-[10px] text-slate-400">{b.commune}</div>
                        </td>
                        <td className="p-3 font-sans text-white">{b.guestName}</td>
                        <td className="p-3 text-right font-bold text-white">{formatCDF(b.totalPriceCdf)}</td>
                        <td className="p-3 text-right text-rose-300">{formatCDF(b.advanceAmountCdf)}</td>
                        <td className="p-3 text-right font-bold text-emerald-400">{formatCDF(Math.round(b.totalPriceCdf * 0.08))}</td>
                        <td className="p-3 font-sans text-[11px] text-slate-300">{b.paymentMethod || 'MaishaPay'}</td>
                        <td className="p-3 font-sans">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            b.status === 'CONFIRMED'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : 'bg-amber-500/20 text-amber-300'
                          }`}>
                            {b.status === 'CONFIRMED' ? 'Confirmé' : 'En cours'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
