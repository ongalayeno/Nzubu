/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Send, 
  Mic, 
  Paperclip, 
  ShieldCheck, 
  AlertTriangle, 
  User, 
  Building2, 
  CheckCheck, 
  Sparkles,
  Volume2
} from 'lucide-react';
import { ChatMessage, PropertyListing } from '../../types';

interface SecureChatModalProps {
  listing: PropertyListing;
  isOpen?: boolean;
  onClose: () => void;
  currentUserRole?: 'CLIENT' | 'HOST' | 'AGENT';
  currentUserName?: string;
}

export const SecureChatModal: React.FC<SecureChatModalProps> = ({
  listing,
  isOpen = true,
  onClose,
  currentUserRole = 'CLIENT',
  currentUserName = 'Didier Kazadi (Voyageur)',
}) => {
  if (!isOpen) return null;
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-1',
      listingId: listing.id,
      listingTitle: listing.title,
      senderId: 'host-1',
      senderName: listing.partner.name,
      senderRole: 'HOST',
      text: `Bonjour ! Bienvenue sur la messagerie sécurisée NZUBU pour « ${listing.title} ». Comment puis-je vous renseigner sur le logement ?`,
      timestamp: '10:14',
    },
    {
      id: 'msg-2',
      listingId: listing.id,
      listingTitle: listing.title,
      senderId: 'system',
      senderName: 'Protection Anti-Fraude NZUBU',
      senderRole: 'AGENT',
      text: '🛡️ Rappel de sécurité : Tous les échanges sont protégés. Ne partagez aucun numéro personnel ou avance financière hors de la plateforme pour préserver votre garantie.',
      timestamp: '10:14',
    }
  ]);

  const [inputMessage, setInputMessage] = useState('');
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [voiceSeconds, setVoiceSeconds] = useState(0);
  const [showWarning, setShowWarning] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecordingVoice) {
      interval = setInterval(() => {
        setVoiceSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setVoiceSeconds(0);
    }
    return () => clearInterval(interval);
  }, [isRecordingVoice]);

  if (!isOpen) return null;

  // Anti-circumvention detection regex (Detects phone numbers, emails, external money transfers)
  const detectBypassAttempt = (text: string): boolean => {
    const phonePattern = /(?:\+?243|0)[0-9\s.-]{8,12}/;
    const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
    const directMoneyPattern = /(en\s*dehors|western\s*union|moneygram|sans\s*nzubu|cash\s*direct)/i;
    return phonePattern.test(text) || emailPattern.test(text) || directMoneyPattern.test(text);
  };

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputMessage.trim()) return;

    const isBypass = detectBypassAttempt(inputMessage);

    if (isBypass) {
      setShowWarning("⚠️ Détection Anti-Contournement : Les numéros de téléphone ou coordonnées directes sont masqués avant la validation officielle de la réservation pour vous protéger contre la fraude.");
    } else {
      setShowWarning(null);
    }

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      listingId: listing.id,
      listingTitle: listing.title,
      senderId: 'user-current',
      senderName: currentUserName,
      senderRole: currentUserRole,
      text: isBypass 
        ? inputMessage.replace(/(?:\+?243|0)[0-9\s.-]{8,12}/g, '[NUMÉRO MASQUÉ PAR NZUBU]')
        : inputMessage,
      timestamp: new Date().toLocaleTimeString('fr-CD', { hour: '2-digit', minute: '2-digit' }),
      hasBypassWarning: isBypass,
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputMessage('');

    // Simulated quick friendly reply from Host after 1.5s
    setTimeout(() => {
      const autoReplies = [
        "Merci pour votre message ! L'eau et le groupe de secours ont bien été testés et certifiés par l'agent NZUBU.",
        "Le logement est parfaitement prêt pour vos dates. Vous pouvez effectuer la réservation avec blocage 30 minutes garanti.",
        "Oui, les visites sont gratuites et accompagnées par un agent certifié NZUBU sur place."
      ];
      const randomReply = autoReplies[Math.floor(Math.random() * autoReplies.length)];

      const hostReply: ChatMessage = {
        id: `reply-${Date.now()}`,
        listingId: listing.id,
        listingTitle: listing.title,
        senderId: 'host-1',
        senderName: listing.partner.name,
        senderRole: 'HOST',
        text: randomReply,
        timestamp: new Date().toLocaleTimeString('fr-CD', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, hostReply]);
    }, 1200);
  };

  const handleSendVoiceMemo = () => {
    setIsRecordingVoice(false);
    const voiceMsg: ChatMessage = {
      id: `voice-${Date.now()}`,
      listingId: listing.id,
      listingTitle: listing.title,
      senderId: 'user-current',
      senderName: currentUserName,
      senderRole: currentUserRole,
      text: `🎤 Note vocale (${voiceSeconds || 4} sec)`,
      voiceMemoSeconds: voiceSeconds || 4,
      timestamp: new Date().toLocaleTimeString('fr-CD', { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, voiceMsg]);
  };

  const quickQuestions = [
    "L'eau coule-t-elle 24h/24 ?",
    "Le groupe démarre-t-il automatiquement ?",
    "Puis-je visiter avec un témoin ?",
    "La caution est-elle bien de 3 mois max ?"
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in select-none">
      <div 
        className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col h-[600px] max-h-[92vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-900/95 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/40 flex items-center justify-center font-bold">
                <Building2 className="w-5 h-5" />
              </div>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 absolute -bottom-0.5 -right-0.5 border-2 border-slate-900" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-bold text-white line-clamp-1">
                  {listing.partner.name}
                </h3>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300">
                  Hôte Certifié
                </span>
              </div>
              <p className="text-[11px] text-slate-400 line-clamp-1">
                {listing.title} ({listing.commune})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800 text-[10px] text-slate-300 border border-slate-700">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Chiffré</span>
            </span>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Anti-Circumvention Warning Notification */}
        {showWarning && (
          <div className="p-3 bg-amber-500/15 border-b border-amber-500/30 text-amber-200 text-xs flex items-start gap-2 animate-fade-in">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="flex-1 text-[11px] leading-tight">
              {showWarning}
            </div>
            <button onClick={() => setShowWarning(null)} className="text-amber-400 text-xs font-bold">
              ×
            </button>
          </div>
        )}

        {/* Message Thread */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-950/60 text-xs">
          {messages.map((m) => {
            const isMe = m.senderRole === currentUserRole;
            const isSystem = m.senderId === 'system';

            if (isSystem) {
              return (
                <div key={m.id} className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-[11px] text-slate-400 text-center mx-auto max-w-sm">
                  {m.text}
                </div>
              );
            }

            return (
              <div
                key={m.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mb-0.5">
                  <span className="font-semibold">{m.senderName}</span>
                  <span>·</span>
                  <span>{m.timestamp}</span>
                </div>

                <div
                  className={`p-3 rounded-2xl max-w-[82%] leading-relaxed ${
                    isMe
                      ? 'bg-rose-600 text-white rounded-tr-none'
                      : 'bg-slate-800 border border-slate-700/80 text-slate-200 rounded-tl-none'
                  }`}
                >
                  {m.voiceMemoSeconds ? (
                    <div className="flex items-center gap-2 font-mono text-xs">
                      <Volume2 className="w-4 h-4 animate-pulse" />
                      <span>Note vocale ({m.voiceMemoSeconds}s)</span>
                    </div>
                  ) : (
                    <div>{m.text}</div>
                  )}

                  {m.hasBypassWarning && (
                    <div className="mt-1 pt-1 border-t border-rose-400/30 text-[9px] text-amber-200 flex items-center gap-1">
                      <AlertTriangle className="w-2.5 h-2.5" />
                      <span>Coordonnées masquées pour votre sécurité</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Question Chips */}
        <div className="px-3 py-2 bg-slate-900 border-t border-slate-800/80 overflow-x-auto flex items-center gap-1.5 no-scrollbar">
          {quickQuestions.map((q, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setInputMessage(q);
              }}
              className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-300 font-medium whitespace-nowrap transition-colors border border-slate-700/60"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSendMessage} className="p-3 bg-slate-900 border-t border-slate-800 flex items-center gap-2">
          {isRecordingVoice ? (
            <div className="flex-1 flex items-center justify-between px-3 py-2 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs">
              <span className="flex items-center gap-2 font-mono animate-pulse">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                Enregistrement vocal : {voiceSeconds}s
              </span>
              <button
                type="button"
                onClick={handleSendVoiceMemo}
                className="px-3 py-1 rounded-lg bg-rose-500 text-white font-bold text-xs"
              >
                Envoyer le vocal
              </button>
            </div>
          ) : (
            <div className="flex-1 relative">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Posez votre question à l'hôte (eau, groupe, accès)..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-rose-500 font-sans"
              />
            </div>
          )}

          {!isRecordingVoice && (
            <button
              type="button"
              onClick={() => setIsRecordingVoice(true)}
              className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors shrink-0"
              title="Enregistrer un vocal"
            >
              <Mic className="w-4 h-4" />
            </button>
          )}

          <button
            type="submit"
            disabled={!inputMessage.trim()}
            className="w-9 h-9 rounded-xl bg-rose-500 hover:bg-rose-600 disabled:opacity-40 text-white flex items-center justify-center shadow-md shadow-rose-500/20 transition-all shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
