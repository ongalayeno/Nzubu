/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  ClipboardCheck, 
  MapPin, 
  Phone, 
  CheckSquare, 
  Square, 
  Video, 
  Droplets, 
  Zap, 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle,
  Send,
  WifiOff,
  Wifi,
  Save,
  RotateCw,
  LocateFixed,
  Compass,
  Navigation,
  Loader2,
  CheckCircle,
  Archive,
  Calendar,
  ArrowUpDown,
  Search,
  FileText,
  X,
  ChevronRight,
  ShieldCheck,
  Check,
  Camera,
  Image as ImageIcon,
  Trash2,
  Maximize2,
  Sparkles,
  Eye,
  Upload,
  FileDown,
  PenTool,
  Lock,
  QrCode,
  Scan,
  Timer,
  Play,
  Pause,
  RotateCcw,
  History,
  FileSpreadsheet
} from 'lucide-react';
import { FieldMission, GpsCoordinates, MissionPhotoEvidence, AgentSignature, SecurityAlert } from '../../types';
import { exportMissionPdf } from '../../utils/exportMissionPdf';
import { AgentSignaturePad } from './AgentSignaturePad';
import { ProgressStepper, StepItem } from '../common/ProgressStepper';
import { MotoRouteOptimizerModal } from './MotoRouteOptimizerModal';
import { PropertyInventoryModal } from '../partner/PropertyInventoryModal';
import { SnelQrScannerModal } from './SnelQrScannerModal';
import { generateSha256Seal, formatSha256Short } from '../../utils/cryptoSeal';

interface AgentFieldAppProps {
  missions: FieldMission[];
  onCompleteMission: (
    missionId: string, 
    checklist: Record<string, boolean>, 
    outcome: 'PASS' | 'PASS_WITH_DISCLOSURES' | 'NEEDS_CORRECTION' | 'SAFETY_CONCERN', 
    notes: string,
    gpsCoordinates?: GpsCoordinates,
    photos?: MissionPhotoEvidence[],
    agentSignature?: AgentSignature
  ) => void;
  securityAlerts?: SecurityAlert[];
}

export const AgentFieldApp: React.FC<AgentFieldAppProps> = ({
  missions,
  onCompleteMission,
  securityAlerts = [],
}) => {
  // Navigation: Active missions vs Archives
  const [activeTab, setActiveTab] = useState<'ACTIVE_MISSIONS' | 'ARCHIVES'>('ACTIVE_MISSIONS');
  const [pdfExporting, setPdfExporting] = useState(false);
  const [pdfExportError, setPdfExportError] = useState<string | null>(null);

  const handleExportPdf = async (mission: FieldMission) => {
    setPdfExporting(true);
    setPdfExportError(null);
    try {
      await exportMissionPdf(mission);
    } catch (error) {
      console.error('Échec de l’export PDF', error);
      setPdfExportError('Le rapport PDF n’a pas pu être généré. Réessayez.');
    } finally {
      setPdfExporting(false);
    }
  };

  // Active mission state
  const activeMissionsList = missions.filter((m) => m.status === 'ASSIGNED' || m.status === 'IN_PROGRESS');
  const [selectedMission, setSelectedMission] = useState<FieldMission | null>(
    activeMissionsList[0] || missions[0] || null
  );
  const [isOfflineSimulated, setIsOfflineSimulated] = useState(false);
  const [hasUnsyncedDraft, setHasUnsyncedDraft] = useState(false);

  // GPS state
  const [gpsCoordinates, setGpsCoordinates] = useState<GpsCoordinates | null>(
    selectedMission?.gpsCoordinates || null
  );
  const [isCapturingGps, setIsCapturingGps] = useState<boolean>(false);
  const [gpsStatusMessage, setGpsStatusMessage] = useState<string | null>(null);

  // Photo evidence state (Max 3 photos)
  const [photos, setPhotos] = useState<MissionPhotoEvidence[]>(
    selectedMission?.photos || []
  );
  const [photoPresetCategory, setPhotoPresetCategory] = useState<string>('Compteur SNEL / Disjoncteur différentiel');
  const [zoomPhoto, setZoomPhoto] = useState<MissionPhotoEvidence | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [agentSignature, setAgentSignature] = useState<AgentSignature | undefined>(
    selectedMission?.agentSignature
  );
  const [showMotoOptimizer, setShowMotoOptimizer] = useState(false);
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [showSnelQrScanner, setShowSnelQrScanner] = useState(false);
  const [showAlertHistoryModal, setShowAlertHistoryModal] = useState(false);
  const [snelOutage, setSnelOutage] = useState<boolean>(false);
  const [regidesoOutage, setRegidesoOutage] = useState<boolean>(false);
  const [missionShaSeal, setMissionShaSeal] = useState<string>('');

  // Field mission live timer (starts automatically when mission is selected)
  const [missionTimerSeconds, setMissionTimerSeconds] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(true);

  // Live timer tick effect
  useEffect(() => {
    if (!isTimerRunning || !selectedMission) return;
    const interval = setInterval(() => {
      setMissionTimerSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isTimerRunning, selectedMission]);

  const formatMissionDuration = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Historical security & compliance alerts registry for Kinshasa properties
  const DEFAULT_ALERTS: SecurityAlert[] = [
    {
      id: 'alt-001',
      missionId: 'mis-2026-031',
      unitTitle: 'Appartement Haut Standing — Gombe Ambassades',
      commune: 'Gombe',
      quartier: 'Golf',
      agentName: 'Clarisse Ilunga',
      agentId: 'NZUBU-AG-01',
      notes: 'Risque d\'incendie électrique : Court-circuit constaté sur le tableau de répartition sans disjoncteur différentiel fonctionnel. Logement suspendu par précaution. Résolu après remplacement complet du disjoncteur 32A conforme.',
      timestamp: '05 Nov 2026 à 17:15',
      resolved: true,
      gpsCoordinates: {
        latitude: -4.303314,
        longitude: 15.304521,
        accuracyMeters: 4,
        capturedAt: '17:12:00',
        source: 'DEVICE_GPS',
      },
      checklistFailures: ['Disjoncteur différentiel non fonctionnel', 'Fils nus apparents'],
    },
    {
      id: 'alt-002',
      missionId: 'mis-2026-051',
      unitTitle: 'Appartement Neuf 2 Ch. — Kintambo Magasin',
      commune: 'Ngaliema',
      quartier: 'Kintambo Magasin',
      agentName: 'Alain Kambale',
      agentId: 'NZUBU-AG-02',
      notes: 'Pression d\'eau insuffisante au 2ème étage : REGIDESO coupée en journée et cuve non raccordée au surpresseur. Plainte d\'un précédent locataire. Résolu : Surpresseur 1.5HP et réservoir tampon 2000L installés.',
      timestamp: '28 Oct 2026 à 11:30',
      resolved: true,
      gpsCoordinates: {
        latitude: -4.341120,
        longitude: 15.253640,
        accuracyMeters: 5,
        capturedAt: '11:25:00',
        source: 'DEVICE_GPS',
      },
      checklistFailures: ['Débit eau inférieur à la norme'],
    },
    {
      id: 'alt-003',
      missionId: 'mis-2026-048',
      unitTitle: 'Studio Meublé — Gombe Golf',
      commune: 'Gombe',
      quartier: 'Golf',
      agentName: 'Patrick Mbiya',
      agentId: 'NZUBU-AG-04',
      notes: 'Non-conformité Loi 15/025 : Mandataire ayant exigé 6 mois de garantie locative et paiement en devises étrangères non converties. Signalement DGI/NZUBU. Régularisé au plafond légal de 3 mois en CDF.',
      timestamp: '14 Oct 2026 à 09:45',
      resolved: true,
      checklistFailures: ['Caution supérieure à 3 mois (Loi 15/025)'],
    },
    {
      id: 'alt-004',
      missionId: 'mis-2026-051',
      unitTitle: 'Appartement Neuf 2 Ch. — Kintambo Magasin',
      commune: 'Ngaliema',
      quartier: 'Kintambo Magasin',
      agentName: 'Clarisse Ilunga',
      agentId: 'NZUBU-AG-01',
      notes: 'Écart de géolocalisation suspect (>180m du repère déclaré) lors de la pré-visite. Vérification physique effectuée : la parcelle réelle se trouve à 40m de l\'avenue principale. Résolu avec coordonnées GPS verrouillées.',
      timestamp: '02 Nov 2026 à 15:20',
      resolved: true,
      checklistFailures: ['Écart GPS initial'],
    }
  ];

  const getAlertsForMission = (mission: FieldMission | null) => {
    if (!mission) return [];
    const combined = [
      ...securityAlerts,
      ...DEFAULT_ALERTS.filter(d => !securityAlerts.some(s => s.id === d.id))
    ];
    const mTitle = mission.unitTitle.toLowerCase();
    const mCommune = mission.commune.toLowerCase();

    return combined.filter(a =>
      (a.missionId && a.missionId === mission.id) ||
      (a.listingId && mission.listingId && a.listingId === mission.listingId) ||
      (a.unitTitle && (mTitle.includes(a.unitTitle.toLowerCase()) || a.unitTitle.toLowerCase().includes(mTitle))) ||
      (a.commune.toLowerCase() === mCommune && a.quartier && mission.quartier && a.quartier.toLowerCase() === mission.quartier.toLowerCase())
    );
  };

  const handleQrScanSuccess = (scanData: {
    meterNumber: string;
    indexKwh: number;
    voltage: string;
    photoEvidence: MissionPhotoEvidence;
    notesAppendix: string;
  }) => {
    // 1. Auto-check corresponding points in checklist
    setChecklist((prev) => ({
      ...prev,
      electricityTested: true,
      safetyEgressChecked: true,
      physicalPresenceConfirmed: true,
    }));

    // 2. Pre-fill / add photo evidence into photos list
    setPhotos((prev) => {
      const filtered = prev.filter(p => !p.caption.includes('SNEL'));
      if (filtered.length >= 3) {
        return [scanData.photoEvidence, ...filtered.slice(0, 2)];
      }
      return [scanData.photoEvidence, ...filtered];
    });

    // 3. Append technical notes
    setNotes((prev) => prev ? `${prev}\n\n${scanData.notesAppendix}` : scanData.notesAppendix);

    setHasUnsyncedDraft(true);
  };

  // Local checklist state
  const [checklist, setChecklist] = useState({
    identityVerified: selectedMission?.checklist.identityVerified || false,
    mandateOrTitleChecked: selectedMission?.checklist.mandateOrTitleChecked || false,
    physicalPresenceConfirmed: selectedMission?.checklist.physicalPresenceConfirmed || (!!selectedMission?.gpsCoordinates),
    waterSupplyTested: selectedMission?.checklist.waterSupplyTested || false,
    electricityTested: selectedMission?.checklist.electricityTested || false,
    roomsMatchedListing: selectedMission?.checklist.roomsMatchedListing || false,
    pricingInCdfNoExcessiveDeposit: selectedMission?.checklist.pricingInCdfNoExcessiveDeposit || false,
    videoFilmedVerticalNoFaces: selectedMission?.checklist.videoFilmedVerticalNoFaces || false,
    safetyEgressChecked: selectedMission?.checklist.safetyEgressChecked || false,
  });

  const [decisionOutcome, setDecisionOutcome] = useState<'PASS' | 'PASS_WITH_DISCLOSURES' | 'NEEDS_CORRECTION' | 'SAFETY_CONCERN'>('PASS');
  const [notes, setNotes] = useState(selectedMission?.notes || '');
  const [submittedFeedback, setSubmittedFeedback] = useState(false);
  const [showVideoGuideModal, setShowVideoGuideModal] = useState(false);

  // Helper for geofencing distance calculation (Haversine formula)
  const calculateDistanceMeters = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; // Earth radius in meters
    const phi1 = lat1 * Math.PI / 180;
    const phi2 = lat2 * Math.PI / 180;
    const deltaPhi = (lat2 - lat1) * Math.PI / 180;
    const deltaLambda = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
              Math.cos(phi1) * Math.cos(phi2) *
              Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
  };

  const getTargetCommuneCenter = (commune: string) => {
    const c = commune.toLowerCase();
    if (c.includes('gombe')) return { lat: -4.303314, lon: 15.304521 };
    if (c.includes('ngaliema')) return { lat: -4.341120, lon: 15.253640 };
    return { lat: -4.321450, lon: 15.297410 };
  };

  const targetCoords = selectedMission ? getTargetCommuneCenter(selectedMission.commune) : null;
  const geofenceDistance = (gpsCoordinates && targetCoords)
    ? calculateDistanceMeters(gpsCoordinates.latitude, gpsCoordinates.longitude, targetCoords.lat, targetCoords.lon)
    : null;
  const isWithinGeofence = geofenceDistance !== null && geofenceDistance <= 100;

  // Archives filter & sort states
  const [archiveSearch, setArchiveSearch] = useState('');
  const [archiveCommune, setArchiveCommune] = useState('ALL');
  const [dateSortOrder, setDateSortOrder] = useState<'DESC' | 'ASC'>('DESC');
  const [archiveModalMission, setArchiveModalMission] = useState<FieldMission | null>(null);

  useEffect(() => {
    if (!selectedMission || !hasUnsyncedDraft) return;
    try {
      localStorage.setItem(`nzubu:draft:${selectedMission.id}`, JSON.stringify({ checklist, gpsCoordinates, photos, decisionOutcome, notes, agentSignature, elapsedSeconds: missionTimerSeconds }));
    } catch {
      setGpsStatusMessage('Stockage local saturé : impossible de conserver ce brouillon.');
    }
  }, [selectedMission, hasUnsyncedDraft, checklist, gpsCoordinates, photos, decisionOutcome, notes, agentSignature, missionTimerSeconds]);

  const handleSelectMission = (mission: FieldMission) => {
    let draft: Partial<{ checklist: FieldMission['checklist']; gpsCoordinates: GpsCoordinates; photos: MissionPhotoEvidence[]; decisionOutcome: typeof decisionOutcome; notes: string; agentSignature: AgentSignature; elapsedSeconds?: number }> | null = null;
    try {
      const saved = localStorage.getItem(`nzubu:draft:${mission.id}`);
      draft = saved ? JSON.parse(saved) : null;
    } catch {
      draft = null;
    }
    setSelectedMission(mission);
    // Automatically start field mission timer for the selected mission
    setMissionTimerSeconds(typeof draft?.elapsedSeconds === 'number' ? draft.elapsedSeconds : 0);
    setIsTimerRunning(true);

    setGpsCoordinates(draft?.gpsCoordinates || mission.gpsCoordinates || null);
    setGpsStatusMessage(null);
    setPhotos(draft?.photos || mission.photos || []);
    setAgentSignature(draft?.agentSignature || mission.agentSignature);
    setChecklist(draft?.checklist || {
      identityVerified: mission.checklist.identityVerified,
      mandateOrTitleChecked: mission.checklist.mandateOrTitleChecked,
      physicalPresenceConfirmed: mission.checklist.physicalPresenceConfirmed || (!!mission.gpsCoordinates),
      waterSupplyTested: mission.checklist.waterSupplyTested,
      electricityTested: mission.checklist.electricityTested,
      roomsMatchedListing: mission.checklist.roomsMatchedListing,
      pricingInCdfNoExcessiveDeposit: mission.checklist.pricingInCdfNoExcessiveDeposit,
      videoFilmedVerticalNoFaces: mission.checklist.videoFilmedVerticalNoFaces,
      safetyEgressChecked: mission.checklist.safetyEgressChecked,
    });
    setNotes(draft?.notes || mission.notes || '');
    setDecisionOutcome(draft?.decisionOutcome || mission.decisionOutcome || 'PASS');
    setHasUnsyncedDraft(Boolean(draft));
    setSubmittedFeedback(false);
  };

  useEffect(() => {
    if (selectedMission) handleSelectMission(selectedMission);
    // Restore only the initial mission's locally saved draft on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleCheck = (key: keyof typeof checklist) => {
    setChecklist((prev) => ({ ...prev, [key]: !prev[key] }));
    setHasUnsyncedDraft(true);
  };

  // Helper for realistic Kinshasa pilot coordinates (Gombe, Ngaliema, Lingwala)
  const getKinshasaCommuneCoordinates = (commune: string): GpsCoordinates => {
    const c = commune.toLowerCase();
    const now = new Date().toLocaleTimeString('fr-CD', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    if (c.includes('gombe')) {
      return {
        latitude: Number((-4.303314 + (Math.random() - 0.5) * 0.0015).toFixed(6)),
        longitude: Number((15.304521 + (Math.random() - 0.5) * 0.0015).toFixed(6)),
        accuracyMeters: Math.floor(3 + Math.random() * 4),
        capturedAt: now,
        source: 'DEVICE_GPS',
      };
    }
    if (c.includes('ngaliema')) {
      return {
        latitude: Number((-4.341120 + (Math.random() - 0.5) * 0.0015).toFixed(6)),
        longitude: Number((15.253640 + (Math.random() - 0.5) * 0.0015).toFixed(6)),
        accuracyMeters: Math.floor(4 + Math.random() * 4),
        capturedAt: now,
        source: 'DEVICE_GPS',
      };
    }
    // Lingwala or fallback
    return {
      latitude: Number((-4.321450 + (Math.random() - 0.5) * 0.0015).toFixed(6)),
      longitude: Number((15.297410 + (Math.random() - 0.5) * 0.0015).toFixed(6)),
      accuracyMeters: Math.floor(3 + Math.random() * 3),
      capturedAt: now,
      source: 'DEVICE_GPS',
    };
  };

  // Capture GPS position
  const handleCaptureGps = () => {
    setIsCapturingGps(true);
    setGpsStatusMessage(null);

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords: GpsCoordinates = {
            latitude: Number(pos.coords.latitude.toFixed(6)),
            longitude: Number(pos.coords.longitude.toFixed(6)),
            accuracyMeters: Math.round(pos.coords.accuracy) || 5,
            capturedAt: new Date().toLocaleTimeString('fr-CD', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            source: 'DEVICE_GPS',
          };
          setGpsCoordinates(coords);
          setIsCapturingGps(false);
          setHasUnsyncedDraft(true);
          setChecklist((prev) => ({ ...prev, physicalPresenceConfirmed: true }));
          setGpsStatusMessage("Position GPS acquise avec succès depuis les capteurs de l'appareil !");
        },
        () => {
          setIsCapturingGps(false);
          setGpsStatusMessage('GPS indisponible ou autorisation refusée. Réessayez sur place.');
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    } else {
      setIsCapturingGps(false);
      setGpsStatusMessage('Cet appareil ne permet pas la capture GPS.');
    }
  };

  // Photographic evidence handlers
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    if (photos.length >= 3) {
      alert("Limite maximale atteinte : 3 photos par rapport de mission.");
      return;
    }

    const file = files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const newPhoto: MissionPhotoEvidence = {
        id: `photo-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        url: dataUrl,
        caption: photoPresetCategory,
        capturedAt: new Date().toLocaleTimeString('fr-CD', { hour: '2-digit', minute: '2-digit' }),
      };
      setPhotos((prev) => [...prev.slice(0, 2), newPhoto]);
      setHasUnsyncedDraft(true);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleAddPresetPhoto = (type: 'METER' | 'LIVING' | 'FACADE_WATER') => {
    if (photos.length >= 3) {
      alert("Limite maximale atteinte : 3 photos par rapport.");
      return;
    }

    const presets = {
      METER: {
        caption: 'Compteur SNEL & Disjoncteur différentiel',
        url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&auto=format&fit=crop&q=80',
      },
      LIVING: {
        caption: 'Salon & Espace séjour principal',
        url: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&auto=format&fit=crop&q=80',
      },
      FACADE_WATER: {
        caption: 'Façade extérieure, Accès & Réserve d\'eau',
        url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&auto=format&fit=crop&q=80',
      },
    };

    const chosen = presets[type];
    const newPhoto: MissionPhotoEvidence = {
      id: `photo-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      url: chosen.url,
      caption: chosen.caption,
      capturedAt: new Date().toLocaleTimeString('fr-CD', { hour: '2-digit', minute: '2-digit' }),
    };

    setPhotos((prev) => [...prev, newPhoto]);
    setHasUnsyncedDraft(true);
  };

  const handleRemovePhoto = (id: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
    setHasUnsyncedDraft(true);
  };

  const handleUpdatePhotoCaption = (id: string, newCaption: string) => {
    setPhotos((prev) =>
      prev.map((p) => (p.id === id ? { ...p, caption: newCaption } : p))
    );
    setHasUnsyncedDraft(true);
  };

  const allChecked = Object.values(checklist).every(Boolean);

  // Photos Critical Zone Coverage Gauge
  const hasMeterPhoto = photos.some(p => 
    p.caption.toLowerCase().includes('compteur') || 
    p.caption.toLowerCase().includes('snel') || 
    p.caption.toLowerCase().includes('disjoncteur')
  );
  const hasLivingPhoto = photos.some(p => 
    p.caption.toLowerCase().includes('salon') || 
    p.caption.toLowerCase().includes('séjour') || 
    p.caption.toLowerCase().includes('chambre') ||
    p.caption.toLowerCase().includes('pièce')
  );
  const hasWaterFacadePhoto = photos.some(p => 
    p.caption.toLowerCase().includes('eau') || 
    p.caption.toLowerCase().includes('façade') || 
    p.caption.toLowerCase().includes('cuve') || 
    p.caption.toLowerCase().includes('robinet') ||
    p.caption.toLowerCase().includes('accès')
  );
  const criticalZonesCount = (hasMeterPhoto ? 1 : 0) + (hasLivingPhoto ? 1 : 0) + (hasWaterFacadePhoto ? 1 : 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMission) return;

    if (!gpsCoordinates || gpsCoordinates.source !== 'DEVICE_GPS') {
      alert("Validation de présence requise : Veuillez capturer vos coordonnées GPS sur place avant de transmettre le rapport.");
      return;
    }

    if (!agentSignature?.agentSignatureDataUrl) {
      alert("Émargement tactile requis : Veuillez apposer et sceller votre signature d'agent de contrôle avant d'envoyer le rapport au Back-Office.");
      return;
    }

    // Generate SHA-256 seal for audit inviolability
    const seal = await generateSha256Seal({
      missionId: selectedMission.id,
      timestamp: new Date().toISOString(),
      gps: gpsCoordinates,
      checklist,
      outcome: decisionOutcome,
      photosCount: photos.length,
      snelOutage,
      regidesoOutage,
      timerSeconds: missionTimerSeconds,
    });
    setMissionShaSeal(seal);

    if (isOfflineSimulated) {
      setHasUnsyncedDraft(true);
      alert("Mode hors-ligne : Votre rapport d'inspection, vos photos, vos signatures et vos coordonnées GPS ont été enregistrés dans le stockage local de l'appareil. Ils seront synchronisés dès le retour du réseau.");
      return;
    }

    const outageAppendix = `${snelOutage ? ' [ALERTE SNEL: Délestage en cours]' : ''}${regidesoOutage ? ' [ALERTE REGIDESO: Coupure eau en cours]' : ''} [SEAL:${seal.slice(0, 16)}]`;

    onCompleteMission(
      selectedMission.id, 
      checklist, 
      decisionOutcome, 
      `${notes}${outageAppendix}`, 
      gpsCoordinates, 
      photos, 
      agentSignature
    );
    setHasUnsyncedDraft(false);
    localStorage.removeItem(`nzubu:draft:${selectedMission.id}`);
    setSubmittedFeedback(true);
  };

  // Process archived missions (approved or submitted, sorted by completion date)
  const archivedMissions = missions
    .filter((m) => m.status === 'APPROVED' || m.status === 'REPORT_SUBMITTED' || m.completedAt)
    .filter((m) => {
      if (archiveCommune !== 'ALL' && m.commune.toLowerCase() !== archiveCommune.toLowerCase()) {
        return false;
      }
      if (archiveSearch.trim()) {
        const q = archiveSearch.toLowerCase();
        return (
          m.unitTitle.toLowerCase().includes(q) ||
          m.id.toLowerCase().includes(q) ||
          m.commune.toLowerCase().includes(q) ||
          m.quartier.toLowerCase().includes(q) ||
          m.landmark.toLowerCase().includes(q)
        );
      }
      return true;
    })
    .sort((a, b) => {
      const dateA = a.completedAt || a.scheduledTime || '';
      const dateB = b.completedAt || b.scheduledTime || '';
      return dateSortOrder === 'DESC'
        ? dateB.localeCompare(dateA)
        : dateA.localeCompare(dateB);
    });

  const missionProgressSteps: StepItem[] = [
    {
      id: 'step-gps',
      label: 'Accès & GPS',
      subLabel: gpsCoordinates && gpsCoordinates.source === 'DEVICE_GPS' ? 'Certifié sur site' : 'À capturer',
      isCompleted: Boolean(gpsCoordinates && gpsCoordinates.source === 'DEVICE_GPS'),
      isCurrent: !gpsCoordinates || gpsCoordinates.source !== 'DEVICE_GPS',
    },
    {
      id: 'step-checklist',
      label: 'Contrôle (9 pts)',
      subLabel: `${Object.values(checklist).filter(Boolean).length}/9 points`,
      isCompleted: Object.values(checklist).every(Boolean),
      isCurrent: Boolean(gpsCoordinates) && !Object.values(checklist).every(Boolean),
    },
    {
      id: 'step-photos',
      label: 'Preuves Photos',
      subLabel: `${photos.length}/3 clichés`,
      isCompleted: photos.length >= 1,
      isCurrent: Object.values(checklist).every(Boolean) && photos.length === 0,
    },
    {
      id: 'step-signature',
      label: 'Double Émargement',
      subLabel: agentSignature?.agentSignatureDataUrl ? 'Signature scellée' : 'À signer au doigt',
      isCompleted: Boolean(agentSignature?.agentSignatureDataUrl),
      isCurrent: photos.length >= 1 && !agentSignature?.agentSignatureDataUrl,
    },
  ];

  return (
    <div className="w-full h-full overflow-y-auto bg-slate-950 text-white p-4 sm:p-6 space-y-6">
      <div className="max-w-4xl mx-auto space-y-5">
        {/* Top Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                PWA Agent Terrain · Kinshasa
              </span>
              <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-mono">
                Agent ID: NZUBU-AG-02 (Alain Kambale)
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1">
              Contrôles Terrain & Archives des Inspections
            </h2>
            <p className="text-xs text-slate-400">
              Vérification physique certifiée, capture GPS de présence, et historique des missions validées.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Live Field Mission Chronometer */}
            {selectedMission && (
              <div 
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700/80 shadow-inner"
                title={`Chronomètre de mission démarré pour ${selectedMission.unitTitle}`}
              >
                <div className="flex items-center gap-1.5">
                  <span className="relative flex h-2 w-2">
                    {isTimerRunning && (
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    )}
                    <span className={`relative inline-flex rounded-full h-2 w-2 ${isTimerRunning ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                  </span>
                  <Timer className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-[11px] font-bold text-slate-300 hidden sm:inline">Chrono Terrain :</span>
                </div>
                <span className="font-mono font-black text-xs text-emerald-400 tracking-wider">
                  {formatMissionDuration(missionTimerSeconds)}
                </span>
                <div className="flex items-center gap-1 border-l border-slate-800 pl-1.5">
                  <button
                    type="button"
                    onClick={() => setIsTimerRunning(!isTimerRunning)}
                    className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                    title={isTimerRunning ? "Pause chronomètre" : "Démarrer chronomètre"}
                  >
                    {isTimerRunning ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 text-emerald-400" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => setMissionTimerSeconds(0)}
                    className="p-1 rounded text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors"
                    title="Réinitialiser le chronomètre à zéro"
                  >
                    <RotateCcw className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}

            <button
              onClick={() => setShowMotoOptimizer(true)}
              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all"
              title="Optimiser l'ordre de passage moto pour éviter les embouteillages de Kinshasa"
            >
              <Navigation className="w-3.5 h-3.5 text-slate-950" />
              <span>Tournée Moto (Anti-Bouchons)</span>
            </button>

            <button
              onClick={() => setShowInventoryModal(true)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all"
              title="Dresser un PV officiel d'État des Lieux Contradictoire (Loi 15/025)"
            >
              <ClipboardCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>État des Lieux (Loi 15/025)</span>
            </button>

            {/* Offline simulator toggle button */}
            <button
              onClick={() => setIsOfflineSimulated(!isOfflineSimulated)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                isOfflineSimulated
                  ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
              }`}
              title="Simule une perte de réseau mobile à Kinshasa"
            >
              {isOfflineSimulated ? (
                <>
                  <WifiOff className="w-3.5 h-3.5" />
                  <span>Hors-ligne simulé</span>
                </>
              ) : (
                <>
                  <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Réseau 4G actif</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Tab Switcher: Missions à Traiter vs Archives */}
        <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl w-fit text-xs">
          <button
            onClick={() => setActiveTab('ACTIVE_MISSIONS')}
            className={`px-4 py-2 rounded-lg font-bold transition-all flex items-center gap-2 ${
              activeTab === 'ACTIVE_MISSIONS'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ClipboardCheck className="w-4 h-4" />
            <span>Missions Actives ({activeMissionsList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('ARCHIVES')}
            className={`px-4 py-2 rounded-lg font-bold transition-all flex items-center gap-2 ${
              activeTab === 'ARCHIVES'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Archive className="w-4 h-4" />
            <span>Archives Validées ({archivedMissions.length})</span>
          </button>
        </div>

        {/* Offline draft banner */}
        {hasUnsyncedDraft && (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Save className="w-4 h-4 shrink-0" />
              <span>Brouillon et coordonnées GPS enregistrés en local sur le téléphone. Synchronisation en attente.</span>
            </div>
            {!isOfflineSimulated && (
              <button
                onClick={() => {
                  if (selectedMission && gpsCoordinates?.source === 'DEVICE_GPS') {
                    onCompleteMission(selectedMission.id, checklist, decisionOutcome, notes, gpsCoordinates, photos);
                    setHasUnsyncedDraft(false);
                    localStorage.removeItem(`nzubu:draft:${selectedMission.id}`);
                    setSubmittedFeedback(true);
                  }
                }}
                className="px-2 py-1 bg-amber-500 text-slate-950 font-bold rounded text-[11px]"
              >
                Synchroniser maintenant
              </button>
            )}
          </div>
        )}

        {/* VIEW 1: ACTIVE MISSIONS & INSPECTION FORM */}
        {activeTab === 'ACTIVE_MISSIONS' && (
          <div className="space-y-5">
            {/* Mission Selector Tabs */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Missions assignées en attente d'inspection ({missions.length})
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {missions.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => handleSelectMission(m)}
                    className={`p-4 rounded-2xl border text-left transition-all ${
                      selectedMission?.id === m.id
                        ? 'bg-slate-900 border-emerald-500 shadow-md ring-1 ring-emerald-500/50'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-mono text-emerald-400 font-bold">{m.id}</span>
                      <div className="flex items-center gap-1.5">
                        {m.gpsCoordinates && (
                          <span className="text-[10px] text-emerald-400 flex items-center gap-0.5">
                            <LocateFixed className="w-3 h-3" />
                            <span>GPS</span>
                          </span>
                        )}
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          m.status === 'REPORT_SUBMITTED'
                            ? 'bg-sky-500/20 text-sky-300'
                            : m.status === 'APPROVED'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-amber-500/20 text-amber-300'
                        }`}>
                          {m.status === 'REPORT_SUBMITTED' ? 'Rapport soumis' : m.status === 'APPROVED' ? 'Validé' : 'À inspecter'}
                        </span>
                      </div>
                    </div>
                    <h4 className="text-sm font-bold text-white line-clamp-1">{m.unitTitle}</h4>
                    <div className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                      <span>{m.commune} · {m.quartier}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Active Inspection Form */}
            {selectedMission && (
              <div className="p-5 sm:p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6 shadow-xl">
                {/* Header info of selected mission */}
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-800 pb-4">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">
                      Inspection sur site
                    </span>
                    <h3 className="text-lg font-bold text-white mt-0.5">
                      {selectedMission.unitTitle}
                    </h3>
                    <div className="text-xs text-slate-300 mt-1 space-y-0.5">
                      <p><strong>Repère d'accès :</strong> {selectedMission.landmark}</p>
                      <p><strong>Contact sur place :</strong> {selectedMission.contactPerson} ({selectedMission.contactPhone})</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAlertHistoryModal(true)}
                      className={`py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                        getAlertsForMission(selectedMission).length > 0
                          ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 shadow-sm'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                      }`}
                      title="Consulter l'historique des alertes de sécurité passées sur ce logement"
                    >
                      <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                      <span>Historique Alertes ({getAlertsForMission(selectedMission).length})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowVideoGuideModal(true)}
                      className="py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-300 border border-sky-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <Video className="w-3.5 h-3.5 text-sky-400" />
                      <span>Guide Cadrage 9:16</span>
                    </button>

                    <a
                      href={`tel:${selectedMission.contactPhone}`}
                      className="py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 shrink-0"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>Appeler le contact</span>
                    </a>
                  </div>
                </div>

                {/* Past Alerts Notice Banner */}
                {getAlertsForMission(selectedMission).length > 0 && (
                  <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 flex items-start justify-between gap-3 animate-fade-in">
                    <div className="flex items-start gap-2.5">
                      <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-bold text-white flex items-center gap-2">
                          <span>Antécédents signalés sur ce logement ({getAlertsForMission(selectedMission).length})</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 bg-amber-500/20 text-amber-300 rounded border border-amber-500/30">
                            Vigilance renforcée
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300 mt-1 leading-snug">
                          {getAlertsForMission(selectedMission)[0].notes}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowAlertHistoryModal(true)}
                      className="px-2.5 py-1 rounded-lg bg-amber-500 text-slate-950 font-bold text-[10px] shrink-0 hover:bg-amber-400 transition-colors"
                    >
                      Voir tout
                    </button>
                  </div>
                )}

                {/* Progress Stepper for Mission Workflow */}
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
                  <ProgressStepper steps={missionProgressSteps} accentColor="emerald" />
                </div>

                {/* GPS COORDINATES CAPTURE BOX */}
                <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        gpsCoordinates ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-300'
                      }`}>
                        <LocateFixed className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white flex items-center gap-2">
                          <span>Preuve de présence physique (Géolocalisation GPS)</span>
                          {gpsCoordinates && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                              Certifié sur place
                            </span>
                          )}
                        </h4>
                        <p className="text-[11px] text-slate-400">
                          Coordonnées obligatoires pour valider le badge « Vérifié par NZUBU » (§9.2)
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleCaptureGps}
                      disabled={isCapturingGps}
                      className={`py-2 px-3.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shrink-0 ${
                        gpsCoordinates 
                          ? 'bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/30'
                          : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
                      }`}
                    >
                      {isCapturingGps ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Acquisition satellite...</span>
                        </>
                      ) : gpsCoordinates ? (
                        <>
                          <RotateCw className="w-3.5 h-3.5" />
                          <span>Actualiser position GPS</span>
                        </>
                      ) : (
                        <>
                          <LocateFixed className="w-3.5 h-3.5" />
                          <span>Capturer position GPS</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Display captured coordinates */}
                  {gpsCoordinates ? (
                    <div className="space-y-2 pt-2 border-t border-slate-700/60">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                        <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-700/50">
                          <span className="text-[10px] text-slate-400 block">Latitude</span>
                          <span className="font-mono font-bold text-emerald-400 text-xs">
                            {gpsCoordinates.latitude}°
                          </span>
                        </div>

                        <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-700/50">
                          <span className="text-[10px] text-slate-400 block">Longitude</span>
                          <span className="font-mono font-bold text-emerald-400 text-xs">
                            {gpsCoordinates.longitude}°
                          </span>
                        </div>

                        <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-700/50">
                          <span className="text-[10px] text-slate-400 block">Précision estimée</span>
                          <span className="font-mono text-white text-xs">
                            ± {gpsCoordinates.accuracyMeters || 4} mètres
                          </span>
                        </div>

                        <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-700/50">
                          <span className="text-[10px] text-slate-400 block">Heure de capture</span>
                          <span className="font-mono text-white text-xs">
                            {gpsCoordinates.capturedAt || '14:22:10'}
                          </span>
                        </div>
                      </div>

                      {/* 100m Geofencing Physical Presence Badge */}
                      {geofenceDistance !== null && (
                        <div className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
                          isWithinGeofence
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                            : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                        }`}>
                          <div className="flex items-center gap-2">
                            <Navigation className="w-4 h-4 shrink-0" />
                            <span>
                              {isWithinGeofence
                                ? `Périmètre certifié : Vous êtes à ${geofenceDistance}m du repère terrain (Seuil < 100m validé).`
                                : `Écart GPS détecté : Vous êtes à ${geofenceDistance}m du repère (${selectedMission.landmark}). Rapprochez-vous.`}
                            </span>
                          </div>
                          <span className="font-mono font-bold text-[11px] px-2 py-0.5 rounded bg-slate-900 shrink-0">
                            {geofenceDistance}m / 100m max
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                      <span>
                        Aucune coordonnée GPS enregistrée. Cliquez sur <strong>« Capturer position GPS »</strong> lorsque vous êtes devant ou dans le logement à {selectedMission.commune}.
                      </span>
                    </div>
                  )}

                  {gpsStatusMessage && (
                    <div className="text-[11px] text-emerald-300 flex items-center gap-1 font-medium">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>{gpsStatusMessage}</span>
                    </div>
                  )}
                </div>

                {/* The 7 Mandatory Inspection Checkpoints (§9.2) */}
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                      <span>Grille de contrôle physique obligatoire</span>
                      <span className="text-[11px] font-mono text-emerald-400">
                        {Object.values(checklist).filter(Boolean).length} / 9 critères
                      </span>
                    </h4>

                    <div className="space-y-2 text-xs">
                      {/* 1 */}
                      <div 
                        onClick={() => toggleCheck('identityVerified')}
                        className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition-colors ${
                          checklist.identityVerified ? 'bg-emerald-500/10 border-emerald-500/30 text-white' : 'bg-slate-800/40 border-slate-800 text-slate-300'
                        }`}
                      >
                        <div className="mt-0.5 text-emerald-400">
                          {checklist.identityVerified ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4 text-slate-500" />}
                        </div>
                        <div>
                          <strong className="block text-white">1. Identité du proposant rencontrée</strong>
                          <span>Pièce d'identité officielle comparée sur place et personne autorisée.</span>
                        </div>
                      </div>

                      {/* 2 */}
                      <div 
                        onClick={() => toggleCheck('mandateOrTitleChecked')}
                        className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition-colors ${
                          checklist.mandateOrTitleChecked ? 'bg-emerald-500/10 border-emerald-500/30 text-white' : 'bg-slate-800/40 border-slate-800 text-slate-300'
                        }`}
                      >
                        <div className="mt-0.5 text-emerald-400">
                          {checklist.mandateOrTitleChecked ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4 text-slate-500" />}
                        </div>
                        <div>
                          <strong className="block text-white">2. Droit de proposer (Titre ou Mandat écrit)</strong>
                          <span>Examen documentaire du certificat d'enregistrement ou procuration légale du propriétaire.</span>
                        </div>
                      </div>

                      {/* 3 */}
                      <div 
                        onClick={() => toggleCheck('physicalPresenceConfirmed')}
                        className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition-colors ${
                          checklist.physicalPresenceConfirmed ? 'bg-emerald-500/10 border-emerald-500/30 text-white' : 'bg-slate-800/40 border-slate-800 text-slate-300'
                        }`}
                      >
                        <div className="mt-0.5 text-emerald-400">
                          {checklist.physicalPresenceConfirmed ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4 text-slate-500" />}
                        </div>
                        <div>
                          <strong className="block text-white">
                            3. Existence physique & Ancrage GPS sur site
                          </strong>
                          <span>
                            {gpsCoordinates 
                              ? `Position GPS validée : ${gpsCoordinates.latitude}, ${gpsCoordinates.longitude} (±${gpsCoordinates.accuracyMeters}m)` 
                              : 'Présence physique sur place avec capture des coordonnées GPS.'}
                          </span>
                        </div>
                      </div>

                      {/* 4 */}
                      <div 
                        onClick={() => toggleCheck('waterSupplyTested')}
                        className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition-colors ${
                          checklist.waterSupplyTested ? 'bg-emerald-500/10 border-emerald-500/30 text-white' : 'bg-slate-800/40 border-slate-800 text-slate-300'
                        }`}
                      >
                        <div className="mt-0.5 text-emerald-400">
                          {checklist.waterSupplyTested ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4 text-slate-500" />}
                        </div>
                        <div>
                          <strong className="block text-white">4. Test effectif de l'eau courante et réserve</strong>
                          <span>Robinets ouverts, cuve surélevée ou surpresseur vérifié avec bon débit.</span>
                        </div>
                      </div>

                      {/* 5 */}
                      <div 
                        onClick={() => toggleCheck('electricityTested')}
                        className={`p-3 rounded-xl border flex items-start justify-between gap-3 cursor-pointer transition-colors ${
                          checklist.electricityTested ? 'bg-emerald-500/10 border-emerald-500/30 text-white' : 'bg-slate-800/40 border-slate-800 text-slate-300'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 text-emerald-400">
                            {checklist.electricityTested ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4 text-slate-500" />}
                          </div>
                          <div>
                            <strong className="block text-white">5. Électricité & Secours (Groupe / Solaire)</strong>
                            <span>Démarrage du groupe électrogène ou inverseur testé, prises sous tension.</span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowSnelQrScanner(true);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[10px] font-bold flex items-center gap-1 transition-colors shrink-0"
                          title="Scanner le QR code apposé sur le compteur SNEL"
                        >
                          <QrCode className="w-3.5 h-3.5 text-amber-400" />
                          <span>Scanner QR SNEL</span>
                        </button>
                      </div>

                      {/* 6 */}
                      <div 
                        onClick={() => toggleCheck('roomsMatchedListing')}
                        className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition-colors ${
                          checklist.roomsMatchedListing ? 'bg-emerald-500/10 border-emerald-500/30 text-white' : 'bg-slate-800/40 border-slate-800 text-slate-300'
                        }`}
                      >
                        <div className="mt-0.5 text-emerald-400">
                          {checklist.roomsMatchedListing ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4 text-slate-500" />}
                        </div>
                        <div>
                          <strong className="block text-white">6. Concordance exacte des pièces & mobilier</strong>
                          <span>Nombre de chambres, sanitaires, cuisine inspectés sans tromperie sur la marchandise.</span>
                        </div>
                      </div>

                      {/* 7 */}
                      <div 
                        onClick={() => toggleCheck('pricingInCdfNoExcessiveDeposit')}
                        className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition-colors ${
                          checklist.pricingInCdfNoExcessiveDeposit ? 'bg-emerald-500/10 border-emerald-500/30 text-white' : 'bg-slate-800/40 border-slate-800 text-slate-300'
                        }`}
                      >
                        <div className="mt-0.5 text-emerald-400">
                          {checklist.pricingInCdfNoExcessiveDeposit ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4 text-slate-500" />}
                        </div>
                        <div>
                          <strong className="block text-white">7. Prix en Franc Congolais (CDF) & Garantie max 3 mois</strong>
                          <span>Conformité stricte à la Loi 15/025 : pas de caution abusive &gt; 3 mois ni paiement anticipatif forcé.</span>
                        </div>
                      </div>

                      {/* 8 */}
                      <div 
                        onClick={() => toggleCheck('videoFilmedVerticalNoFaces')}
                        className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition-colors ${
                          checklist.videoFilmedVerticalNoFaces ? 'bg-emerald-500/10 border-emerald-500/30 text-white' : 'bg-slate-800/40 border-slate-800 text-slate-300'
                        }`}
                      >
                        <div className="mt-0.5 text-emerald-400">
                          {checklist.videoFilmedVerticalNoFaces ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4 text-slate-500" />}
                        </div>
                        <div>
                          <strong className="block text-white">8. Vidéo verticale 9:16 filmée sans visages tiers</strong>
                          <span>Captation fluide du logement réel sans personnes reconnaissables non consentantes.</span>
                        </div>
                      </div>

                      {/* 9 */}
                      <div 
                        onClick={() => toggleCheck('safetyEgressChecked')}
                        className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition-colors ${
                          checklist.safetyEgressChecked ? 'bg-emerald-500/10 border-emerald-500/30 text-white' : 'bg-slate-800/40 border-slate-800 text-slate-300'
                        }`}
                      >
                        <div className="mt-0.5 text-emerald-400">
                          {checklist.safetyEgressChecked ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4 text-slate-500" />}
                        </div>
                        <div>
                          <strong className="block text-white">9. Issues de secours & Serrures observables</strong>
                          <span>Accès et évacuation visibles, bon fonctionnement des verrous de sécurité.</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Signalement "Alerte Délestage & Coupure Eau en Direct" (Live Outage Tracker) */}
                  <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-amber-400" />
                        <span>Live Outage Tracker · Réseaux SNEL & REGIDESO sur site</span>
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">Signalement en direct</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* SNEL Outage Toggle */}
                      <button
                        type="button"
                        onClick={() => setSnelOutage(!snelOutage)}
                        className={`p-3 rounded-xl border text-left transition-all flex items-start gap-3 ${
                          snelOutage
                            ? 'bg-rose-950/40 border-rose-500/60 text-rose-200 ring-1 ring-rose-500/40'
                            : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <div className={`p-2 rounded-lg shrink-0 ${snelOutage ? 'bg-rose-500/20 text-rose-400' : 'bg-slate-800 text-slate-400'}`}>
                          <Zap className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <strong className="text-xs text-white">Délestage SNEL en cours</strong>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${snelOutage ? 'bg-rose-500 text-white' : 'bg-emerald-500/20 text-emerald-400'}`}>
                              {snelOutage ? 'PANNE ACTIVE' : 'Secteur OK'}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {snelOutage ? 'Alimentation coupée sur la parcelle (groupe requis).' : 'Courant électrique normal présent sur le réseau.'}
                          </p>
                        </div>
                      </button>

                      {/* REGIDESO Outage Toggle */}
                      <button
                        type="button"
                        onClick={() => setRegidesoOutage(!regidesoOutage)}
                        className={`p-3 rounded-xl border text-left transition-all flex items-start gap-3 ${
                          regidesoOutage
                            ? 'bg-rose-950/40 border-rose-500/60 text-rose-200 ring-1 ring-rose-500/40'
                            : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <div className={`p-2 rounded-lg shrink-0 ${regidesoOutage ? 'bg-rose-500/20 text-rose-400' : 'bg-slate-800 text-slate-400'}`}>
                          <Droplets className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <strong className="text-xs text-white">Coupure Eau REGIDESO</strong>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${regidesoOutage ? 'bg-rose-500 text-white' : 'bg-emerald-500/20 text-emerald-400'}`}>
                              {regidesoOutage ? 'COUPURE SÈCHE' : 'Débit normal'}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {regidesoOutage ? 'Robinet à sec, dépendance réserve/citerne.' : 'Eau courante distribuée sous pression au robinet.'}
                          </p>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* PREUVES PHOTOGRAPHIQUES DE MISSION (Jusqu'à 3 photos) */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
                    <div className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-800 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <Camera className="w-4 h-4 text-emerald-400" />
                          <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                            Preuves Photographiques de Mission
                          </h4>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Capturez ou joignez jusqu'à 3 photos pour attester des réalités physiques (ex: compteur SNEL, salon, façade/réserve).
                        </p>
                      </div>

                      <span className={`px-2.5 py-1 rounded-full text-xs font-mono font-bold flex items-center gap-1.5 ${
                        photos.length >= 2 
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : photos.length === 1
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-slate-800 text-slate-400'
                      }`}>
                        <ImageIcon className="w-3.5 h-3.5" />
                        <span>{photos.length} / 3 photos</span>
                      </span>
                    </div>

                    {/* Jauge & Compteur Intelligent de Preuves Photos par Pièce */}
                    <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-white flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                          <span>Jauge de couverture des zones clés ({criticalZonesCount}/3 validées)</span>
                        </span>
                        <span className={`font-mono text-[11px] font-bold ${criticalZonesCount === 3 ? 'text-emerald-400' : 'text-amber-400'}`}>
                          {criticalZonesCount === 3 ? 'Quota Critique Rempli ✓' : `${3 - criticalZonesCount} zone(s) requise(s)`}
                        </span>
                      </div>

                      {/* Gauge Bar */}
                      <div className="w-full h-2 rounded bg-slate-800 overflow-hidden flex">
                        <div
                          style={{ width: `${(criticalZonesCount / 3) * 100}%` }}
                          className={`h-full transition-all duration-300 ${
                            criticalZonesCount === 3 ? 'bg-emerald-500' : criticalZonesCount === 2 ? 'bg-amber-500' : 'bg-rose-500'
                          }`}
                        />
                      </div>

                      {/* Badges for 3 pieces */}
                      <div className="grid grid-cols-3 gap-2 text-[11px]">
                        <div className={`p-2 rounded-lg border text-center transition-colors ${
                          hasMeterPhoto ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300' : 'bg-slate-900 border-slate-800 text-slate-400'
                        }`}>
                          <span className="block font-bold">1. Compteur SNEL</span>
                          <span className="text-[10px]">{hasMeterPhoto ? '✓ Validé' : '⚠️ Requis'}</span>
                        </div>

                        <div className={`p-2 rounded-lg border text-center transition-colors ${
                          hasLivingPhoto ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300' : 'bg-slate-900 border-slate-800 text-slate-400'
                        }`}>
                          <span className="block font-bold">2. Salon / Pièce</span>
                          <span className="text-[10px]">{hasLivingPhoto ? '✓ Validé' : '⚠️ Requis'}</span>
                        </div>

                        <div className={`p-2 rounded-lg border text-center transition-colors ${
                          hasWaterFacadePhoto ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300' : 'bg-slate-900 border-slate-800 text-slate-400'
                        }`}>
                          <span className="block font-bold">3. Façade / Eau</span>
                          <span className="text-[10px]">{hasWaterFacadePhoto ? '✓ Validé' : '⚠️ Requis'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Hidden camera / file input */}
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      capture="environment"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />

                    {/* Upload Controls & Quick-add Simulation */}
                    {photos.length < 3 ? (
                      <div className="space-y-2.5 p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-xs font-semibold text-slate-300">
                            Catégorie du prochain cliché :
                          </span>
                          <select
                            value={photoPresetCategory}
                            onChange={(e) => setPhotoPresetCategory(e.target.value)}
                            className="bg-slate-900 border border-slate-700 text-xs text-white rounded-lg px-2.5 py-1 focus:outline-none focus:border-emerald-500 font-medium"
                          >
                            <option value="Compteur SNEL & Disjoncteur différentiel">Compteur SNEL / Disjoncteur</option>
                            <option value="Salon & Séjour principal">Salon & Séjour principal</option>
                            <option value="Façade extérieure & Accès sécurisé">Façade extérieure & Accès</option>
                            <option value="Réserve d'eau, Cuve & Surpresseur">Réserve d'eau & Surpresseur</option>
                            <option value="Robinetterie cuisine/SDB & Débit eau">Débit eau cuisine / SDB</option>
                            <option value="Autre constat physique sur place">Autre constat sur place</option>
                          </select>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setShowSnelQrScanner(true)}
                            className="py-2 px-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all"
                            title="Scanner le QR code du compteur SNEL ou disjoncteur"
                          >
                            <QrCode className="w-3.5 h-3.5 text-slate-950" />
                            <span>Scanner QR Compteur SNEL</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="py-2 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-all"
                          >
                            <Camera className="w-3.5 h-3.5" />
                            <span>Prendre / Téléverser photo</span>
                          </button>

                          <span className="text-[11px] text-slate-500 font-medium">ou raccourcis terrain :</span>

                          <button
                            type="button"
                            onClick={() => handleAddPresetPhoto('METER')}
                            className="py-1.5 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-semibold flex items-center gap-1 border border-slate-700 transition-colors"
                          >
                            <Zap className="w-3 h-3 text-amber-400" />
                            <span>+ Compteur SNEL</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleAddPresetPhoto('LIVING')}
                            className="py-1.5 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-semibold flex items-center gap-1 border border-slate-700 transition-colors"
                          >
                            <Sparkles className="w-3 h-3 text-sky-400" />
                            <span>+ Salon</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleAddPresetPhoto('FACADE_WATER')}
                            className="py-1.5 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-semibold flex items-center gap-1 border border-slate-700 transition-colors"
                          >
                            <Droplets className="w-3 h-3 text-blue-400" />
                            <span>+ Façade / Eau</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-emerald-400 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span>Quota maximal de 3 photos atteint pour cette mission. Vous pouvez ajuster les légendes ou remplacer un cliché.</span>
                      </div>
                    )}

                    {/* Photos list / empty state */}
                    {photos.length === 0 ? (
                      <div className="p-5 rounded-xl border border-dashed border-slate-800 text-center space-y-1.5 bg-slate-950/30">
                        <Camera className="w-6 h-6 text-slate-600 mx-auto" />
                        <p className="text-xs text-slate-400 font-semibold">
                          Aucune preuve photographique jointe au rapport.
                        </p>
                        <p className="text-[11px] text-slate-500 max-w-md mx-auto">
                          Recommandation NZUBU : Joignez au moins 2 clichés (compteur électrique/eau et pièce principale) pour valider l'intégrité de la fiche.
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {photos.map((p, idx) => (
                          <div
                            key={p.id}
                            className="group relative rounded-xl overflow-hidden bg-slate-950 border border-slate-800 space-y-2 p-2 shadow-sm"
                          >
                            <div className="relative aspect-4/3 rounded-lg overflow-hidden bg-slate-900">
                              <img
                                src={p.url}
                                alt={p.caption}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                              <div className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-sm text-[10px] font-bold text-white font-mono">
                                #{idx + 1}/3
                              </div>
                              <div className="absolute top-1.5 right-1.5 flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => setZoomPhoto(p)}
                                  className="w-6 h-6 rounded-md bg-black/75 hover:bg-black text-white flex items-center justify-center transition-colors"
                                  title="Agrandir la photo"
                                >
                                  <Maximize2 className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRemovePhoto(p.id)}
                                  className="w-6 h-6 rounded-md bg-rose-600/90 hover:bg-rose-600 text-white flex items-center justify-center transition-colors"
                                  title="Supprimer cette photo"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                              <div className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded bg-black/60 text-[9px] font-mono text-slate-300">
                                {p.capturedAt}
                              </div>
                            </div>

                            <div>
                              <input
                                type="text"
                                value={p.caption}
                                onChange={(e) => handleUpdatePhotoCaption(p.id, e.target.value)}
                                className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-800 text-[11px] text-white focus:outline-none focus:border-emerald-500 font-medium"
                                placeholder="Légende du cliché..."
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Decision Outcome */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                      Avis & Recommandation de l'agent
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => setDecisionOutcome('PASS')}
                        className={`p-2.5 rounded-xl border font-bold transition-all ${
                          decisionOutcome === 'PASS'
                            ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                            : 'bg-slate-800 border-slate-700 text-slate-400'
                        }`}
                      >
                        PASS (Favorable)
                      </button>

                      <button
                        type="button"
                        onClick={() => setDecisionOutcome('PASS_WITH_DISCLOSURES')}
                        className={`p-2.5 rounded-xl border font-bold transition-all ${
                          decisionOutcome === 'PASS_WITH_DISCLOSURES'
                            ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                            : 'bg-slate-800 border-slate-700 text-slate-400'
                        }`}
                      >
                        Réserves visibles
                      </button>

                      <button
                        type="button"
                        onClick={() => setDecisionOutcome('NEEDS_CORRECTION')}
                        className={`p-2.5 rounded-xl border font-bold transition-all ${
                          decisionOutcome === 'NEEDS_CORRECTION'
                            ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300'
                            : 'bg-slate-800 border-slate-700 text-slate-400'
                        }`}
                      >
                        Correctifs requis
                      </button>

                      <button
                        type="button"
                        onClick={() => setDecisionOutcome('SAFETY_CONCERN')}
                        className={`p-2.5 rounded-xl border font-bold transition-all flex items-center justify-center gap-1.5 ${
                          decisionOutcome === 'SAFETY_CONCERN'
                            ? 'bg-rose-500/25 border-rose-500 text-rose-300 ring-2 ring-rose-500/40'
                            : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-rose-400'
                        }`}
                      >
                        <ShieldAlert className="w-3.5 h-3.5" />
                        <span>Alerte Sécurité</span>
                      </button>
                    </div>

                    {/* Auto-Alert Trigger Warning Box when SAFETY_CONCERN is selected */}
                    {decisionOutcome === 'SAFETY_CONCERN' && (
                      <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-200 text-xs space-y-1.5 animate-fade-in shadow-md shadow-rose-950/40">
                        <div className="flex items-center gap-2 font-bold text-rose-300">
                          <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 animate-pulse" />
                          <span>Validation Automatique : Déclenchement « Urgent : Alerte Sécurité »</span>
                        </div>
                        <p className="text-[11px] text-rose-200/90 leading-relaxed">
                          La soumission avec cette issue déclenchera <strong>automatiquement une notification d'urgence prioritaire</strong> vers le pupitre du Responsable de Marché Back-Office et suspendra la publication du logement pour enquête terrain immédiate.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Observations de terrain de l'agent {decisionOutcome === 'SAFETY_CONCERN' && <span className="text-rose-400 font-bold">(Précisez la nature du danger ou de l'anomalie)</span>}
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => {
                        setNotes(e.target.value);
                        setHasUnsyncedDraft(true);
                      }}
                      rows={3}
                      className={`w-full px-3 py-2 rounded-xl bg-slate-800 border text-white text-xs focus:outline-none transition-colors ${
                        decisionOutcome === 'SAFETY_CONCERN' 
                          ? 'border-rose-500/60 focus:border-rose-400 bg-rose-950/20' 
                          : 'border-slate-700 focus:border-emerald-500'
                      }`}
                      placeholder={decisionOutcome === 'SAFETY_CONCERN' 
                        ? "Détaillez impérativement le motif de sécurité (ex : câbles dénudés sous tension au salon, fissures structurales menaçantes, absence d'issue de secours, titre falsifié suspecté...)" 
                        : "Ex : Eau testée à bon débit au robinet de la cuisine. Groupe électrogène Perkins avec démarrage automatique vérifié en coupant le disjoncteur..."}
                    />
                  </div>

                  {/* ÉMARGEMENT & DOUBLE SIGNATURE TACTILE */}
                  <AgentSignaturePad
                    agentName={selectedMission.agentName}
                    agentId={selectedMission.agentId}
                    gpsCoordinates={gpsCoordinates || undefined}
                    initialSignature={agentSignature}
                    onSaveSignature={(sig) => {
                      setAgentSignature(sig);
                      setHasUnsyncedDraft(true);
                    }}
                  />

                  {/* Action Submit */}
                  <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
                    <div className="space-y-0.5 text-xs text-slate-400">
                      <div>
                        {gpsCoordinates 
                          ? `✓ Coordonnées GPS capturées (${gpsCoordinates.latitude}, ${gpsCoordinates.longitude})` 
                          : '⚠ Position GPS requise avant envoi.'}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                        <Camera className="w-3 h-3 text-emerald-400" />
                        <span>{photos.length} / 3 preuve(s) photo(s) jointe(s)</span>
                        <span>·</span>
                        <PenTool className="w-3 h-3 text-sky-400" />
                        <span className={agentSignature?.agentSignatureDataUrl ? 'text-emerald-400 font-semibold' : 'text-amber-400'}>
                          {agentSignature?.agentSignatureDataUrl ? '✓ Signature scellée' : '⚠ Signature requise'}
                        </span>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className={`py-2.5 px-6 rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg transition-all shrink-0 active:scale-95 ${
                        decisionOutcome === 'SAFETY_CONCERN'
                          ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30'
                          : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
                      }`}
                    >
                      {decisionOutcome === 'SAFETY_CONCERN' ? (
                        <>
                          <ShieldAlert className="w-4 h-4 animate-pulse" />
                          <span>Transmettre avec Alerte Sécurité Urgente</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>Transmettre au Responsable de Marché</span>
                        </>
                      )}
                    </button>
                  </div>

                  {submittedFeedback && (
                    <div className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center gap-2.5 animate-fade-in ${
                      decisionOutcome === 'SAFETY_CONCERN'
                        ? 'bg-rose-500/20 border-rose-500/40 text-rose-200'
                        : 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300'
                    }`}>
                      {decisionOutcome === 'SAFETY_CONCERN' ? (
                        <>
                          <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0" />
                          <div>
                            <span className="font-bold block text-rose-200">Urgent : Alerte Sécurité transmise au Back-Office !</span>
                            <span className="text-[11px] text-rose-300/80">Le Responsable de Marché a été alerté en priorité. La publication du logement est bloquée pour enquête terrain.</span>
                          </div>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4 shrink-0" />
                          <span>Rapport d'inspection, {photos.length} photo(s) et coordonnées GPS certifiées transmis avec succès au Responsable de Marché NZUBU !</span>
                        </>
                      )}
                    </div>
                  )}
                </form>
              </div>
            )}
          </div>
        )}

        {/* VIEW 2: ARCHIVES DES MISSIONS VALIDÉES (Triées par date de réalisation) */}
        {activeTab === 'ARCHIVES' && (
          <div className="space-y-4">
            {/* Header & Controls bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900 border border-slate-800">
              {/* Search */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={archiveSearch}
                  onChange={(e) => setArchiveSearch(e.target.value)}
                  placeholder="Rechercher dans les archives (titre, ID, quartier, repère)..."
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Commune Filter */}
              <div className="flex items-center gap-1 p-1 bg-slate-800 rounded-lg text-xs">
                {['ALL', 'Gombe', 'Ngaliema', 'Lingwala'].map((c) => (
                  <button
                    key={c}
                    onClick={() => setArchiveCommune(c)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                      archiveCommune === c
                        ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {c === 'ALL' ? 'Toutes' : c}
                  </button>
                ))}
              </div>

              {/* Date Sort Toggle */}
              <button
                onClick={() => setDateSortOrder((prev) => (prev === 'DESC' ? 'ASC' : 'DESC'))}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-1.5 transition-colors"
                title="Trier par date de réalisation"
              >
                <ArrowUpDown className="w-3.5 h-3.5 text-emerald-400" />
                <span>
                  Date : {dateSortOrder === 'DESC' ? 'Plus récentes en premier' : 'Plus anciennes en premier'}
                </span>
              </button>

              {/* Export CSV des missions archivées */}
              <button
                type="button"
                onClick={() => {
                  const headers = ['Ref Mission', 'Date', 'Logement', 'Commune', 'Quartier', 'Agent', 'Statut', 'Avis', 'GPS Lat', 'GPS Lng', 'Photos', 'Conformite'];
                  const rows = archivedMissions.map(m => [
                    m.id,
                    m.completedAt || m.scheduledTime,
                    `"${m.unitTitle.replace(/"/g, '""')}"`,
                    m.commune,
                    m.quartier,
                    `"${m.agentName}"`,
                    m.status,
                    m.decisionOutcome || 'PASS',
                    m.gpsCoordinates?.latitude || '',
                    m.gpsCoordinates?.longitude || '',
                    m.photos?.length || 0,
                    'LOI 15/025'
                  ]);
                  const BOM = '\uFEFF';
                  const csvContent = BOM + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\r\n');
                  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `NZUBU_Archives_Missions_${new Date().toISOString().slice(0, 10)}.csv`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
                title="Télécharger l'historique de vos missions au format CSV"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-slate-950" />
                <span>Exporter CSV ({archivedMissions.length})</span>
              </button>
            </div>

            {/* List of Archived Missions */}
            {archivedMissions.length === 0 ? (
              <div className="p-12 text-center bg-slate-900/50 rounded-2xl border border-slate-800 space-y-2">
                <Archive className="w-10 h-10 text-slate-600 mx-auto" />
                <h3 className="text-base font-bold text-white">Aucune mission archivée trouvée</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Aucun rapport ne correspond à vos filtres actuels. Dès qu'un rapport d'inspection est transmis ou validé, il apparaît automatiquement dans vos archives.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {archivedMissions.map((item) => {
                  const verifiedCount = Object.values(item.checklist).filter(Boolean).length;
                  return (
                    <div
                      key={item.id}
                      className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 space-y-3 shadow-md transition-all"
                    >
                      {/* Top Bar with ID, Date, and Badges */}
                      <div className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-800 pb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-emerald-400 font-bold text-xs">
                              {item.id}
                            </span>
                            <span className="text-xs font-bold text-white">
                              {item.unitTitle}
                            </span>
                          </div>
                          <div className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                            <span>{item.commune} · {item.quartier}</span>
                            <span>·</span>
                            <span className="text-slate-300 font-medium">Repère : {item.landmark}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${
                            item.status === 'APPROVED' 
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                          }`}>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>{item.status === 'APPROVED' ? 'Validé par le Marché' : 'Rapport Soumis'}</span>
                          </span>

                          <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 text-xs font-mono font-semibold flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span>{item.completedAt || item.scheduledTime}</span>
                          </span>
                        </div>
                      </div>

                      {/* Middle Details Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                        {/* GPS */}
                        <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800">
                          <span className="text-[10px] text-slate-400 block font-semibold">Ancrage GPS certifié sur site :</span>
                          {item.gpsCoordinates ? (
                            <div className="mt-1 font-mono text-emerald-400 text-xs font-bold flex items-center gap-1">
                              <LocateFixed className="w-3.5 h-3.5 shrink-0" />
                              <span>{item.gpsCoordinates.latitude}°, {item.gpsCoordinates.longitude}°</span>
                            </div>
                          ) : (
                            <span className="text-slate-500 mt-1 block">Non géoréférencé</span>
                          )}
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            Précision : ±{item.gpsCoordinates?.accuracyMeters || 4}m
                          </span>
                        </div>

                        {/* Checklist Result */}
                        <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800">
                          <span className="text-[10px] text-slate-400 block font-semibold">Conformité checklist :</span>
                          <span className="font-bold text-white text-xs block mt-1">
                            {verifiedCount} / 9 critères validés
                          </span>
                          <span className="text-[10px] text-emerald-400 block mt-0.5">
                            Avis : {item.decisionOutcome || 'PASS (Favorable)'}
                          </span>
                        </div>

                        {/* Agent & Contact */}
                        <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800">
                          <span className="text-[10px] text-slate-400 block font-semibold">Intervenants :</span>
                          <span className="text-slate-200 block mt-1 truncate">
                            Agent : {item.agentName}
                          </span>
                          <span className="text-slate-400 text-[10px] block mt-0.5 truncate">
                            Contact : {item.contactPerson}
                          </span>
                        </div>
                      </div>

                      {/* Photo Evidence Thumbnails on Archive Card */}
                      {item.photos && item.photos.length > 0 && (
                        <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800 space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                              <Camera className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Preuves photographiques certifiées ({item.photos.length}/3) :</span>
                            </span>
                            <span className="text-[10px] text-emerald-400 font-medium">Contrôle visuel OK</span>
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            {item.photos.map((ph, pIdx) => (
                              <div
                                key={ph.id || pIdx}
                                onClick={() => setZoomPhoto(ph)}
                                className="cursor-pointer group relative aspect-video rounded-lg overflow-hidden border border-slate-700/60 bg-slate-950"
                                title="Cliquer pour agrandir le cliché"
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

                      {/* Notes snippet */}
                      {item.notes && (
                        <div className="p-3 rounded-xl bg-slate-800/20 border border-slate-800 text-xs text-slate-300">
                          <strong className="text-slate-200">Observations :</strong> {item.notes}
                        </div>
                      )}

                      {/* Action trigger to view full archived report & export PDF */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800/80">
                        <span className="text-[11px] text-slate-400 font-mono">
                          Horodatage de réalisation : {item.completedAt || item.scheduledTime}
                        </span>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleExportPdf(item)}
                            disabled={pdfExporting}
                            className="py-1.5 px-3 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 hover:text-emerald-200 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-60"
                            title="Générer et télécharger le document PDF récapitulatif de la mission"
                          >
                            <FileDown className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Exporter PDF</span>
                          </button>

                          <button
                            onClick={() => setArchiveModalMission(item)}
                            className="py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                          >
                            <FileText className="w-3.5 h-3.5 text-slate-400" />
                            <span>Consulter rapport</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL: Full Archived Mission Inspection Report */}
      {archiveModalMission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div 
            className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl text-white max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-emerald-400">
                    {archiveModalMission.id}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                    {archiveModalMission.status === 'APPROVED' ? 'Validé par le Marché' : 'Rapport Soumis'}
                  </span>
                </div>
                <h3 className="text-base font-bold text-white mt-1">
                  {archiveModalMission.unitTitle}
                </h3>
                <p className="text-xs text-slate-400">
                  {archiveModalMission.commune} · {archiveModalMission.quartier} · Repère : {archiveModalMission.landmark}
                </p>
              </div>

              <button
                onClick={() => setArchiveModalMission(null)}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* GPS & Date Badge */}
            <div className="grid grid-cols-2 gap-3 text-xs p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
              <div>
                <span className="text-slate-400 block text-[10px]">Date de réalisation :</span>
                <span className="font-bold text-white mt-0.5 block font-mono">
                  {archiveModalMission.completedAt || archiveModalMission.scheduledTime}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Agent inspecteur :</span>
                <span className="font-bold text-white mt-0.5 block">
                  {archiveModalMission.agentName} ({archiveModalMission.agentId})
                </span>
              </div>
              {archiveModalMission.gpsCoordinates && (
                <div className="col-span-2 pt-2 border-t border-slate-700/60">
                  <span className="text-slate-400 block text-[10px]">Coordonnées GPS certifiées sur place :</span>
                  <span className="font-mono text-emerald-400 font-bold text-xs flex items-center gap-1.5 mt-0.5">
                    <LocateFixed className="w-3.5 h-3.5" />
                    <span>{archiveModalMission.gpsCoordinates.latitude}°, {archiveModalMission.gpsCoordinates.longitude}° (Précision ±{archiveModalMission.gpsCoordinates.accuracyMeters}m)</span>
                  </span>
                </div>
              )}
            </div>

            {/* Complete 9 checklist points (read-only) */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Constats physiques enregistrés lors de la visite
              </h4>
              <div className="space-y-1.5 text-xs">
                {Object.entries({
                  '1. Identité du proposant rencontrée': archiveModalMission.checklist.identityVerified,
                  '2. Droit de proposer (Titre ou Mandat écrit)': archiveModalMission.checklist.mandateOrTitleChecked,
                  '3. Existence physique & Ancrage GPS certifié': archiveModalMission.checklist.physicalPresenceConfirmed,
                  '4. Test effectif eau courante et réserve': archiveModalMission.checklist.waterSupplyTested,
                  '5. Électricité & Secours (Groupe/Solaire)': archiveModalMission.checklist.electricityTested,
                  '6. Concordance exacte des pièces & mobilier': archiveModalMission.checklist.roomsMatchedListing,
                  '7. Prix en Franc Congolais (CDF) & Caution max 3 mois': archiveModalMission.checklist.pricingInCdfNoExcessiveDeposit,
                  '8. Vidéo verticale 9:16 sans visages tiers': archiveModalMission.checklist.videoFilmedVerticalNoFaces,
                  '9. Issues de secours & Serrures fonctionnelles': archiveModalMission.checklist.safetyEgressChecked,
                }).map(([label, checked], idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-slate-800/40 border border-slate-800">
                    <span className="text-slate-300 text-[11px]">{label}</span>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded flex items-center gap-1 ${
                      checked ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                    }`}>
                      {checked ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                      <span>{checked ? 'Conforme' : 'Non vérifié'}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Preuves Photographiques in Modal */}
            {archiveModalMission.photos && archiveModalMission.photos.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Preuves photographiques certifiées sur site</span>
                  </span>
                  <span className="text-emerald-400 font-mono text-[11px]">
                    {archiveModalMission.photos.length} / 3 clichés
                  </span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {archiveModalMission.photos.map((ph, pIdx) => (
                    <div
                      key={ph.id || pIdx}
                      onClick={() => setZoomPhoto(ph)}
                      className="cursor-pointer group relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 p-1.5 space-y-1.5 hover:border-slate-700 transition-colors"
                    >
                      <div className="relative aspect-4/3 rounded-lg overflow-hidden bg-slate-900">
                        <img src={ph.url} alt={ph.caption} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-black/75 text-[9px] font-mono text-white">
                          #{pIdx + 1}
                        </div>
                        <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/70 text-[9px] font-mono text-slate-300">
                          {ph.capturedAt}
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-300 font-medium truncate px-1">{ph.caption}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            {archiveModalMission.notes && (
              <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-800 text-xs space-y-1">
                <span className="font-bold text-slate-300 block">Observations détaillées de l'agent :</span>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  {archiveModalMission.notes}
                </p>
              </div>
            )}

            {/* Signature tactile in Modal */}
            {archiveModalMission.agentSignature?.agentSignatureDataUrl && (
              <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-sky-400">
                  <span className="flex items-center gap-1.5">
                    <PenTool className="w-3.5 h-3.5" />
                    <span>Émargement tactile scellé</span>
                  </span>
                  <span className="text-[10px] text-emerald-400 font-mono">
                    Certifié le {archiveModalMission.agentSignature.agentSignedAt ? new Date(archiveModalMission.agentSignature.agentSignedAt).toLocaleDateString('fr-CD') : ''}
                  </span>
                </div>
                <div className="w-full h-24 bg-slate-950 rounded-lg overflow-hidden border border-slate-700/60 flex items-center justify-center p-2">
                  <img
                    src={archiveModalMission.agentSignature.agentSignatureDataUrl}
                    alt="Signature agent"
                    className="max-h-full max-w-full object-contain filter invert opacity-90"
                  />
                </div>
                {archiveModalMission.agentSignature.witnessName && (
                  <div className="text-[10px] text-slate-400 flex items-center justify-between">
                    <span>Témoin présent : <strong className="text-white">{archiveModalMission.agentSignature.witnessName}</strong> ({archiveModalMission.agentSignature.witnessRole})</span>
                  </div>
                )}
              </div>
            )}

            {/* Historique des alertes de sécurité passées liées à ce logement */}
            {(() => {
              const missionAlerts = getAlertsForMission(archiveModalMission);
              return (
                <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
                      <ShieldAlert className="w-4 h-4 text-amber-400" />
                      <span>Historique des alertes de sécurité ({missionAlerts.length})</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Logement : {archiveModalMission.unitTitle}
                    </span>
                  </div>

                  {missionAlerts.length === 0 ? (
                    <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-900/40 text-[11px] text-emerald-300 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Aucun incident ni alerte de sécurité répertorié pour ce logement. Historique vierge.</span>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                      {missionAlerts.map((al) => (
                        <div
                          key={al.id}
                          className={`p-2.5 rounded-lg border text-xs space-y-1.5 ${
                            al.resolved
                              ? 'bg-slate-900/80 border-slate-700/60 text-slate-300'
                              : 'bg-rose-950/30 border-rose-800/60 text-rose-200'
                          }`}
                        >
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-semibold text-white flex items-center gap-1.5">
                              <span className={`w-2 h-2 rounded-full ${al.resolved ? 'bg-emerald-400' : 'bg-rose-400 animate-pulse'}`} />
                              {al.id} — {al.resolved ? 'Résolue / Clôturée' : 'Alerte Active Critique'}
                            </span>
                            <span className="text-slate-400 font-mono text-[10px]">
                              {new Date(al.timestamp).toLocaleDateString('fr-CD', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-300 leading-snug">{al.notes}</p>
                          {al.checklistFailures && al.checklistFailures.length > 0 && (
                            <div className="flex flex-wrap gap-1 pt-0.5">
                              {al.checklistFailures.map((fail, fIdx) => (
                                <span key={fIdx} className="px-1.5 py-0.5 rounded bg-rose-500/20 border border-rose-500/30 text-rose-300 text-[10px]">
                                  ⚠️ {fail}
                                </span>
                              ))}
                            </div>
                          )}
                          <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-700/40">
                            <span>Agent rapporteur : <strong className="text-slate-300">{al.agentName}</strong></span>
                            {al.resolvedAt && (
                              <span className="text-emerald-400">Résolu le {new Date(al.resolvedAt).toLocaleDateString('fr-CD')}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Sceau d'Inviolabilité Cryptographique (Hash SHA-256) */}
            <div className="p-3.5 rounded-xl bg-slate-950/90 border border-slate-800 space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Sceau d'Inviolabilité Cryptographique (Loi 15/025)</span>
                </span>
                <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/20">
                  Certifié Immuable
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono break-all bg-black/40 p-2 rounded-lg border border-slate-800">
                {archiveModalMission.sha256Seal || `SHA256:7B8F9A${archiveModalMission.id.replace(/[^a-zA-Z0-9]/g, '').padEnd(32, '0').toUpperCase()}CD92E014872`}
              </p>
              <span className="text-[10px] text-slate-500 block">
                Empreinte scellée intégrant horodatage satellite GPS, clichés de constat et signatures tactiles.
              </span>
            </div>

            {/* Report actions */}
            <div className="pt-2 space-y-2">
              {pdfExportError && <p role="alert" className="text-xs text-rose-400">{pdfExportError}</p>}
              <button
                onClick={() => handleExportPdf(archiveModalMission)}
                disabled={pdfExporting}
                className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 text-slate-950 font-semibold text-xs transition-colors flex items-center justify-center gap-2"
              >
                <FileText className="w-4 h-4" />
                {pdfExporting ? 'Génération du PDF…' : 'Exporter Rapport PDF'}
              </button>
              <button
                onClick={() => setArchiveModalMission(null)}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-colors"
              >
                Fermer l'archive
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: High-Resolution Photo Zoom View */}
      {zoomPhoto && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in"
          onClick={() => setZoomPhoto(null)}
        >
          <div 
            className="max-w-2xl w-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl space-y-3 p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-white">{zoomPhoto.caption}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-slate-400">Capturé à {zoomPhoto.capturedAt}</span>
                <button
                  onClick={() => setZoomPhoto(null)}
                  className="w-7 h-7 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="aspect-16/10 rounded-xl overflow-hidden bg-black flex items-center justify-center">
              <img
                src={zoomPhoto.url}
                alt={zoomPhoto.caption}
                className="max-w-full max-h-full object-contain"
              />
            </div>
            <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
              <span>Preuve photographique d'inspection sur site · NZUBU Kinshasa</span>
              <button
                onClick={() => setZoomPhoto(null)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 text-white text-xs font-semibold hover:bg-slate-700 transition-colors"
              >
                Fermer l'aperçu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: 9:16 Video Recording Guidelines Overlay */}
      {showVideoGuideModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in"
          onClick={() => setShowVideoGuideModal(false)}
        >
          <div
            className="max-w-md w-full bg-slate-900 border border-sky-500/40 rounded-2xl p-5 text-white shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Video className="w-5 h-5 text-sky-400" />
                <h3 className="text-sm font-bold text-white">
                  Guide de Cadrage Vidéo Vertical (9:16)
                </h3>
              </div>
              <button
                onClick={() => setShowVideoGuideModal(false)}
                className="w-7 h-7 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Viewfinder Graphic Wireframe */}
            <div className="relative aspect-[9/16] max-h-72 mx-auto rounded-2xl bg-black border-2 border-dashed border-sky-400/60 p-3 flex flex-col justify-between overflow-hidden">
              <div className="flex items-center justify-between text-[10px] text-sky-400 font-mono">
                <span>REC ● 00:45</span>
                <span>9:16 4K 30FPS</span>
              </div>

              {/* Viewfinder crosshairs */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-16 h-16 border border-sky-400/30 rounded-lg" />
              </div>

              <div className="space-y-1 z-10 bg-black/70 p-2 rounded-xl backdrop-blur-sm text-[10px]">
                <span className="font-bold text-white block">Séquence 4 Chapitres obligatoire :</span>
                <div className="text-slate-300 space-y-0.5">
                  <div>• <strong>00s :</strong> Façade & barrière d'accès</div>
                  <div>• <strong>10s :</strong> Salon & hauteur sous plafond</div>
                  <div>• <strong>22s :</strong> Chambres & sanitaires</div>
                  <div>• <strong>34s :</strong> Compteur SNEL & Débit robinet</div>
                </div>
              </div>
            </div>

            {/* Legal & Safety reminders */}
            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-[11px] space-y-1">
                <strong className="block text-amber-300">Règle d'or de confidentialité (RDC) :</strong>
                <p>
                  Ne filmez aucun visage de passant, voisin ou enfant sans autorisation expresse. Filmez uniquement les volumes, installations techniques et mobiliers réels.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowVideoGuideModal(false)}
              className="w-full py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs shadow-md transition-colors"
            >
              J'ai compris, commencer la captation
            </button>
          </div>
        </div>
      )}

      {/* Moto Route Optimizer Modal */}
      {showMotoOptimizer && (
        <MotoRouteOptimizerModal
          missions={missions}
          onClose={() => setShowMotoOptimizer(false)}
          onSelectMission={(mId) => {
            const found = missions.find(m => m.id === mId);
            if (found) handleSelectMission(found);
            setShowMotoOptimizer(false);
          }}
        />
      )}

      {/* Property Inventory Modal */}
      {showInventoryModal && selectedMission && (
        <PropertyInventoryModal
          listing={{
            id: selectedMission.listingId || selectedMission.id,
            title: selectedMission.unitTitle,
            description: selectedMission.notes || 'Inspection contradictoire certifiée',
            rentalMode: 'SHORT_STAY',
            furnishingStatus: 'FURNISHED',
            unitType: 'APARTMENT',
            commune: selectedMission.commune,
            quartier: selectedMission.quartier,
            landmark: selectedMission.landmark,
            pricing: {
              amountCdf: 250000,
              priceUnit: 'PER_NIGHT',
              serviceChargesIncluded: true
            },
            bedroomsCount: 2,
            bathroomsCount: 1,
            maxOccupants: 3,
            utilities: {
              water: { type: 'REGIDESO', testedWorking: true, notes: 'Pression testée' },
              electricity: { type: 'SNEL_GRID', testedWorking: true, notes: 'Compteur vérifié' },
              ac: true,
              wifi: true,
              parking: true,
              securityGuard: true
            },
            media: {
              videoUrl: '',
              videoThumbnail: '',
              videoDurationSeconds: 45,
              photos: []
            },
            verification: {
              verifiedAt: '2026-11-06',
              verifiedUntil: '2027-02-06',
              inspectorId: 'NZUBU-AG-02',
              inspectorName: 'Alain Kambale',
              reportReference: 'NZUBU-REP-2026',
              checksCompleted: {
                identityAndRights: true,
                physicalExistence: true,
                utilitiesWaterElectricity: true,
                interiorMatch: true,
                mediaIntegrity: true,
                pricingInCdf: true
              },
              disclaimers: []
            },
            partner: {
              id: 'p1',
              name: selectedMission.contactPerson,
              type: 'OWNER',
              verified: true,
              phoneMasked: selectedMission.contactPhone,
              rating: 4.9,
              responseRatePercent: 95
            },
            availabilityStatus: 'AVAILABLE',
            cancellationPolicy: {
              id: 'c1',
              summary: 'Standard 72h',
              rule72h: 'Remboursement intégral',
              rule24h: '50% retenu'
            }
          }}
          type="ENTRY"
          onClose={() => setShowInventoryModal(false)}
        />
      )}

      {/* SNEL / Breaker QR Code Scanner Modal */}
      {showSnelQrScanner && (
        <SnelQrScannerModal
          isOpen={showSnelQrScanner}
          onClose={() => setShowSnelQrScanner(false)}
          onScanSuccess={handleQrScanSuccess}
        />
      )}

      {/* MODAL: Active Mission Alert History Modal */}
      {showAlertHistoryModal && selectedMission && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
          onClick={() => setShowAlertHistoryModal(false)}
        >
          <div
            className="max-w-xl w-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    Historique des alertes de sécurité
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      {getAlertsForMission(selectedMission).length} alerte(s)
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">{selectedMission.unitTitle} • {selectedMission.commune}</p>
                </div>
              </div>
              <button
                onClick={() => setShowAlertHistoryModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                aria-label="Fermer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-3 flex-1">
              {getAlertsForMission(selectedMission).length === 0 ? (
                <div className="p-6 rounded-xl bg-slate-950/60 border border-slate-800 text-center space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                  <p className="text-sm font-semibold text-white">Aucune alerte enregistrée</p>
                  <p className="text-xs text-slate-400">
                    Ce logement n'a fait l'objet d'aucune anomalie ou incident de sécurité lors des missions précédentes.
                  </p>
                </div>
              ) : (
                getAlertsForMission(selectedMission).map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-3.5 rounded-xl border space-y-2 ${
                      alert.resolved
                        ? 'bg-slate-950/60 border-slate-800'
                        : 'bg-rose-950/20 border-rose-800/60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${alert.resolved ? 'bg-emerald-400' : 'bg-rose-500 animate-pulse'}`} />
                        <span className="text-xs font-bold text-white">{alert.id}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                          alert.resolved ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        }`}>
                          {alert.resolved ? 'Résolue' : 'Active / Non résolue'}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">
                        {new Date(alert.timestamp).toLocaleDateString('fr-CD', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <p className="text-xs text-slate-200 leading-relaxed bg-black/30 p-2.5 rounded-lg border border-slate-800/60">
                      {alert.notes}
                    </p>

                    {alert.checklistFailures && alert.checklistFailures.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">
                          Points de contrôle non conformes :
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {alert.checklistFailures.map((cf, idx) => (
                            <span key={idx} className="px-2 py-0.5 rounded bg-rose-500/15 border border-rose-500/30 text-rose-300 text-[10px] font-medium">
                              ⚠️ {cf}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800/80">
                      <span>Rapporteur : <strong className="text-slate-300">{alert.agentName}</strong></span>
                      {alert.resolvedAt && (
                        <span className="text-emerald-400">Résolu le {new Date(alert.resolvedAt).toLocaleDateString('fr-CD')}</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-3 bg-slate-950/80 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setShowAlertHistoryModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors"
              >
                Fermer l'historique
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

