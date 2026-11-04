/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X, ShieldCheck, CheckCircle2, AlertTriangle, Calendar, UserCheck, FileText, ExternalLink } from 'lucide-react';
import { PropertyListing } from '../../types';

interface VerifiedBadgeDrawerProps {
  listing: PropertyListing | null;
  onClose: () => void;
}

export const VerifiedBadgeDrawer: React.FC<VerifiedBadgeDrawerProps> = ({
  listing,
  onClose,
}) => {
  if (!listing) return null;

  const { verification } = listing;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-2xl p-6 text-white max-h-[85vh] overflow-y-auto shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Grab bar on mobile */}
        <div className="w-12 h-1 bg-slate-700 rounded-full mx-auto mb-4 sm:hidden" />

        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Vérifié par NZUBU</h3>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Certifié 90j
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Contrôle physique sur site & vérification documentaire
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Metadata summary */}
        <div className="grid grid-cols-2 gap-3 my-4 p-3 rounded-xl bg-slate-800/60 border border-slate-700/50 text-xs">
          <div>
            <span className="text-slate-400 block text-[11px]">Date d'inspection :</span>
            <span className="font-semibold text-white flex items-center gap-1 mt-0.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
              {verification.verifiedAt}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Validité du badge :</span>
            <span className="font-semibold text-amber-300 flex items-center gap-1 mt-0.5">
              Jusqu'au {verification.verifiedUntil}
            </span>
          </div>
          <div className="col-span-2 pt-2 border-t border-slate-700/40">
            <span className="text-slate-400 block text-[11px]">Agent inspecteur agréé :</span>
            <span className="font-semibold text-white flex items-center gap-1 mt-0.5">
              <UserCheck className="w-3.5 h-3.5 text-slate-300" />
              {verification.inspectorName} ({verification.inspectorId})
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5 font-mono">
              Réf. rapport : {verification.reportReference}
            </span>
          </div>
        </div>

        {/* 7 Mandatory Checks (Brief §1.5) */}
        <div className="space-y-2.5 my-5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Contrôles obligatoires effectués avec succès
          </h4>

          <div className="space-y-2 text-xs">
            <div className="flex items-start gap-2.5 text-slate-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white">Identité et droit de proposer :</strong>{' '}
                Vérification du proposant et concordance du titre foncier ou mandat écrit.
              </div>
            </div>

            <div className="flex items-start gap-2.5 text-slate-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white">Existence et localisation physique :</strong>{' '}
                Visite sur place à Kinshasa ({listing.commune}), vérification de l'accès réel.
              </div>
            </div>

            <div className="flex items-start gap-2.5 text-slate-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white">Eau et électricité observables :</strong>{' '}
                Test effectif de l'eau courante/réserve ({listing.utilities.water.notes}) et secours électrique ({listing.utilities.electricity.notes}).
              </div>
            </div>

            <div className="flex items-start gap-2.5 text-slate-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white">Concordance des pièces & mobilier :</strong>{' '}
                Nombre de chambres ({listing.bedroomsCount}), sanitaires ({listing.bathroomsCount}) et mobilier inspectés.
              </div>
            </div>

            <div className="flex items-start gap-2.5 text-slate-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white">Production média certifiée NZUBU :</strong>{' '}
                Vidéo verticale 9:16 filmée par notre agent sans captation abusive de visages tiers.
              </div>
            </div>

            <div className="flex items-start gap-2.5 text-slate-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white">Prix transparents en Franc Congolais (CDF) :</strong>{' '}
                Loi 15/025 respectée (garantie résidentielle plafonnée à 3 mois maximum, aucun paiement anticipatif abusif).
              </div>
            </div>
          </div>
        </div>

        {/* Clear Disclaimers (Required by Brief §1.4 & §1.5) */}
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200/90 space-y-1.5">
          <div className="flex items-center gap-1.5 font-bold text-amber-300">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Périmètre et limites de la vérification</span>
          </div>
          <p className="text-[11px] leading-relaxed">
            Le badge certifie les constats réalisés le jour du passage. Il ne constitue ni une expertise de solidité du gros œuvre, ni un certificat d'absence de litige foncier devant les cours et tribunaux, ni une garantie de disponibilité continue sans confirmation de l'hôte.
          </p>
        </div>

        {/* Action button */}
        <div className="mt-5">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-colors"
          >
            Fermer le rapport
          </button>
        </div>
      </div>
    </div>
  );
};
