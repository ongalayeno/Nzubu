import React, { useState } from 'react';
import { 
  X, 
  Globe, 
  CreditCard, 
  ShieldCheck, 
  CheckCircle2, 
  FileDown, 
  Lock, 
  ArrowRight,
  Plane,
  AlertCircle
} from 'lucide-react';
import { PropertyListing, BookingRequest, DiasporaPayment } from '../../types';
import { exportDiasporaGuaranteePdf } from '../../utils/exportDiasporaGuaranteePdf';

interface DiasporaPaymentModalProps {
  listing: PropertyListing;
  booking?: BookingRequest;
  onClose: () => void;
  onSuccess?: (payment: DiasporaPayment) => void;
}

const EXCHANGE_RATES: Record<string, { label: string; symbol: string; rateToCdf: number; countryExample: string }> = {
  EUR: { label: 'Euro (Zone Euro)', symbol: '€', rateToCdf: 3100, countryExample: 'Belgique, France, Allemagne' },
  USD: { label: 'US Dollar', symbol: '$', rateToCdf: 2850, countryExample: 'USA, RDC, International' },
  CAD: { label: 'Canadian Dollar', symbol: 'CA$', rateToCdf: 2080, countryExample: 'Canada' },
  GBP: { label: 'British Pound', symbol: '£', rateToCdf: 3650, countryExample: 'Royaume-Uni' },
  ZAR: { label: 'South African Rand', symbol: 'R', rateToCdf: 160, countryExample: 'Afrique du Sud' }
};

export const DiasporaPaymentModal: React.FC<DiasporaPaymentModalProps> = ({
  listing,
  booking,
  onClose,
  onSuccess
}) => {
  const [selectedCurrency, setSelectedCurrency] = useState<'EUR' | 'USD' | 'CAD' | 'GBP' | 'ZAR'>('EUR');
  const [guarantorCountry, setGuarantorCountry] = useState<string>('Belgique');
  const [guarantorName, setGuarantorName] = useState<string>('Christian Mbuyi');
  const [guarantorEmail, setGuarantorEmail] = useState<string>('c.mbuyi@gmail.com');
  const [beneficiaryName, setBeneficiaryName] = useState<string>(booking?.guestName || 'Famille Mbuyi (Kinshasa)');
  const [cardNumber, setCardNumber] = useState<string>('4532 •••• •••• 8821');
  const [cardExpiry, setCardExpiry] = useState<string>('08/28');
  const [cardCvc, setCardCvc] = useState<string>('729');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [completedPayment, setCompletedPayment] = useState<DiasporaPayment | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);

  // Determine amount in CDF (either booking advance 20% or full amount or listing price)
  const amountCdf = booking ? booking.advanceAmountCdf : Math.round(listing.pricing.amountCdf * (listing.pricing.bookingAdvancePercent ? listing.pricing.bookingAdvancePercent / 100 : 0.20));

  const curr = EXCHANGE_RATES[selectedCurrency];
  const originalCurrencyAmount = Math.ceil(amountCdf / curr.rateToCdf);

  const formatCDF = (num: number) => new Intl.NumberFormat('fr-CD').format(num);

  const handlePayInternational = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    setTimeout(() => {
      const payment: DiasporaPayment = {
        id: `DIASPORA-${Date.now().toString().slice(-6)}`,
        bookingId: booking?.id || `BK-${Date.now().toString().slice(-4)}`,
        listingTitle: listing.title,
        beneficiaryName,
        guarantorName,
        guarantorCountry,
        paymentMethod: cardNumber.startsWith('5') ? 'MASTERCARD_INTERNATIONAL' : 'VISA_INTERNATIONAL',
        currency: selectedCurrency as any,
        amountOriginal: originalCurrencyAmount,
        amountCdfEquivalent: amountCdf,
        exchangeRateBcc: curr.rateToCdf,
        guaranteeCertificateNumber: `NZUBU-GAR-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        createdAt: new Date().toISOString()
      };

      setCompletedPayment(payment);
      setIsProcessing(false);
      if (onSuccess) {
        onSuccess(payment);
      }
    }, 1400);
  };

  const handleDownloadGuarantee = async () => {
    if (!completedPayment) return;
    setIsGeneratingPdf(true);
    try {
      await exportDiasporaGuaranteePdf(completedPayment, listing);
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la création du certificat de garantie.");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl my-auto">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-base">
                  Pack Diaspora & Expatriés
                </h3>
                <span className="text-[10px] bg-indigo-500/20 text-indigo-300 font-bold px-2 py-0.5 rounded border border-indigo-500/30">
                  MaishaPay International
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Paiement par Carte Bancaire Visa/Mastercard depuis l'étranger pour un séjour ou un proche à Kinshasa.
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

        {/* Body */}
        <div className="p-5 sm:p-6 space-y-5">
          {!completedPayment ? (
            <form onSubmit={handlePayInternational} className="space-y-4">
              {/* Property summary */}
              <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider block">
                    Logement ciblé à Kinshasa
                  </span>
                  <div className="text-xs font-bold text-white mt-0.5">
                    {listing.title} ({listing.commune})
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">Avance requise</span>
                  <span className="text-sm font-black text-amber-400 font-mono">
                    {formatCDF(amountCdf)} CDF
                  </span>
                </div>
              </div>

              {/* Currency Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Choisissez votre devise de paiement étranger
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {Object.entries(EXCHANGE_RATES).map(([code, info]) => {
                    const isSelected = selectedCurrency === code;
                    return (
                      <button
                        key={code}
                        type="button"
                        onClick={() => setSelectedCurrency(code as any)}
                        className={`p-2.5 rounded-xl border text-center transition-all ${
                          isSelected
                            ? 'bg-indigo-500/20 border-indigo-500 text-white shadow-sm'
                            : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        <div className="font-bold text-xs">{code}</div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">{info.symbol}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Converted Amount Box */}
              <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/30 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-indigo-300 font-bold block">
                    Montant débité de votre carte internationale
                  </span>
                  <div className="text-2xl font-black text-white font-mono mt-0.5">
                    {originalCurrencyAmount} {curr.symbol} <span className="text-xs font-normal text-indigo-300">({selectedCurrency})</span>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    Taux officiel BCC : 1 {selectedCurrency} = {formatCDF(curr.rateToCdf)} CDF
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded border border-emerald-500/30">
                    Sans frais cachés
                  </span>
                </div>
              </div>

              {/* Diaspora Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-300 font-medium mb-1">
                    Pays où vous résidez
                  </label>
                  <select
                    value={guarantorCountry}
                    onChange={(e) => setGuarantorCountry(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Belgique">Belgique 🇧🇪</option>
                    <option value="France">France 🇫🇷</option>
                    <option value="Canada">Canada 🇨🇦</option>
                    <option value="États-Unis">États-Unis 🇺🇸</option>
                    <option value="Royaume-Uni">Royaume-Uni 🇬🇧</option>
                    <option value="Afrique du Sud">Afrique du Sud 🇿🇦</option>
                    <option value="Suisse">Suisse 🇨🇭</option>
                    <option value="Autre pays">Autre pays</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-300 font-medium mb-1">
                    Nom du garant (Votre nom à l'étranger)
                  </label>
                  <input
                    type="text"
                    required
                    value={guarantorName}
                    onChange={(e) => setGuarantorName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-300 font-medium mb-1">
                    Bénéficiaire ou occupant à Kinshasa
                  </label>
                  <input
                    type="text"
                    required
                    value={beneficiaryName}
                    onChange={(e) => setBeneficiaryName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-300 font-medium mb-1">
                    Email pour réception quittance & certificat
                  </label>
                  <input
                    type="email"
                    required
                    value={guarantorEmail}
                    onChange={(e) => setGuarantorEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Card Inputs */}
              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-1.5 font-bold text-white">
                    <Lock className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Passerelle Sécurisée MaishaPay (3D Secure)</span>
                  </span>
                  <div className="flex items-center gap-1 font-mono text-[10px]">
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">VISA</span>
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">Mastercard</span>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">
                    Numéro de carte internationale
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500 pl-9"
                    />
                    <CreditCard className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">
                      Expiration (MM/AA)
                    </label>
                    <input
                      type="text"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">
                      CVV / CVC
                    </label>
                    <input
                      type="password"
                      maxLength={4}
                      value={cardCvc}
                      onChange={(e) => setCardCvc(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isProcessing}
                className="w-full py-3.5 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-60"
              >
                {isProcessing ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Communication avec la passerelle bancaire...</span>
                  </span>
                ) : (
                  <>
                    <span>Valider & Payer {originalCurrencyAmount} {curr.symbol}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* Success State */
            <div className="space-y-5 text-center py-2 animate-fade-in">
              <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center border border-emerald-500/30">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h4 className="text-lg font-black text-white">
                  Paiement International Réussi !
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  Transaction MaishaPay validée. L'hôte à Kinshasa a reçu la notification instantanée.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-left space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">N° Certificat Diaspora :</span>
                  <span className="font-mono text-indigo-400 font-bold">{completedPayment.guaranteeCertificateNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Montant débité :</span>
                  <span className="font-mono text-white font-bold">{completedPayment.amountOriginal} {completedPayment.currency}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Équivalent légal en RDC :</span>
                  <span className="font-mono text-emerald-400 font-bold">{formatCDF(completedPayment.amountCdfEquivalent)} CDF</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Bénéficiaire à Kinshasa :</span>
                  <span className="text-white font-bold">{completedPayment.beneficiaryName}</span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-200 text-left flex items-start gap-2.5">
                <ShieldCheck className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                <p className="text-[11px] leading-relaxed">
                  Le <strong>Certificat de Garantie Diaspora NZUBU</strong> est juridiquement reconnu auprès des tribunaux et bailleurs kinois. Il protège le séjour de votre famille contre toute annulation abusive.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleDownloadGuarantee}
                  disabled={isGeneratingPdf}
                  className="flex-1 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 transition-all disabled:opacity-60"
                >
                  <FileDown className="w-4 h-4" />
                  <span>{isGeneratingPdf ? 'Génération du PDF...' : 'Télécharger le Certificat Officiel (PDF)'}</span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors"
                >
                  Terminer
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
