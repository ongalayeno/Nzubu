/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  Clock, 
  ShieldCheck, 
  Video, 
  ImageIcon, 
  CheckCircle2, 
  ArrowRight, 
  Smartphone, 
  CreditCard, 
  Loader2,
  Calendar,
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import { SponsoredAd, AdCategory } from '../../types';
import { AD_TARIFFS, AdTariffPlan } from '../../domain/ads';

interface CreateSponsoredAdModalProps {
  onClose: () => void;
  onAdCreated: (newAd: SponsoredAd) => void;
}

export const CreateSponsoredAdModal: React.FC<CreateSponsoredAdModalProps> = ({
  onClose,
  onAdCreated,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Form states
  const [format, setFormat] = useState<'VERTICAL_VIDEO_FEED' | 'CATALOG_BANNER'>('VERTICAL_VIDEO_FEED');
  const [title, setTitle] = useState('');
  const [advertiserName, setAdvertiserName] = useState('');
  const [advertiserPhone, setAdvertiserPhone] = useState('+243 8');
  const [category, setCategory] = useState<AdCategory>('REAL_ESTATE_BOOST');
  const [tagline, setTagline] = useState('');
  const [description, setDescription] = useState('');
  const [ctaText, setCtaText] = useState('Discuter sur WhatsApp');
  const [ctaTarget, setCtaTarget] = useState('+243 8');
  const [mediaUrl, setMediaUrl] = useState('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4');
  const [thumbnailUrl, setThumbnailUrl] = useState('https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&auto=format&fit=crop&q=80');

  // Selected Tariff
  const [selectedPlan, setSelectedPlan] = useState<AdTariffPlan>(AD_TARIFFS[1]); // 7 days by default

  // Payment states (MaishaPay simulation)
  const [paymentProvider] = useState<'MAISHAPAY'>('MAISHAPAY');
  const [mobileOperator, setMobileOperator] = useState<'MPESA' | 'AIRTEL' | 'ORANGE' | 'AFRIMONEY' | 'CARD'>('MPESA');
  const [paymentPhone, setPaymentPhone] = useState('+243 81 000 0000');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [transactionRef, setTransactionRef] = useState('');

  const formatCDF = (num: number) => new Intl.NumberFormat('fr-CD').format(num);

  // Presets helper for fast testing
  const applyPreset = (type: 'SOLAR' | 'MOVERS' | 'LUXURY_APARTMENT') => {
    if (type === 'SOLAR') {
      setTitle('Kin-Solaire Énergie 24h/24');
      setAdvertiserName('Kin-Solaire RDC');
      setAdvertiserPhone('+243 81 999 4400');
      setCategory('SOLAR_ENERGY');
      setTagline('Batteries Lithium & Panneaux solaires pour villas et appartements');
      setDescription('Alimentation sans coupure SNEL. Devis gratuit et installation garantie 2 ans.');
      setCtaText('Demander un devis WhatsApp');
      setCtaTarget('+243819994400');
      setFormat('VERTICAL_VIDEO_FEED');
      setMediaUrl('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4');
      setThumbnailUrl('https://images.unsplash.com/photo-1509391365360-2e959784a276?w=800&auto=format&fit=crop&q=80');
    } else if (type === 'MOVERS') {
      setTitle('Kin-Déménagement Express & Soigné');
      setAdvertiserName('Trans-Kin Express');
      setAdvertiserPhone('+243 82 444 8899');
      setCategory('SERVICES_DEMENAGEMENT');
      setTagline('Déménagez sans casse entre Gombe, Ngaliema et Limete');
      setDescription('Camions capitonnés, monte-meubles et équipe formée. Facturation transparente en Francs Congolais.');
      setCtaText('Réserver un camion');
      setCtaTarget('+243824448899');
      setFormat('CATALOG_BANNER');
      setMediaUrl('https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=1200&auto=format&fit=crop&q=80');
      setThumbnailUrl('https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800&auto=format&fit=crop&q=80');
    } else {
      setTitle('Penthouse Présidentiel · Gombe Golf');
      setAdvertiserName('Immo-Prestige Kin');
      setAdvertiserPhone('+243 89 777 5533');
      setCategory('REAL_ESTATE_BOOST');
      setTagline('Mise en avant sponsorisée exclusive en tête de liste');
      setDescription('Magnifique duplex 4 chambres avec piscine privative et vue panoramique sur le fleuve Congo.');
      setCtaText('Contacter l\'agent dédié');
      setCtaTarget('+243897775533');
      setFormat('VERTICAL_VIDEO_FEED');
      setMediaUrl('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4');
      setThumbnailUrl('https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&auto=format&fit=crop&q=80');
    }
  };

  const handleProcessPayment = () => {
    setIsProcessingPayment(true);
    // Simulate MaishaPay Mobile Money push USSD transaction
    setTimeout(() => {
      const generatedRef = `MPAY-CDF-${Date.now().toString().slice(-6)}`;
      setTransactionRef(generatedRef);
      setIsProcessingPayment(false);
      setPaymentSuccess(true);

      const startsAt = new Date().toISOString();
      // Calculate exact expiration timestamp based on selected days
      const expiresAt = new Date(Date.now() + selectedPlan.durationDays * 24 * 60 * 60 * 1000).toISOString();

      const newAd: SponsoredAd = {
        id: `ad-${Date.now().toString().slice(-4)}`,
        title: title.trim() || 'Publicité Sponsorisée NZUBU',
        advertiserName: advertiserName.trim() || 'Partenaire Annonceur',
        advertiserPhone: advertiserPhone.trim() || '+243 81 000 0000',
        category,
        format,
        mediaUrl,
        thumbnailUrl,
        tagline: tagline.trim() || 'Offre sponsorisée certifiée',
        description: description.trim() || 'Découvrez cette offre exclusive partenaire.',
        ctaText: ctaText.trim() || 'Nous contacter',
        ctaActionType: 'WHATSAPP',
        ctaTarget: ctaTarget.trim() || '+243 81 000 0000',
        badgeLabel: 'Sponsorisé · Partenaire',
        pricePaidCdf: selectedPlan.priceCdf,
        paymentProvider: 'MAISHAPAY',
        durationDays: selectedPlan.durationDays,
        startsAt,
        expiresAt,
        status: 'ACTIVE',
        impressionsCount: 0,
        clicksCount: 0,
      };

      setTimeout(() => {
        onAdCreated(newAd);
        onClose();
      }, 1600);
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 sticky top-0 z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center shadow-lg shadow-rose-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white">
                  Régie Publicitaire & Boost NZUBU
                </h3>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 font-bold px-2 py-0.5 rounded border border-amber-500/30">
                  MaishaPay RDC
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Monétisez vos biens et services avec expiration automatique programmée.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Stepper Header */}
        <div className="grid grid-cols-3 border-b border-slate-800 text-center text-xs font-bold">
          <button 
            onClick={() => setStep(1)}
            className={`py-3 px-2 flex items-center justify-center gap-2 border-b-2 transition-colors ${
              step === 1 ? 'border-rose-500 text-white bg-slate-800/40' : 'border-transparent text-slate-400'
            }`}
          >
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === 1 ? 'bg-rose-500 text-white' : 'bg-slate-800 text-slate-400'}`}>1</span>
            <span>Contenu & Format</span>
          </button>
          <button 
            onClick={() => {
              if (title.trim()) setStep(2);
            }}
            className={`py-3 px-2 flex items-center justify-center gap-2 border-b-2 transition-colors ${
              step === 2 ? 'border-rose-500 text-white bg-slate-800/40' : 'border-transparent text-slate-400'
            }`}
          >
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === 2 ? 'bg-rose-500 text-white' : 'bg-slate-800 text-slate-400'}`}>2</span>
            <span>Validité & Tarifs</span>
          </button>
          <button 
            onClick={() => {
              if (title.trim()) setStep(3);
            }}
            className={`py-3 px-2 flex items-center justify-center gap-2 border-b-2 transition-colors ${
              step === 3 ? 'border-rose-500 text-white bg-slate-800/40' : 'border-transparent text-slate-400'
            }`}
          >
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === 3 ? 'bg-rose-500 text-white' : 'bg-slate-800 text-slate-400'}`}>3</span>
            <span>Paiement MaishaPay</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {step === 1 && (
            <div className="space-y-5">
              {/* Preset quick loaders */}
              <div className="p-3 bg-slate-950/70 rounded-2xl border border-slate-800">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                  Exemples rapides prêts à tester :
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => applyPreset('SOLAR')}
                    className="px-2.5 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20 text-xs font-semibold transition-colors"
                  >
                    ⚡ Kin-Solaire (Vidéo Feed)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('MOVERS')}
                    className="px-2.5 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/20 text-xs font-semibold transition-colors"
                  >
                    📦 Déménagement (Bannière Catalogue)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('LUXURY_APARTMENT')}
                    className="px-2.5 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20 text-xs font-semibold transition-colors"
                  >
                    💎 Penthouse Gombe (Boost Logement)
                  </button>
                </div>
              </div>

              {/* Format selection */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-2">
                  Format publicitaire souhaité :
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormat('VERTICAL_VIDEO_FEED')}
                    className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                      format === 'VERTICAL_VIDEO_FEED'
                        ? 'border-rose-500 bg-rose-500/10 ring-1 ring-rose-500'
                        : 'border-slate-800 bg-slate-950 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Video className="w-5 h-5 text-rose-400" />
                      <span className="text-xs font-black text-white">Vidéo Verticale (9:16)</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Affiché en plein écran directement intercalé dans le flux vidéo immersif TikTok de NZUBU.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormat('CATALOG_BANNER')}
                    className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                      format === 'CATALOG_BANNER'
                        ? 'border-rose-500 bg-rose-500/10 ring-1 ring-rose-500'
                        : 'border-slate-800 bg-slate-950 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <ImageIcon className="w-5 h-5 text-amber-400" />
                      <span className="text-xs font-black text-white">Bannière & Vitrine</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Carte sponsorisée épinglée en tête de catalogue et dans les recherches par commune.
                    </p>
                  </button>
                </div>
              </div>

              {/* Basic Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Titre de la campagne *
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex: Solution Solaire Hybride 24/7"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Nom de l'Annonceur / Entreprise *
                  </label>
                  <input
                    type="text"
                    required
                    value={advertiserName}
                    onChange={(e) => setAdvertiserName(e.target.value)}
                    placeholder="Ex: Kin-Solaire RDC"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Catégorie d'activité
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as AdCategory)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                  >
                    <option value="REAL_ESTATE_BOOST">Immobilier & Boost Logement</option>
                    <option value="SOLAR_ENERGY">Énergie Solaire & Groupe Électrogène</option>
                    <option value="SERVICES_DEMENAGEMENT">Déménagement & Transport</option>
                    <option value="DECORATION_FURNITURE">Mobilier & Décoration Intérieure</option>
                    <option value="SECURITY_AGENCY">Gardiennage & Sécurité Privée</option>
                    <option value="LOCAL_BUSINESS">Commerces & Services Kinshasa</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Numéro WhatsApp / Contact (Format Kinshasa) *
                  </label>
                  <input
                    type="tel"
                    required
                    value={ctaTarget}
                    onChange={(e) => {
                      setCtaTarget(e.target.value);
                      setAdvertiserPhone(e.target.value);
                    }}
                    placeholder="+243 81 999 4400"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Accroche percutante (Tagline)
                </label>
                <input
                  type="text"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  placeholder="Ex: Oubliez les coupures d'électricité à Gombe et Ngaliema"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Description & Offre détaillée
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Détaillez votre offre, vos garanties ou vos promotions en cours..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 resize-none"
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-start gap-3">
                <Clock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <span className="font-bold text-amber-300 block">
                    Garantie de suppression / masquage automatique
                  </span>
                  <p className="text-slate-300 mt-0.5">
                    Votre publicité sera active immédiatement après règlement MaishaPay et restera visible exactement pendant la durée allouée. Dès l'expiration de la validité, elle sera automatiquement retirée des flux sans démarche manuelle.
                  </p>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-3">
                  Choisissez la durée d'allocation :
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {AD_TARIFFS.map((plan) => {
                    const isSelected = selectedPlan.id === plan.id;
                    return (
                      <div
                        key={plan.id}
                        onClick={() => setSelectedPlan(plan)}
                        className={`p-4 rounded-2xl border cursor-pointer transition-all relative flex flex-col justify-between ${
                          isSelected
                            ? 'border-rose-500 bg-rose-500/10 ring-2 ring-rose-500/40 shadow-lg'
                            : 'border-slate-800 bg-slate-950 hover:border-slate-700'
                        }`}
                      >
                        {plan.popular && (
                          <span className="absolute -top-2.5 right-4 bg-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                            Recommandé
                          </span>
                        )}
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-black text-white">{plan.name}</span>
                            <span className="text-xs font-bold text-rose-400">
                              {plan.durationDays} Jours
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                            {plan.description}
                          </p>
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-baseline justify-between">
                          <div>
                            <span className="text-lg font-black text-white tabular-nums">
                              {formatCDF(plan.priceCdf)}
                            </span>
                            <span className="text-xs text-slate-400 ml-1">CDF</span>
                          </div>
                          {plan.savingsLabel && (
                            <span className="text-[10px] text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                              {plan.savingsLabel}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Simulation of dates */}
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-400">
                  <span>Activation immédiate :</span>
                  <span className="text-white font-mono font-semibold">
                    Aujourd'hui ({new Date().toLocaleDateString('fr-CD')})
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>Expiration automatique programmée :</span>
                  <span className="text-amber-400 font-mono font-semibold">
                    {new Date(Date.now() + selectedPlan.durationDays * 86400000).toLocaleDateString('fr-CD')} à {new Date().toLocaleTimeString('fr-CD', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-400 pt-2 border-t border-slate-800">
                  <span className="font-bold text-white">Montant total net :</span>
                  <span className="text-base font-black text-emerald-400 font-mono">
                    {formatCDF(selectedPlan.priceCdf)} CDF
                  </span>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              {/* Payment Summary */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-950 to-slate-900 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">
                    Campagne {selectedPlan.name} ({selectedPlan.durationDays} jours)
                  </span>
                  <div className="text-xl font-black text-white mt-0.5">
                    {formatCDF(selectedPlan.priceCdf)} CDF
                  </div>
                  <span className="text-[10px] text-emerald-400 flex items-center gap-1 mt-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Agrégation sécurisée MaishaPay RDC
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-slate-300">Format :</div>
                  <div className="text-xs text-rose-400 font-semibold">
                    {format === 'VERTICAL_VIDEO_FEED' ? 'Vidéo TikTok 9:16' : 'Bannière Catalogue'}
                  </div>
                </div>
              </div>

              {/* Operator choices */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-2">
                  Sélectionnez votre moyen de paiement Mobile Money ou Carte :
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setMobileOperator('MPESA')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      mobileOperator === 'MPESA'
                        ? 'border-rose-500 bg-rose-500/10 text-white font-bold ring-1 ring-rose-500'
                        : 'border-slate-800 bg-slate-950 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="text-xs font-black">Vodacom M-Pesa</div>
                    <div className="text-[10px] text-slate-400">Push USSD instantané</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMobileOperator('AIRTEL')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      mobileOperator === 'AIRTEL'
                        ? 'border-rose-500 bg-rose-500/10 text-white font-bold ring-1 ring-rose-500'
                        : 'border-slate-800 bg-slate-950 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="text-xs font-black">Airtel Money</div>
                    <div className="text-[10px] text-slate-400">Push direct RDC</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMobileOperator('ORANGE')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      mobileOperator === 'ORANGE'
                        ? 'border-rose-500 bg-rose-500/10 text-white font-bold ring-1 ring-rose-500'
                        : 'border-slate-800 bg-slate-950 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="text-xs font-black">Orange Money</div>
                    <div className="text-[10px] text-slate-400">Code secret #144#</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMobileOperator('AFRIMONEY')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      mobileOperator === 'AFRIMONEY'
                        ? 'border-rose-500 bg-rose-500/10 text-white font-bold ring-1 ring-rose-500'
                        : 'border-slate-800 bg-slate-950 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="text-xs font-black">Afrimoney</div>
                    <div className="text-[10px] text-slate-400">Africell RDC</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMobileOperator('CARD')}
                    className={`p-3 rounded-xl border text-left transition-all col-span-2 sm:col-span-2 ${
                      mobileOperator === 'CARD'
                        ? 'border-rose-500 bg-rose-500/10 text-white font-bold ring-1 ring-rose-500'
                        : 'border-slate-800 bg-slate-950 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="text-xs font-black flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Carte Bancaire (Visa / Mastercard)</span>
                    </div>
                    <div className="text-[10px] text-slate-400">Paiement en ligne sécurisé 3D Secure</div>
                  </button>
                </div>
              </div>

              {/* Phone input for Mobile Money */}
              {mobileOperator !== 'CARD' ? (
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Numéro de téléphone débité ({mobileOperator}) :
                  </label>
                  <div className="relative">
                    <Smartphone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      value={paymentPhone}
                      onChange={(e) => setPaymentPhone(e.target.value)}
                      placeholder="+243 81 234 5678"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 font-mono"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    Un prompt USSD de confirmation MaishaPay s'affichera directement sur votre téléphone pour saisir votre code PIN.
                  </p>
                </div>
              ) : (
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-2">
                  <div className="flex items-center gap-2 text-indigo-300 font-bold">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Passerelle MaishaPay Certifiée PCI-DSS</span>
                  </div>
                  <p className="text-slate-400 text-[11px]">
                    Vous serez redirigé vers l'interface de paiement bancaire sécurisée pour valider la transaction de {formatCDF(selectedPlan.priceCdf)} CDF.
                  </p>
                </div>
              )}

              {/* Status / processing feedback */}
              {isProcessingPayment && (
                <div className="p-4 bg-indigo-500/10 border border-indigo-500/30 rounded-2xl flex items-center gap-3 animate-pulse">
                  <Loader2 className="w-5 h-5 text-indigo-400 animate-spin shrink-0" />
                  <div className="text-xs">
                    <span className="font-bold text-indigo-300 block">
                      Envoi du Push USSD MaishaPay en cours...
                    </span>
                    <span className="text-slate-300">
                      Veuillez valider le débit de {formatCDF(selectedPlan.priceCdf)} CDF sur votre téléphone mobile.
                    </span>
                  </div>
                </div>
              )}

              {paymentSuccess && (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center gap-3 animate-fade-in">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                  <div className="text-xs">
                    <span className="font-bold text-emerald-300 block text-sm">
                      Paiement MaishaPay confirmé avec succès !
                    </span>
                    <span className="text-slate-300">
                      Réf: <strong className="font-mono text-white">{transactionRef}</strong>. La publicité est active et configurée pour s'expirer automatiquement dans {selectedPlan.durationDays} jours.
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between sticky bottom-0 z-10">
          {step > 1 ? (
            <button
              type="button"
              disabled={isProcessingPayment || paymentSuccess}
              onClick={() => setStep((prev) => (prev - 1) as 1 | 2)}
              className="px-4 py-2.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-xs font-bold text-slate-300 transition-colors disabled:opacity-50"
            >
              Précédent
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-xs font-bold text-slate-400 transition-colors"
            >
              Annuler
            </button>
          )}

          {step < 3 ? (
            <button
              type="button"
              disabled={!title.trim() || !advertiserName.trim()}
              onClick={() => setStep((prev) => (prev + 1) as 2 | 3)}
              className="px-5 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-rose-500/20 transition-all"
            >
              <span>Continuer</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              disabled={isProcessingPayment || paymentSuccess}
              onClick={handleProcessPayment}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all"
            >
              {isProcessingPayment ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Validation MaishaPay...</span>
                </>
              ) : paymentSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Activé !</span>
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4" />
                  <span>Payer {formatCDF(selectedPlan.priceCdf)} CDF via MaishaPay</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
