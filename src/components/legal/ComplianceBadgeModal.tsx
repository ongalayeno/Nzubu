/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X, ShieldCheck, Scale, Banknote, Lock, CheckCircle2, MapPin } from 'lucide-react';

interface ComplianceBadgeModalProps {
  onClose: () => void;
}

export const ComplianceBadgeModal: React.FC<ComplianceBadgeModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl text-white max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Cadre Légal & Réglementaire NZUBU (RDC)
              </h3>
              <p className="text-xs text-slate-400">
                Transparence contractuelle, monétaire et protection des données à Kinshasa
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4 text-xs leading-relaxed text-slate-300">
          {/* Section 1: Loi 15/025 */}
          <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-2">
            <div className="flex items-center gap-2 font-bold text-amber-400 text-sm">
              <Scale className="w-4 h-4" />
              <span>Loi n°15/025 relative aux baux à loyer non professionnels</span>
            </div>
            <p>
              NZUBU applique rigoureusement les protections instituées par la loi congolaise pour le bail résidentiel :
            </p>
            <ul className="space-y-1 text-[11px] list-disc list-inside text-slate-300">
              <li><strong>Plafond de garantie locative (Art. 18) :</strong> Strictement limitée à 3 mois de loyer. Toute annonce exigeant une caution supérieure est bloquée.</li>
              <li><strong>Paiement du loyer (Art. 21) :</strong> Libellé et payé en monnaie ayant cours légal en RDC (Franc Congolais CDF).</li>
              <li><strong>Interdiction d'avance abusive (Art. 22) :</strong> Le bailleur ne peut exiger le paiement anticipatif du loyer.</li>
              <li><strong>Honoraires d'agence (Art. 10) :</strong> Équivalents à 1 mois de loyer à la charge de la partie qui a sollicité le service.</li>
            </ul>
          </div>

          {/* Section 2: BCC & Sécurité financière */}
          <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-2">
            <div className="flex items-center gap-2 font-bold text-sky-400 text-sm">
              <Banknote className="w-4 h-4" />
              <span>Banque Centrale du Congo (BCC) & Non-détention de fonds</span>
            </div>
            <p className="text-[11px]">
              Au MVP, NZUBU agit comme opérateur de plateforme et intermédiaire actif :
            </p>
            <ul className="space-y-1 text-[11px] list-disc list-inside text-slate-300">
              <li><strong>Paiement direct hôte/bailleur :</strong> NZUBU ne détient pas de compte séquestre ni de wallet client. L'avance de 20% et le solde sont versés directement à l'hôte.</li>
              <li><strong>Commission de 10% :</strong> NZUBU facture uniquement ses propres honoraires/commissions de manière périodique post-séjour.</li>
              <li><strong>Paiements locaux :</strong> Compatibilité avec Vodacom M-Pesa, Airtel Money et règlement en espèces direct.</li>
            </ul>
          </div>

          {/* Section 3: Zone pilote Kinshasa */}
          <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-2">
            <div className="flex items-center gap-2 font-bold text-emerald-400 text-sm">
              <MapPin className="w-4 h-4" />
              <span>Périmètre géographique du Pilote à Kinshasa</span>
            </div>
            <p className="text-[11px]">
              Le pilote opérationnel est concentré sur trois communes pour garantir un contrôle physique rigoureux : <strong>Gombe, Lingwala et Ngaliema</strong>. Les agents terrain vérifient physiquement chaque logement sur place avant toute publication dans le feed vidéo.
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-colors"
        >
          Fermer
        </button>
      </div>
    </div>
  );
};
