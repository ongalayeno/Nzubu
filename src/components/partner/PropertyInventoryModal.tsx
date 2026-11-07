/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  X, 
  ClipboardCheck, 
  Droplets, 
  Zap, 
  FileDown, 
  Key, 
  Camera, 
  CheckCircle2, 
  User, 
  ShieldCheck,
  PenTool,
  Clock
} from 'lucide-react';
import { PropertyListing, InventoryReport } from '../../types';
import { exportInventoryPdf } from '../../utils/exportInventoryPdf';

interface PropertyInventoryModalProps {
  listing: PropertyListing;
  isOpen?: boolean;
  type?: 'ENTRY' | 'EXIT';
  onClose: () => void;
  onSaveReport?: (report: InventoryReport) => void;
}

export const PropertyInventoryModal: React.FC<PropertyInventoryModalProps> = ({
  listing,
  isOpen = true,
  type = 'ENTRY',
  onClose,
  onSaveReport,
}) => {
  if (!isOpen) return null;
  const [reportType, setReportType] = useState<'ENTRY' | 'EXIT'>(type);
  const [tenantName, setTenantName] = useState('Didier Kazadi');
  const [tenantPhone, setTenantPhone] = useState('+243 82 450 1234');
  const [meterIndexKwh, setMeterIndexKwh] = useState(14820);
  const [waterPressure, setWaterPressure] = useState<'FAIBLE' | 'BON' | 'TRES_BON'>('BON');
  const [paintState, setPaintState] = useState<'NEUF' | 'BON' | 'A_RAFRAICHIR'>('BON');
  const [acWorkingCount, setAcWorkingCount] = useState(2);
  const [keysCount, setKeysCount] = useState(3);
  const [furnitureInventoryNotes, setFurnitureInventoryNotes] = useState('Salon en cuir 5 places, lit king-size avec matelas orthopédique, réfrigérateur Samsung, cuisinière à gaz.');
  const [roomsNotes, setRoomsNotes] = useState('Peinture propre sans trous de chevilles. Carrelage salon et chambre intact. Robinetterie sans fuite.');
  const [hasSigned, setHasSigned] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

  const handleGeneratePdf = async () => {
    setIsExporting(true);
    const report: InventoryReport = {
      id: `inv-${Date.now().toString(36)}`,
      listingId: listing.id,
      listingTitle: listing.title,
      commune: listing.commune,
      type: reportType,
      tenantName,
      tenantPhone,
      landlordName: listing.partner.name,
      landlordPhone: listing.partner.phoneMasked,
      meterIndexKwh: Number(meterIndexKwh),
      waterPressure,
      paintState,
      acWorkingCount: Number(acWorkingCount),
      keysCount: Number(keysCount),
      furnitureInventoryNotes,
      roomsNotes,
      photos: [],
      createdAt: new Date().toLocaleDateString('fr-CD') + ' à ' + new Date().toLocaleTimeString('fr-CD', { hour: '2-digit', minute: '2-digit' }),
    };

    try {
      await exportInventoryPdf(report);
      onSaveReport?.(report);
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la création du document.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in select-none">
      <div 
        className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/95 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/20 text-teal-400 border border-teal-500/40 flex items-center justify-center font-bold">
              <ClipboardCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-teal-400">
                  Loi n°15/025 RDC
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                  Contradictoire
                </span>
              </div>
              <h3 className="text-base font-bold text-white mt-0.5 line-clamp-1">
                État des Lieux Numérique : {listing.title}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-5 flex-1 text-xs">
          {/* Type Selector (Entrée vs Sortie) */}
          <div className="p-1.5 bg-slate-950 rounded-2xl border border-slate-800 grid grid-cols-2 gap-2 text-center">
            <button
              type="button"
              onClick={() => setReportType('ENTRY')}
              className={`py-2 rounded-xl font-bold transition-all ${
                reportType === 'ENTRY'
                  ? 'bg-teal-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              1. État des Lieux d'Entrée (Remise des Clés)
            </button>
            <button
              type="button"
              onClick={() => setReportType('EXIT')}
              className={`py-2 rounded-xl font-bold transition-all ${
                reportType === 'EXIT'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              2. État des Lieux de Sortie (Restitution Caution)
            </button>
          </div>

          {/* Parties identification */}
          <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-800 space-y-3">
            <h4 className="font-bold text-slate-200 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-teal-400" />
              <span>Identification des parties contradictoires</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">Nom du Preneur (Locataire)</label>
                <input
                  type="text"
                  value={tenantName}
                  onChange={(e) => setTenantName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-teal-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Téléphone Preneur</label>
                <input
                  type="tel"
                  value={tenantPhone}
                  onChange={(e) => setTenantPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-mono focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>
          </div>

          {/* Technical Meter Readings (Water & Power) */}
          <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-800 space-y-3">
            <h4 className="font-bold text-slate-200 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Relevés techniques SNEL & REGIDESO sur place</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">Index Compteur SNEL (kWh)</label>
                <input
                  type="number"
                  value={meterIndexKwh}
                  onChange={(e) => setMeterIndexKwh(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Pression & Débit Eau REGIDESO</label>
                <select
                  value={waterPressure}
                  onChange={(e) => setWaterPressure(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-sky-500"
                >
                  <option value="TRES_BON">Très bon débit (Robinet & douche constants)</option>
                  <option value="BON">Bon débit (Avec surpresseur / cuve)</option>
                  <option value="FAIBLE">Débit faible (Alimentation par intermittence)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Finitions, Clim & Clés */}
          <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-800 space-y-3">
            <h4 className="font-bold text-slate-200 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-indigo-400" />
              <span>Clés, Peinture & Climatisation</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">Nombre de clés remises</label>
                <input
                  type="number"
                  min="1"
                  value={keysCount}
                  onChange={(e) => setKeysCount(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">État de la Peinture</label>
                <select
                  value={paintState}
                  onChange={(e) => setPaintState(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500"
                >
                  <option value="NEUF">Neuf / Récemment peint</option>
                  <option value="BON">Bon état d'usage</option>
                  <option value="A_RAFRAICHIR">À rafraîchir</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Climatiseurs en marche</label>
                <input
                  type="number"
                  min="0"
                  value={acWorkingCount}
                  onChange={(e) => setAcWorkingCount(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Inventaire du mobilier & Électroménager</label>
              <textarea
                value={furnitureInventoryNotes}
                onChange={(e) => setFurnitureInventoryNotes(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Observations détaillées des pièces (Murs, plafonds, sanitaires)</label>
              <textarea
                value={roomsNotes}
                onChange={(e) => setRoomsNotes(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Legal Protection Box */}
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
            <div className="text-[11px] leading-relaxed">
              <strong>Sécurité Juridique Garantie :</strong> Ce document servira de référence contradictoire unique pour la restitution intégrale de la caution locative de 3 mois ({listing.pricing.amountCdf * 3} CDF) à la fin du séjour ou du bail.
            </div>
          </div>

          {/* CTA Download PDF */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleGeneratePdf}
              disabled={isExporting}
              className="w-full py-3 rounded-2xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-teal-500/20 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              <FileDown className="w-4 h-4" />
              <span>
                {isExporting 
                  ? 'Génération du Procès-Verbal...' 
                  : `Générer et Télécharger le PV d'État des Lieux (${reportType === 'ENTRY' ? "Entrée" : "Sortie"} - PDF)`}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
