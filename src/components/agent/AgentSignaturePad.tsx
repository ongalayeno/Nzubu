/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, useEffect } from 'react';
import { 
  PenTool, 
  RotateCcw, 
  CheckCircle2, 
  ShieldCheck, 
  User, 
  Calendar, 
  LocateFixed,
  FileSignature,
  Lock
} from 'lucide-react';
import { AgentSignature, GpsCoordinates } from '../../types';

interface AgentSignaturePadProps {
  agentName: string;
  agentId: string;
  gpsCoordinates?: GpsCoordinates;
  initialSignature?: AgentSignature;
  onSaveSignature: (signature: AgentSignature) => void;
}

export const AgentSignaturePad: React.FC<AgentSignaturePadProps> = ({
  agentName,
  agentId,
  gpsCoordinates,
  initialSignature,
  onSaveSignature,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  // Witness / Host fields
  const [witnessName, setWitnessName] = useState(initialSignature?.witnessName || '');
  const [witnessRole, setWitnessRole] = useState<'OWNER' | 'MANDATAIRE' | 'SECURITY_GUARD' | 'PROPERTY_MANAGER'>(
    initialSignature?.witnessRole || 'OWNER'
  );

  const [sealedSignature, setSealedSignature] = useState<AgentSignature | null>(initialSignature || null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set high DPI scaling
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    ctx.scale(2, 2);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#38bdf8'; // Sky blue ink for clear visibility on dark theme

    // If pre-existing signature dataUrl exists, draw it
    if (initialSignature?.agentSignatureDataUrl) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, rect.width, rect.height);
        setHasDrawn(true);
      };
      img.src = initialSignature.agentSignatureDataUrl;
    }
  }, [initialSignature]);

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e && e.touches.length > 0) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    } else if ('clientX' in e) {
      return {
        x: (e as React.MouseEvent).clientX - rect.left,
        y: (e as React.MouseEvent).clientY - rect.top,
      };
    }
    return { x: 0, y: 0 };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (sealedSignature) return; // Locked once sealed
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e, canvas);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasDrawn(true);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || sealedSignature) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e, canvas);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    if (sealedSignature) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);
    setHasDrawn(false);
  };

  const handleSealSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasDrawn) return;

    const signatureDataUrl = canvas.toDataURL('image/png');
    const now = new Date().toISOString();

    const newSig: AgentSignature = {
      agentSignatureDataUrl: signatureDataUrl,
      agentSignedAt: now,
      witnessName: witnessName.trim() || undefined,
      witnessRole,
      witnessSignedAt: witnessName.trim() ? now : undefined,
    };

    setSealedSignature(newSig);
    onSaveSignature(newSig);
  };

  const handleUnlockToEdit = () => {
    setSealedSignature(null);
  };

  return (
    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileSignature className="w-5 h-5 text-sky-600 dark:text-sky-400" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
            Émargement & Signature Tactile de Mission
          </h4>
        </div>
        {sealedSignature ? (
          <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 flex items-center gap-1">
            <Lock className="w-3 h-3" />
            Signature Scellée
          </span>
        ) : (
          <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
            Requis pour validation finale
          </span>
        )}
      </div>

      <p className="text-[11px] text-slate-600 dark:text-slate-400">
        L'agent d'inspection certifie sur l'honneur l'exactitude des constatations matérielles (eau, SNEL, disjoncteur, conformité du bail en Francs Congolais).
      </p>

      {/* Canvas Area (kept slate-900 so sky-blue ink stays high-contrast across both themes) */}
      <div className="relative">
        <div className="w-full h-36 bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl overflow-hidden touch-none relative cursor-crosshair">
          <canvas
            ref={canvasRef}
            className="w-full h-full block"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
          />

          {!hasDrawn && !sealedSignature && (
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-slate-400 text-xs">
              <PenTool className="w-6 h-6 mb-1 text-slate-500" />
              <span>Tracez votre signature au doigt ou au stylet ici</span>
            </div>
          )}

          {/* Watermark / Agent Stamp in background */}
          <div className="absolute bottom-2 left-3 pointer-events-none text-[10px] text-slate-400 font-mono">
            Agent: {agentName} ({agentId})
            {gpsCoordinates && ` · GPS: ${gpsCoordinates.latitude.toFixed(4)}, ${gpsCoordinates.longitude.toFixed(4)}`}
          </div>
        </div>

        {/* Clear / Reset button if not sealed */}
        {!sealedSignature && hasDrawn && (
          <button
            type="button"
            onClick={clearCanvas}
            className="absolute top-2 right-2 px-2 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-[10px] font-semibold flex items-center gap-1 backdrop-blur-sm border border-slate-600"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Effacer</span>
          </button>
        )}
      </div>

      {/* Witness / Host Info (optional but recommended) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        <div>
          <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
            Bailleur ou témoin présent sur site :
          </label>
          <input
            type="text"
            disabled={!!sealedSignature}
            value={witnessName}
            onChange={(e) => setWitnessName(e.target.value)}
            placeholder="Nom complet du bailleur / mandataire"
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-sky-500 disabled:opacity-50"
          />
        </div>

        <div>
          <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
            Qualité du signataire présent :
          </label>
          <select
            disabled={!!sealedSignature}
            value={witnessRole}
            onChange={(e) => setWitnessRole(e.target.value as any)}
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-sky-500 disabled:opacity-50"
          >
            <option value="OWNER">Propriétaire du bien</option>
            <option value="MANDATAIRE">Mandataire / Commissionnaire officiel</option>
            <option value="PROPERTY_MANAGER">Gestionnaire immobilier</option>
            <option value="SECURITY_GUARD">Gardien chef de concession</option>
          </select>
        </div>
      </div>

      {/* Seal or Edit Action Button */}
      <div className="pt-2 flex items-center justify-between">
        {sealedSignature ? (
          <div className="flex items-center justify-between w-full">
            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>Scellé le {new Date(sealedSignature.agentSignedAt).toLocaleTimeString('fr-CD')}</span>
            </div>
            <button
              type="button"
              onClick={handleUnlockToEdit}
              className="px-3 py-1 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-[10px] text-slate-700 dark:text-slate-300 font-semibold"
            >
              Modifier la signature
            </button>
          </div>
        ) : (
          <button
            type="button"
            disabled={!hasDrawn}
            onClick={handleSealSignature}
            className="w-full py-2.5 rounded-xl bg-sky-600 dark:bg-sky-500 hover:bg-sky-500 dark:hover:bg-sky-600 disabled:opacity-40 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-sky-500/20 transition-all"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Valider et Sceller l'émargement de la mission</span>
          </button>
        )}
      </div>
    </div>
  );
};
