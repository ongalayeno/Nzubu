/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { PropertyListing, BookingRequest } from '../types';

export interface LeaseData {
  listing: PropertyListing;
  tenantName: string;
  tenantPhone: string;
  tenantIdDoc?: string;
  startDate: string;
  durationMonths: number;
  monthlyRentCdf: number;
  depositMonths: number; // Plafonné légalement à 3 mois (Art. 18 Loi 15/025)
  advanceMonths?: number;
}

export type LeaseInput = LeaseData | PropertyListing;

export async function exportLeasePdf(input: LeaseInput): Promise<void> {
  const [{ default: pdfMake }, { default: pdfFonts }] = await Promise.all([
    import('pdfmake/build/pdfmake'),
    import('pdfmake/build/vfs_fonts'),
  ]);
  pdfMake.addVirtualFileSystem(pdfFonts);

  const data: LeaseData = 'id' in input ? {
    listing: input,
    tenantName: 'M./Mme le Preneur (À compléter)',
    tenantPhone: '+243 ...',
    startDate: new Date().toLocaleDateString('fr-CD'),
    durationMonths: 12,
    monthlyRentCdf: input.pricing.amountCdf,
    depositMonths: 3,
  } : input;

  const formatCDF = (num: number) => new Intl.NumberFormat('fr-CD').format(num) + ' CDF';
  const depositAmount = data.monthlyRentCdf * Math.min(3, data.depositMonths);
  const cautionCapped = Math.min(3, data.depositMonths);

  const docDefinition: import('pdfmake/interfaces').TDocumentDefinitions = {
    pageSize: 'A4',
    pageMargins: [40, 45, 40, 45],
    defaultStyle: { font: 'Roboto', fontSize: 9.5, color: '#1e293b', lineHeight: 1.25 },
    styles: {
      headerTitle: { fontSize: 16, bold: true, color: '#0f172a', alignment: 'center', margin: [0, 0, 0, 4] },
      subHeader: { fontSize: 10, bold: true, color: '#475569', alignment: 'center', margin: [0, 0, 0, 14] },
      articleTitle: { fontSize: 10.5, bold: true, color: '#0f766e', margin: [0, 10, 0, 3] },
      badgeLegal: { fontSize: 8.5, bold: true, color: '#047857' },
      tableHeader: { bold: true, fontSize: 9, color: '#0f172a' },
      signatureBox: { fontSize: 8.5, color: '#475569', margin: [0, 20, 0, 0] },
    },
    content: [
      { text: 'RÉPUBLIQUE DÉMOCRATIQUE DU CONGO', style: 'headerTitle' },
      { text: 'VILLE-PROVINCE DE KINSHASA', alignment: 'center', fontSize: 11, bold: true, color: '#334155' },
      { text: 'CONTRAT DE BAIL À LOYER À USAGE RÉSIDENTIEL', style: 'headerTitle', margin: [0, 8, 0, 3] },
      { text: 'Conforme strictement à la Loi n° 15/025 du 31 décembre 2015 relative aux baux à loyer non professionnels', style: 'subHeader' },

      {
        table: {
          widths: ['*'],
          body: [
            [
              {
                fillColor: '#f0fdf4',
                borderColor: ['#bbf7d0', '#bbf7d0', '#bbf7d0', '#bbf7d0'],
                stack: [
                  { text: 'CERTIFICATION NZUBU KINSHASA · CONTRÔLE PHYSIQUE DES LIEUX', style: 'badgeLegal' },
                  { text: `Réf. Certification : ${data.listing.verification.reportReference || 'NZUBU-VERIF-2026'} · Validité badge 90 jours : jusqu'au ${data.listing.verification.verifiedUntil || 'En vigueur'}`, fontSize: 8.5, color: '#065f46' },
                ],
              },
            ],
          ],
        },
        margin: [0, 0, 0, 10],
      },

      { text: 'ENTRE LES SOUSSIGNÉS :', bold: true, fontSize: 10, margin: [0, 6, 0, 4] },
      {
        text: [
          { text: '1. LE BAILLEUR : ', bold: true },
          { text: `${data.listing.partner.name}, représenté(e) ou mandataire officiel, joignable au ${data.listing.partner.phoneMasked || '+243 81 555 4949'}.\n` },
          { text: 'Ci-après dénommé « LE BAILLEUR » d’une part, et\n\n' },
          { text: '2. LE PRENEUR (LOCATAIRE) : ', bold: true },
          { text: `${data.tenantName}, N° de téléphone : ${data.tenantPhone}${data.tenantIdDoc ? ` (Pièce d'identité : ${data.tenantIdDoc})` : ''}.\n` },
          { text: 'Ci-après dénommé « LE PRENEUR » d’autre part.' },
        ],
      },

      { text: 'ARTICLE 1 : OBJET DU CONTRAT & DÉSIGNATION DES LIEUX', style: 'articleTitle' },
      {
        text: `Le Bailleur donne à bail à usage exclusivement d'habitation au Preneur qui l'accepte, le logement ci-après désigné situé à Kinshasa :\n• Type : ${data.listing.unitType} meublé / équipé (${data.listing.bedroomsCount} chambres, ${data.listing.bathroomsCount} salles de bains).\n• Localisation : Commune de ${data.listing.commune}, Quartier ${data.listing.quartier}, Repère kinois : ${data.listing.landmark}.\n• Équipements certifiés : Eau (${data.listing.utilities.water.type} - pression testée), Électricité (${data.listing.utilities.electricity.type}), Climatisation, Wi-Fi.`,
      },

      { text: 'ARTICLE 2 : DURÉE DU BAIL', style: 'articleTitle' },
      {
        text: `Le présent bail est consenti et accepté pour une durée ferme de ${data.durationMonths} mois, prenant effet à compter du ${data.startDate}. Il est renouvelable d'accord exprès entre les parties conformément aux dispositions de la Loi n°15/025.`,
      },

      { text: 'ARTICLE 3 : LOYER & MONNAIE LÉGALE CONGOLAISE (ART. 21)', style: 'articleTitle' },
      {
        text: `Conformément à l'Article 21 de la Loi n°15/025 et aux instructions de la Banque Centrale du Congo (BCC), le loyer est obligatoirement libellé et payé en Francs Congolais (CDF).\nLe loyer mensuel est fixé à la somme de ${formatCDF(data.monthlyRentCdf)} par mois, charges communes incluses selon état descriptif NZUBU.`,
      },

      { text: 'ARTICLE 4 : GARANTIE LOCATIVE / CAUTION LÉGALE (ART. 18)', style: 'articleTitle' },
      {
        text: `Conformément à l'Article 18 de la Loi n°15/025, la garantie locative est strictement plafonnée à un maximum de trois (3) mois de loyer pour un bail résidentiel.\nLe Preneur verse à ce titre la somme de ${formatCDF(depositAmount)} (soit ${cautionCapped} mois de loyer). Toute exigence excédentaire est formellement nulle et interdite par la loi.\nCette somme sera restituée au Preneur en fin de bail, déduction faite des éventuelles réparations locatives justifiées par l'état des lieux de sortie contradictoire.`,
      },

      { text: 'ARTICLE 5 : ÉTAT DES LIEUX CONTRADICTOIRE & ENTRETIEN', style: 'articleTitle' },
      {
        text: `Les parties déclarent avoir pris connaissance du rapport d'inspection physique contradictoire établi par l'agent agréé NZUBU (${data.listing.verification.inspectorName || 'Alain Kambale'}). Un état des lieux de sortie sera dressé selon les mêmes critères matériels lors de la remise des clés.`,
      },

      { text: 'ARTICLE 6 : RÈGLEMENT DES DIFFÉRENDS', style: 'articleTitle' },
      {
        text: `En cas de contestation relative à l'interprétation ou à l'exécution du présent contrat, les parties s'engagent à privilégier une médiation amiable sous l'égide du service contentieux NZUBU Kinshasa, avant toute saisine du Tribunal de Paix territorialement compétent.`,
      },

      {
        columns: [
          {
            width: '*',
            stack: [
              { text: 'Fait à Kinshasa, en double exemplaire.', margin: [0, 10, 0, 5], fontSize: 9 },
              { text: 'Pour le Bailleur (ou mandataire) :', bold: true, fontSize: 9 },
              { text: '« Lu et approuvé, bon pour bail »', italics: true, fontSize: 8.5, color: '#64748b' },
              { text: '\n\n___________________________\nSignature & Date', fontSize: 8.5 },
            ],
          },
          {
            width: '*',
            stack: [
              { text: `Date d'effet : ${data.startDate}`, margin: [0, 10, 0, 5], fontSize: 9, alignment: 'right' },
              { text: 'Pour le Preneur (Locataire) :', bold: true, fontSize: 9, alignment: 'right' },
              { text: '« Lu et approuvé, bon pour accord »', italics: true, fontSize: 8.5, color: '#64748b', alignment: 'right' },
              { text: '\n\n___________________________\nSignature & Date', fontSize: 8.5, alignment: 'right' },
            ],
          },
        ],
        margin: [0, 10, 0, 0],
      },
    ],
    footer: (page, pages) => ({
      text: `Contrat de Bail NZUBU Kinshasa · Loi n° 15/025 RDC · Page ${page} sur ${pages}`,
      alignment: 'center',
      fontSize: 8,
      color: '#94a3b8',
    }),
  };

  const safeTitle = data.listing.title.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 20);
  pdfMake.createPdf(docDefinition).download(`bail-locatif-loi15025-${safeTitle}.pdf`);
}
