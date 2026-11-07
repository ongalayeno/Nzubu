import React, { useState, useEffect } from 'react';
import { 
  X, 
  QrCode, 
  Scan, 
  Zap, 
  CheckCircle2, 
  ShieldCheck, 
  Camera, 
  Flashlight, 
  RotateCcw,
  Sparkles,
  Info,
  Check
} from 'lucide-react';
import { MissionPhotoEvidence } from '../../types';

interface SnelQrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (scanData: {
    meterNumber: string;
    indexKwh: number;
    voltage: string;
    photoEvidence: MissionPhotoEvidence;
    notesAppendix: string;
  }) => void;
}

const DEMO_QR_PRESETS = [
  {
    title: 'Compteur SNEL Prépaié STS (Standard Kinshasa)',
    meterNumber: 'SNEL-STS-243-084920',
    indexKwh: 14820,
    voltage: '228V (Réseau Stable)',
    breakerType: 'Disjoncteur Bipolaire 32A + Différentiel 30mA',
    photoUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&auto=format&fit=crop&q=80',
    caption: 'Compteur SNEL STS n° 084920 (Index 14,820 kWh - QR Certifié)'
  },
  {
    title: 'Disjoncteur Différentiel & Inverseur Hybride Groupe',
    meterNumber: 'SCHNEIDER-INV-HYB-40A',
    indexKwh: 22150,
    voltage: '230V (Inverseur Auto OK)',
    breakerType: 'Inverseur Automatique Groupe / Réseau 40A',
    photoUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&auto=format&fit=crop&q=80',
    caption: 'Tableau Disjoncteur & Inverseur Groupe (QR Certifié)'
  }
];

export const SnelQrScannerModal: React.FC<SnelQrScannerModalProps> = ({
  isOpen,
  onClose,
  onScanSuccess
}) => {
  const [selectedPresetIndex, setSelectedPresetIndex] = useState(0);
  const [isScanning, setIsScanning] = useState(false);
  const [torchActive, setTorchActive] = useState(false);
  const [scannedResult, setScannedResult] = useState<typeof DEMO_QR_PRESETS[0] | null>(null);

  if (!isOpen) return null;

  const currentPreset = DEMO_QR_PRESETS[selectedPresetIndex];

  const handleTriggerScan = () => {
    setIsScanning(true);
    setScannedResult(null);

    // Simulate scanning laser and decoding
    setTimeout(() => {
      setIsScanning(false);
      setScannedResult(currentPreset);

      const now = new Date().toLocaleTimeString('fr-CD', { hour: '2-digit', minute: '2-digit' });
      const photoEvidence: MissionPhotoEvidence = {
        id: `qr-photo-${Date.now()}`,
        url: currentPreset.photoUrl,
        caption: currentPreset.caption,
        capturedAt: now
      };

      const notesAppendix = `[Scan QR SNEL officiel certifié le ${now}] Compteur n° ${currentPreset.meterNumber} | Index : ${currentPreset.indexKwh} kWh | Tension : ${currentPreset.voltage} | Disjoncteur : ${currentPreset.breakerType}`;

      onScanSuccess({
        meterNumber: currentPreset.meterNumber,
        indexKwh: currentPreset.indexKwh,
        voltage: currentPreset.voltage,
        photoEvidence,
        notesAppendix
      });
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col text-white">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-sm">
                  Scanner QR Compteur SNEL / Disjoncteur
                </h3>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 font-bold px-1.5 py-0.5 rounded border border-amber-500/30">
                  RDC
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Pointez la caméra vers l'étiquette QR apposée sur l'installation électrique.
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

        {/* Viewfinder simulator */}
        <div className="relative aspect-[4/3] bg-black flex flex-col items-center justify-center overflow-hidden">
          {/* Background simulated equipment */}
          <img
            src={currentPreset.photoUrl}
            alt="Compteur SNEL"
            className={`w-full h-full object-cover transition-all duration-300 ${
              isScanning ? 'brightness-75 scale-105' : 'brightness-50'
            }`}
          />

          {/* Scanner Overlay Box */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-6">
            <div className="w-56 h-56 sm:w-64 sm:h-64 border-2 border-amber-400/80 rounded-2xl relative shadow-[0_0_50px_rgba(245,158,11,0.2)]">
              {/* Corner targeting accents */}
              <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-amber-400 rounded-tl-lg" />
              <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-amber-400 rounded-tr-lg" />
              <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-amber-400 rounded-bl-lg" />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-amber-400 rounded-br-lg" />

              {/* Laser animation */}
              {isScanning && (
                <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent shadow-[0_0_15px_#f59e0b] animate-bounce" />
              )}

              {/* QR Mock code in the center */}
              <div className="absolute inset-0 flex items-center justify-center opacity-40">
                <QrCode className="w-28 h-28 text-white" />
              </div>

              {/* Status text */}
              <div className="absolute bottom-3 left-0 right-0 text-center">
                <span className="px-3 py-1 rounded-full bg-black/70 backdrop-blur-md text-[10px] font-mono text-amber-300 border border-amber-500/30">
                  {isScanning ? 'Décodage balise SNEL en cours...' : 'Aligner le QR code dans le cadre'}
                </span>
              </div>
            </div>
          </div>

          {/* Torch and controls bar */}
          <div className="absolute top-3 right-3 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setTorchActive(!torchActive)}
              className={`p-2 rounded-xl backdrop-blur-md border text-xs transition-colors ${
                torchActive 
                  ? 'bg-amber-500 text-slate-950 border-amber-400' 
                  : 'bg-black/60 text-white border-white/20 hover:bg-black/80'
              }`}
              title="Activer la torche pour armoire électrique sombre"
            >
              <Flashlight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Preset Selector */}
        <div className="p-4 bg-slate-950/60 border-t border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Installation à scanner
            </span>
            <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
              <Check className="w-3 h-3" />
              <span>Champs auto-validés</span>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {DEMO_QR_PRESETS.map((p, idx) => {
              const isSelected = selectedPresetIndex === idx;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setSelectedPresetIndex(idx);
                    setScannedResult(null);
                  }}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'bg-amber-500/20 border-amber-500 text-white'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="font-bold text-xs truncate">{p.title}</div>
                  <div className="text-[10px] font-mono text-amber-300/80 mt-0.5 truncate">
                    N° {p.meterNumber}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Scanned result card */}
          {scannedResult ? (
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs space-y-2 animate-fade-in">
              <div className="flex items-center gap-2 text-emerald-400 font-bold">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Balise QR décodée & certifiée avec succès !</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300 font-mono">
                <div>N° Compteur : <strong className="text-white">{scannedResult.meterNumber}</strong></div>
                <div>Index relevé : <strong className="text-white">{scannedResult.indexKwh} kWh</strong></div>
                <div>Tension : <strong className="text-white">{scannedResult.voltage}</strong></div>
                <div>Disjoncteur : <strong className="text-white">32A Différentiel OK</strong></div>
              </div>
              <div className="p-2 rounded-xl bg-slate-900/90 border border-emerald-500/20 text-[10px] text-emerald-300">
                ⚡ <strong>Actions appliquées :</strong> Points « Électricité & Réseau » et « Disjoncteur » cochés dans la checklist, et photo horodatée ajoutée aux preuves.
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-400 flex items-start gap-2">
              <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-[11px] leading-relaxed">
                Le scan lit instantanément la balise QR inviolable, vérifie la conformité de l'index et pré-remplit la photo de preuve pour le rapport d'inspection sans saisie manuelle.
              </p>
            </div>
          )}
        </div>

        {/* Action button */}
        <div className="p-4 border-t border-slate-800 flex justify-end gap-2 bg-slate-950/80">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors"
          >
            Fermer
          </button>

          {!scannedResult ? (
            <button
              type="button"
              disabled={isScanning}
              onClick={handleTriggerScan}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all disabled:opacity-60"
            >
              {isScanning ? (
                <>
                  <span className="w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                  <span>Analyse du QR code...</span>
                </>
              ) : (
                <>
                  <Scan className="w-4 h-4" />
                  <span>Scanner la balise QR SNEL</span>
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Valider & Revenir à la mission</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
