import React, { useState } from 'react';
import { 
  X, 
  Calculator, 
  TrendingUp, 
  Zap, 
  Droplets, 
  ShieldCheck, 
  Flame, 
  Building2, 
  CheckCircle2, 
  ArrowRight,
  Info
} from 'lucide-react';

interface RentalYieldCalculatorModalProps {
  onClose: () => void;
  initialCommune?: string;
}

interface CommunePreset {
  name: string;
  defaultShortStayNightCdf: number;
  defaultResidentialMonthCdf: number;
  avgOccupancyRate: number;
  typicalGeneratorCostCdf: number;
}

const COMMUNE_PRESETS: Record<string, CommunePreset> = {
  Gombe: {
    name: 'Gombe (Centre des Affaires & Ambassades)',
    defaultShortStayNightCdf: 380000, // ~135 USD
    defaultResidentialMonthCdf: 4200000, // ~1500 USD
    avgOccupancyRate: 68,
    typicalGeneratorCostCdf: 450000,
  },
  Ngaliema: {
    name: 'Ngaliema (Macampagne / GB / Utex / Binza)',
    defaultShortStayNightCdf: 220000, // ~78 USD
    defaultResidentialMonthCdf: 2500000, // ~880 USD
    avgOccupancyRate: 62,
    typicalGeneratorCostCdf: 320000,
  },
  Lingwala: {
    name: 'Lingwala (Proximité Palais du Peuple & Gombe)',
    defaultShortStayNightCdf: 140000, // ~50 USD
    defaultResidentialMonthCdf: 1400000, // ~490 USD
    avgOccupancyRate: 58,
    typicalGeneratorCostCdf: 220000,
  },
  Limete: {
    name: 'Limete (Résidentiel 1ère - 14ème Rue)',
    defaultShortStayNightCdf: 180000, // ~63 USD
    defaultResidentialMonthCdf: 2000000, // ~700 USD
    avgOccupancyRate: 60,
    typicalGeneratorCostCdf: 280000,
  },
  Kintambo: {
    name: 'Kintambo (Proximité Baie & Magasin)',
    defaultShortStayNightCdf: 160000,
    defaultResidentialMonthCdf: 1600000,
    avgOccupancyRate: 55,
    typicalGeneratorCostCdf: 240000,
  }
};

export const RentalYieldCalculatorModal: React.FC<RentalYieldCalculatorModalProps> = ({
  onClose,
  initialCommune = 'Gombe'
}) => {
  const [selectedCommune, setSelectedCommune] = useState<string>(
    COMMUNE_PRESETS[initialCommune] ? initialCommune : 'Gombe'
  );

  const preset = COMMUNE_PRESETS[selectedCommune];

  // Parameters
  const [shortStayNightCdf, setShortStayNightCdf] = useState<number>(preset.defaultShortStayNightCdf);
  const [occupancyRate, setOccupancyRate] = useState<number>(preset.avgOccupancyRate);
  const [residentialRentCdf, setResidentialRentCdf] = useState<number>(preset.defaultResidentialMonthCdf);

  // Operational charges (Kinshasa specifics)
  const [generatorFuelCdf, setGeneratorFuelCdf] = useState<number>(preset.typicalGeneratorCostCdf);
  const [guardSecurityCdf, setGuardSecurityCdf] = useState<number>(200000); // 200k CDF / mois
  const [waterMaintenanceCdf, setWaterMaintenanceCdf] = useState<number>(80000); // 80k CDF / mois
  const [cleaningPerStayCdf, setCleaningPerStayCdf] = useState<number>(35000); // Nettoyage / séjour
  const [applyRentalTax, setApplyRentalTax] = useState<boolean>(true); // IRL 22% RDC

  // Handle commune preset switch
  const handleCommuneChange = (communeKey: string) => {
    setSelectedCommune(communeKey);
    const p = COMMUNE_PRESETS[communeKey];
    if (p) {
      setShortStayNightCdf(p.defaultShortStayNightCdf);
      setResidentialRentCdf(p.defaultResidentialMonthCdf);
      setOccupancyRate(p.avgOccupancyRate);
      setGeneratorFuelCdf(p.typicalGeneratorCostCdf);
    }
  };

  const formatCDF = (num: number) => new Intl.NumberFormat('fr-CD').format(Math.round(num));

  // Calculations: Short-stay (Monthly average over 30 days)
  const occupiedNightsMonth = Math.round((30 * occupancyRate) / 100);
  const grossShortStayMonthCdf = occupiedNightsMonth * shortStayNightCdf;
  const nzubuCommissionShortStayCdf = grossShortStayMonthCdf * 0.10; // 10% NZUBU
  const estimatedStaysCount = Math.max(1, Math.round(occupiedNightsMonth / 3)); // Average stay = 3 nights
  const totalCleaningMonthCdf = estimatedStaysCount * cleaningPerStayCdf;
  const totalRunningExpensesShortStayCdf = generatorFuelCdf + guardSecurityCdf + waterMaintenanceCdf + totalCleaningMonthCdf;
  
  // Tax (IRL 22% on gross or net depending on fiscal declaration)
  const taxShortStayCdf = applyRentalTax ? grossShortStayMonthCdf * 0.22 : 0;
  const netShortStayMonthCdf = grossShortStayMonthCdf - nzubuCommissionShortStayCdf - totalRunningExpensesShortStayCdf - taxShortStayCdf;
  const netShortStayYearCdf = netShortStayMonthCdf * 12;

  // Calculations: Residential 3-year lease (Monthly)
  const grossResidentialMonthCdf = residentialRentCdf;
  // In residential lease, tenant usually pays water & electricity, landlord covers guard or structural maintenance
  const residentialOwnerExpensesCdf = (waterMaintenanceCdf * 0.5) + (guardSecurityCdf * 0.5);
  const taxResidentialCdf = applyRentalTax ? grossResidentialMonthCdf * 0.22 : 0;
  const netResidentialMonthCdf = grossResidentialMonthCdf - residentialOwnerExpensesCdf - taxResidentialCdf;
  const netResidentialYearCdf = netResidentialMonthCdf * 12;

  // Comparison difference
  const monthlyDifferenceCdf = netShortStayMonthCdf - netResidentialMonthCdf;
  const percentGain = netResidentialMonthCdf > 0 
    ? Math.round(((netShortStayMonthCdf - netResidentialMonthCdf) / netResidentialMonthCdf) * 100)
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl my-auto">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-base sm:text-lg">
                  Simulateur de Rendement Locatif Kinshasa
                </h3>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 font-bold px-2 py-0.5 rounded border border-amber-500/30">
                  Loi 15/025 & Fiscalité RDC
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Comparez vos gains nets : Location courte durée (style séjour) vs Bail classique résidentiel 3 ans.
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Commune Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-2">
              Sélectionnez la commune à Kinshasa (Préréglages du marché local)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {Object.keys(COMMUNE_PRESETS).map((key) => {
                const isSelected = selectedCommune === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleCommuneChange(key)}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      isSelected
                        ? 'bg-amber-500/20 border-amber-500 text-white shadow-md'
                        : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white'
                    }`}
                  >
                    <div className="font-bold text-xs">{key}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5 truncate">
                      {COMMUNE_PRESETS[key].avgOccupancyRate}% occup. moy.
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Form grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Column 1: Short Stay Settings */}
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5" />
                  <span>Option 1 : Courte Durée (NZUBU Séjour)</span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono">Commission 10%</span>
              </div>

              <div>
                <label className="block text-[11px] text-slate-300 font-medium mb-1">
                  Prix par nuitée (en Franc Congolais CDF)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step={10000}
                    value={shortStayNightCdf}
                    onChange={(e) => setShortStayNightCdf(Math.max(10000, Number(e.target.value)))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                  <span className="absolute right-3 top-2.5 text-[10px] text-slate-400 font-mono">CDF / nuit</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center text-[11px] text-slate-300 font-medium mb-1">
                  <span>Taux d'occupation mensuel visé</span>
                  <span className="text-amber-400 font-bold font-mono">{occupancyRate}% ({occupiedNightsMonth} nuits/mois)</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="95"
                  step="5"
                  value={occupancyRate}
                  onChange={(e) => setOccupancyRate(Number(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-2">
                <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Revenu brut mensuel</span>
                  <span className="text-xs font-bold font-mono text-emerald-400">
                    {formatCDF(grossShortStayMonthCdf)} CDF
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Commission NZUBU (10%)</span>
                  <span className="text-xs font-bold font-mono text-rose-300">
                    -{formatCDF(nzubuCommissionShortStayCdf)} CDF
                  </span>
                </div>
              </div>
            </div>

            {/* Column 2: Classic Residential Settings */}
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-bold text-sky-400 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Option 2 : Bail Résidentiel Classique (3 ans)</span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono">Loi 15/025 (Max 3 mois caution)</span>
              </div>

              <div>
                <label className="block text-[11px] text-slate-300 font-medium mb-1">
                  Loyer mensuel contractuel (en CDF)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step={50000}
                    value={residentialRentCdf}
                    onChange={(e) => setResidentialRentCdf(Math.max(50000, Number(e.target.value)))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-sky-500"
                  />
                  <span className="absolute right-3 top-2.5 text-[10px] text-slate-400 font-mono">CDF / mois</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] text-slate-400 space-y-1.5">
                <div className="flex items-center gap-1 text-slate-300 font-semibold">
                  <Info className="w-3.5 h-3.5 text-sky-400" />
                  <span>Cadre juridique congolais</span>
                </div>
                <p>
                  En bail résidentiel, le locataire prend directement en charge ses factures SNEL et REGIDESO. Risque d'impayé ou de procédure d'expulsion (3 à 6 mois de procédure de déguerpissement).
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-2">
                <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Revenu brut mensuel</span>
                  <span className="text-xs font-bold font-mono text-emerald-400">
                    {formatCDF(grossResidentialMonthCdf)} CDF
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Entretien structurel bailleur</span>
                  <span className="text-xs font-bold font-mono text-rose-300">
                    -{formatCDF(residentialOwnerExpensesCdf)} CDF
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Kinshasa Operational Charges Adjustments */}
          <div className="p-4 rounded-2xl bg-slate-950/40 border border-slate-800 space-y-3">
            <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Dépenses d'exploitation réelles à Kinshasa (À la charge du bailleur en courte durée)</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] text-slate-400 mb-1">
                  Carburant Groupe Électrogène (Mazout)
                </label>
                <input
                  type="number"
                  step={20000}
                  value={generatorFuelCdf}
                  onChange={(e) => setGeneratorFuelCdf(Math.max(0, Number(e.target.value)))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 mb-1">
                  Sentinelle / Gardiennage 24/7
                </label>
                <input
                  type="number"
                  step={20000}
                  value={guardSecurityCdf}
                  onChange={(e) => setGuardSecurityCdf(Math.max(0, Number(e.target.value)))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 mb-1">
                  Entretien Forage & Cuve d'eau
                </label>
                <input
                  type="number"
                  step={10000}
                  value={waterMaintenanceCdf}
                  onChange={(e) => setWaterMaintenanceCdf(Math.max(0, Number(e.target.value)))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white font-mono"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="rentalTax"
                checked={applyRentalTax}
                onChange={(e) => setApplyRentalTax(e.target.checked)}
                className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-0"
              />
              <label htmlFor="rentalTax" className="text-xs text-slate-300">
                Déduire l'Impôt sur le Revenu Locatif (IRL 22% RDC / DGI - Ville de Kinshasa)
              </label>
            </div>
          </div>

          {/* Big Comparison Summary Box */}
          <div className="p-5 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/30 border border-amber-500/30 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4" />
                <span>Verdict & Bilan Comparatif Annuel Net</span>
              </span>
              <div className={`px-3 py-1 rounded-full text-xs font-black ${
                monthlyDifferenceCdf > 0 
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                  : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
              }`}>
                {monthlyDifferenceCdf > 0 
                  ? `+${percentGain}% de gains nets en Courte Durée` 
                  : 'Bail résidentiel plus sécurisant'}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Short Stay Card */}
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-amber-500/30 space-y-2">
                <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wide">
                  Courte Durée (NZUBU Séjour)
                </span>
                <div className="text-2xl font-black text-white font-mono">
                  {formatCDF(netShortStayMonthCdf)} CDF <span className="text-xs font-normal text-slate-400">/ mois net</span>
                </div>
                <div className="text-xs text-slate-400">
                  Soit <strong className="text-amber-300 font-mono">{formatCDF(netShortStayYearCdf)} CDF</strong> net annuel
                </div>
                <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-800">
                  Charges déduites : NZUBU 10%, mazout ({formatCDF(generatorFuelCdf)} CDF), gardien, nettoyage & taxes.
                </div>
              </div>

              {/* Residential Card */}
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
                <span className="text-[11px] font-bold text-sky-400 uppercase tracking-wide">
                  Bail Résidentiel 3 Ans (Loi 15/025)
                </span>
                <div className="text-2xl font-black text-white font-mono">
                  {formatCDF(netResidentialMonthCdf)} CDF <span className="text-xs font-normal text-slate-400">/ mois net</span>
                </div>
                <div className="text-xs text-slate-400">
                  Soit <strong className="text-sky-300 font-mono">{formatCDF(netResidentialYearCdf)} CDF</strong> net annuel
                </div>
                <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-800">
                  Avantage : Tranquillité de gestion et trésorerie régulière 12 mois/an.
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold">Recommandation Stratégique NZUBU :</span>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  À <strong>{selectedCommune}</strong>, si votre bien dispose d'une bonne climatisation, d'un groupe électrogène fiable et d'une citerne d'eau opérationnelle, la courte durée génère un surplus moyen estimé de <strong>{formatCDF(Math.max(0, monthlyDifferenceCdf))} CDF par mois</strong>. NZUBU s'occupe de la vérification terrain et vous permet d'encaisser directement vos avances via Mobile Money et MaishaPay.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 flex justify-end gap-3 bg-slate-950/60">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors"
          >
            Fermer le simulateur
          </button>
        </div>
      </div>
    </div>
  );
};
