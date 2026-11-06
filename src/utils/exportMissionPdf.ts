import type { FieldMission } from '../types';

const CHECKS: Array<[keyof FieldMission['checklist'], string]> = [
  ['identityVerified', 'Identité du proposant'],
  ['mandateOrTitleChecked', 'Titre ou mandat vérifié'],
  ['physicalPresenceConfirmed', 'Existence physique du logement'],
  ['waterSupplyTested', 'Alimentation en eau testée'],
  ['electricityTested', 'Électricité testée'],
  ['roomsMatchedListing', 'Pièces et mobilier conformes à l’annonce'],
  ['pricingInCdfNoExcessiveDeposit', 'Prix en CDF et caution conforme'],
  ['videoFilmedVerticalNoFaces', 'Vidéo verticale sans visages tiers'],
  ['safetyEgressChecked', 'Issues et serrures contrôlées'],
];

const OUTCOMES: Record<NonNullable<FieldMission['decisionOutcome']>, string> = {
  PASS: 'Favorable',
  PASS_WITH_DISCLOSURES: 'Favorable avec réserves',
  NEEDS_CORRECTION: 'Corrections nécessaires',
  SAFETY_CONCERN: 'Alerte de sécurité',
};

export async function exportMissionPdf(mission: FieldMission): Promise<void> {
  const [{ default: pdfMake }, { default: pdfFonts }] = await Promise.all([
    import('pdfmake/build/pdfmake'),
    import('pdfmake/build/vfs_fonts'),
  ]);
  pdfMake.addVirtualFileSystem(pdfFonts);

  const checked = CHECKS.filter(([key]) => mission.checklist[key]).length;
  const gps = mission.gpsCoordinates;
  const document: import('pdfmake/interfaces').TDocumentDefinitions = {
    pageSize: 'A4',
    pageMargins: [44, 46, 44, 46],
    defaultStyle: { font: 'Roboto', fontSize: 10, color: '#243041' },
    styles: {
      title: { fontSize: 18, bold: true, color: '#064e3b', margin: [0, 0, 0, 5] },
      subtitle: { fontSize: 12, bold: true, margin: [0, 16, 0, 7] },
      muted: { fontSize: 9, color: '#64748b' },
    },
    content: [
      { text: 'NZUBU · Rapport de mission', style: 'title' },
      { text: `Mission ${mission.id} · ${mission.completedAt || mission.scheduledTime}`, style: 'muted' },
      { text: 'Logement', style: 'subtitle' },
      { text: mission.unitTitle, bold: true },
      { text: `${mission.commune} · ${mission.quartier} · Repère : ${mission.landmark}` },
      { text: 'Inspection', style: 'subtitle' },
      { text: `Agent : ${mission.agentName} (${mission.agentId})` },
      { text: `Contact sur place : ${mission.contactPerson}` },
      { text: `Statut : ${mission.status === 'APPROVED' ? 'Validé' : 'Rapport soumis'}` },
      { text: `Avis : ${mission.decisionOutcome ? OUTCOMES[mission.decisionOutcome] : 'Non renseigné'}` },
      { text: `GPS : ${gps ? `${gps.latitude}, ${gps.longitude}${gps.accuracyMeters != null ? ` (précision ±${gps.accuracyMeters} m)` : ''}` : 'Non renseigné'}` },
      { text: `Contrôles : ${checked} / ${CHECKS.length} validés`, style: 'subtitle' },
      {
        table: {
          widths: ['*', 95],
          body: CHECKS.map(([key, label]) => [label, mission.checklist[key] ? 'Conforme' : 'Non vérifié']),
        },
        layout: 'lightHorizontalLines',
      },
      { text: 'Observations', style: 'subtitle' },
      { text: mission.notes || 'Aucune observation renseignée.' },
      { text: `Preuves photographiques : ${mission.photos?.length || 0}`, style: 'subtitle' },
      ...(mission.photos?.length
        ? mission.photos.map((photo, index) => ({ text: `${index + 1}. ${photo.caption} (${photo.capturedAt})` }))
        : [{ text: 'Aucune photo jointe.' }]),
      { text: 'Émargement & Double Signature', style: 'subtitle' },
      ...(mission.agentSignature?.agentSignatureDataUrl
        ? [
            { text: `Agent certifiant : ${mission.agentName} (${mission.agentId}) · Signé le ${mission.agentSignature.agentSignedAt ? new Date(mission.agentSignature.agentSignedAt).toLocaleString('fr-CD') : ''}` },
            { image: mission.agentSignature.agentSignatureDataUrl, width: 140, height: 50, margin: [0, 4, 0, 4] as [number, number, number, number] },
            ...(mission.agentSignature.witnessName
              ? [{ text: `Témoin / Bailleur présent : ${mission.agentSignature.witnessName} (${mission.agentSignature.witnessRole || 'Présent'})` }]
              : []),
          ]
        : [{ text: 'Émargement en attente de signature tactile sur l’application agent.' }]),
    ],
    footer: (page, pages) => ({
      text: `NZUBU · Mission ${mission.id} · ${page} / ${pages}`,
      alignment: 'center',
      fontSize: 8,
      color: '#94a3b8',
    }),
  };

  const safeId = mission.id.replace(/[^a-zA-Z0-9_-]/g, '_');
  pdfMake.createPdf(document).download(`nzubu-rapport-${safeId}.pdf`);
}
