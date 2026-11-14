/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Générateur Automatique de Contrat de Bail Type RDC (Conforme Loi 15/025)
 * République Démocratique du Congo - Ministère de l'Urbanisme et Habitat
 */

import { generateSha256Seal, formatSha256Short } from './cryptoSeal';

export interface LeaseContractData {
  contractRef: string;
  landlordName: string;
  landlordPhone: string;
  landlordIdNumber?: string;
  tenantName: string;
  tenantPhone: string;
  tenantIdNumber?: string;
  propertyTitle: string;
  commune: string;
  quartier: string;
  avenueAndNumber: string;
  monthlyRentCdf: number;
  depositMonths: number; // Max 3 according to Loi 15/025
  leaseDurationMonths: number;
  startDate: string;
  hasWaterReserve: boolean;
  hasGeneratorSolar: boolean;
  snelMeterIndex?: string;
  regidesoIndex?: string;
  witnessName?: string;
}

export async function exportLeaseContractPdf(data: LeaseContractData): Promise<void> {
  const [{ default: pdfMake }, { default: pdfFonts }] = await Promise.all([
    import('pdfmake/build/pdfmake'),
    import('pdfmake/build/vfs_fonts'),
  ]);
  pdfMake.addVirtualFileSystem(pdfFonts);

  const seal = await generateSha256Seal(data);
  const totalDepositCdf = data.monthlyRentCdf * Math.min(data.depositMonths, 3);
  const formatCDF = (num: number) => new Intl.NumberFormat('fr-CD').format(num);

  const docDefinition: import('pdfmake/interfaces').TDocumentDefinitions = {
    pageSize: 'A4',
    pageMargins: [40, 40, 40, 40],
    defaultStyle: { font: 'Roboto', fontSize: 9.5, color: '#1e293b', lineHeight: 1.25 },
    styles: {
      headerRepublic: { fontSize: 8.5, alignment: 'center', color: '#475569', bold: true, margin: [0, 0, 0, 2] },
      titleDoc: { fontSize: 14, bold: true, color: '#047857', alignment: 'center', margin: [0, 4, 0, 10] },
      subDoc: { fontSize: 8.5, color: '#047857', alignment: 'center', italics: true, margin: [0, 0, 0, 12] },
      sectionHeading: { fontSize: 10.5, bold: true, color: '#0f172a', margin: [0, 10, 0, 4] },
      articleHeading: { fontSize: 9.5, bold: true, color: '#047857', margin: [0, 6, 0, 2] },
      bodySmall: { fontSize: 9, color: '#334155' },
      callout: { fontSize: 8.5, color: '#065f46', bold: true },
      footerText: { fontSize: 8, color: '#64748b', alignment: 'center' },
    },
    content: [
      { text: 'RÉPUBLIQUE DÉMOCRATIQUE DU CONGO', style: 'headerRepublic' },
      { text: 'VILLE-PROVINCE DE KINSHASA · MINISTÈRE DE L’URBANISME ET HABITAT', style: 'headerRepublic' },
      { text: 'CONTRAT DE BAIL À USAGE RÉSIDENTIEL STANDARD', style: 'titleDoc' },
      { text: `Établi sous l’empire de la Loi N° 15/025 du 31 décembre 2015 relative aux baux à loyer\nRéférence d’enregistrement NZUBU : ${data.contractRef}`, style: 'subDoc' },

      {
        table: {
          widths: ['50%', '50%'],
          body: [
            [
              {
                fillColor: '#f1f5f9',
                stack: [
                  { text: 'LE BAILLEUR (Propriétaire / Mandataire) :', bold: true, fontSize: 9, color: '#0f172a' },
                  { text: `Nom : ${data.landlordName}`, bold: true },
                  { text: `Téléphone : ${data.landlordPhone}` },
                  { text: `Pièce d’identité : ${data.landlordIdNumber || 'Non renseignée'}` },
                ],
                margin: [4, 4, 4, 4],
              },
              {
                fillColor: '#f1f5f9',
                stack: [
                  { text: 'LE PRENEUR (Locataire) :', bold: true, fontSize: 9, color: '#0f172a' },
                  { text: `Nom : ${data.tenantName}`, bold: true },
                  { text: `Téléphone : ${data.tenantPhone}` },
                  { text: `Pièce d’identité : ${data.tenantIdNumber || 'Non renseignée'}` },
                ],
                margin: [4, 4, 4, 4],
              },
            ],
          ],
        },
        layout: 'noBorders',
      },

      { text: 'ARTICLE 1 : DÉSIGNATION ET SITUATION DU BIEN LOUÉ', style: 'articleHeading' },
      {
        text: `Le Bailleur donne en location au Preneur le logement ci-après désigné : ${data.propertyTitle}, situé sur l'Avenue ${data.avenueAndNumber}, Quartier ${data.quartier}, Commune de ${data.commune}, Ville de Kinshasa, RDC.\nÉquipements déclarés : ${data.hasGeneratorSolar ? 'Groupe électrogène / Solaire présent' : 'Secteur seul'} | ${data.hasWaterReserve ? 'Forage / Citerne tampon avec surpresseur' : 'Réseau REGIDESO standard'}.`,
        style: 'bodySmall',
      },

      { text: 'ARTICLE 2 : DURÉE ET PRISE D’EFFET', style: 'articleHeading' },
      {
        text: `Le présent contrat est consenti pour une durée déterminée de ${data.leaseDurationMonths} mois, prenant effet le ${data.startDate}. Il est renouvelable par accord exprès ou tacite reconduction selon les stipulations de la Loi 15/025.`,
        style: 'bodySmall',
      },

      { text: 'ARTICLE 3 : LOYER ET DEVISE LÉGALE CONGOLAISE (CDF)', style: 'articleHeading' },
      {
        text: `Conformément aux instructions de la Banque Centrale du Congo (BCC) et à la Loi 15/025, le loyer mensuel est fixé obligatoirement et exclusivement en Francs Congolais (CDF) à la somme de :\n${formatCDF(data.monthlyRentCdf)} CDF par mois (payable par terme échu ou d'avance au plus tard le 5 de chaque mois).`,
        style: 'bodySmall',
      },

      { text: 'ARTICLE 4 : GARANTIE LOCATIVE (PLAFONNEMENT LÉGAL STRICT DE 3 MOIS)', style: 'articleHeading' },
      {
        text: `En application stricte de l’Article 12 de la Loi N° 15/025 interdisant formellement l’exigence de plus de 3 mois de caution pour les baux résidentiels en RDC, la garantie locative versée ce jour s’élève à :\n${data.depositMonths} mois de loyer, soit ${formatCDF(totalDepositCdf)} CDF.\nCette somme ne peut être imputée sur les derniers loyers et est restituable sous un délai maximum de 30 jours après remise contradictoire des clés et déduction faite des réparations locatives avérées.`,
        style: 'bodySmall',
      },

      { text: 'ARTICLE 5 : ÉTAT DES LIEUX CONTRADICTOIRE OBLIGATOIRE', style: 'articleHeading' },
      {
        text: `Conformément à la législation congolaise, un procès-verbal d'État des Lieux Contradictoire d'Entrée a été dressé sur l'application NZUBU avec relevé certifié des index : Compteur SNEL : ${data.snelMeterIndex || 'Relevé sur place'} | Pression/Compteur REGIDESO : ${data.regidesoIndex || 'Testé conforme'}. Le Preneur restituera les lieux dans l'état exact constaté audit PV.`,
        style: 'bodySmall',
      },

      { text: 'ARTICLE 6 : RÈGLEMENT DES DIFFÉRENDS', style: 'articleHeading' },
      {
        text: `Tout litige né de l’exécution ou de l’interprétation du présent bail relève de la compétence exclusive du Tribunal de Paix du ressort de situation de l'immeuble (${data.commune}, Kinshasa), après tentative de conciliation amiable assistée par la plateforme de médiation NZUBU.`,
        style: 'bodySmall',
      },

      { text: '\n' },
      {
        table: {
          widths: ['50%', '50%'],
          body: [
            [
              {
                fillColor: '#f8fafc',
                stack: [
                  { text: 'Pour le Bailleur', bold: true, fontSize: 9 },
                  { text: '« Lu et approuvé, bon pour bail »', italics: true, fontSize: 8, color: '#64748b' },
                  { text: '\n\nSignature & Empreinte :', fontSize: 8.5 },
                  { text: `Fait à Kinshasa, le ${data.startDate}`, fontSize: 8, color: '#475569' },
                ],
                margin: [4, 4, 4, 4],
              },
              {
                fillColor: '#f8fafc',
                stack: [
                  { text: 'Pour le Preneur (Locataire)', bold: true, fontSize: 9 },
                  { text: '« Lu et approuvé, bon pour bail »', italics: true, fontSize: 8, color: '#64748b' },
                  { text: '\n\nSignature & Empreinte :', fontSize: 8.5 },
                  { text: `Fait à Kinshasa, le ${data.startDate}`, fontSize: 8, color: '#475569' },
                ],
                margin: [4, 4, 4, 4],
              },
            ],
          ],
        },
        layout: 'lightHorizontalLines',
      },

      { text: '\n' },
      {
        fillColor: '#ecfdf5',
        stack: [
          { text: 'CERTIFICATION D’INVIOLABILITÉ ET HORODATAGE NUMÉRIQUE NZUBU', style: 'callout' },
          { text: `Empreinte Cryptographique Inviolable : ${formatSha256Short(seal)} (${seal})`, fontSize: 7.5, font: 'Roboto', color: '#047857' },
          { text: 'Ce document fait foi devant les autorités administratives et judiciaires de la RDC.', fontSize: 7.5, color: '#065f46' },
        ],
        margin: [4, 4, 4, 4],
      },
    ],
  };

  const pdf = pdfMake.createPdf(docDefinition);
  pdf.download(`Contrat_Bail_Loi15025_${data.contractRef}.pdf`);
}
