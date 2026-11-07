/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { InventoryReport } from '../types';

export async function exportInventoryPdf(report: InventoryReport): Promise<void> {
  const [{ default: pdfMake }, { default: pdfFonts }] = await Promise.all([
    import('pdfmake/build/pdfmake'),
    import('pdfmake/build/vfs_fonts'),
  ]);
  pdfMake.addVirtualFileSystem(pdfFonts);

  const isEntry = report.type === 'ENTRY';
  const titleDoc = isEntry 
    ? "PROCÈS-VERBAL D'ÉTAT DES LIEUX D'ENTRÉE" 
    : "PROCÈS-VERBAL D'ÉTAT DES LIEUX DE SORTIE";

  const docDefinition: import('pdfmake/interfaces').TDocumentDefinitions = {
    pageSize: 'A4',
    pageMargins: [40, 40, 40, 40],
    defaultStyle: { font: 'Roboto', fontSize: 9.5, color: '#0f172a', lineHeight: 1.25 },
    styles: {
      countryHeader: { fontSize: 13, bold: true, color: '#1e293b', alignment: 'center', margin: [0, 0, 0, 2] },
      cityHeader: { fontSize: 10, bold: true, color: '#475569', alignment: 'center', margin: [0, 0, 0, 8] },
      docTitle: { fontSize: 14, bold: true, color: '#0f766e', alignment: 'center', margin: [0, 6, 0, 4] },
      legalRef: { fontSize: 8.5, italics: true, color: '#047857', alignment: 'center', margin: [0, 0, 0, 14] },
      sectionTitle: { fontSize: 10.5, bold: true, color: '#0f766e', margin: [0, 10, 0, 4] },
      tableHeader: { bold: true, fontSize: 9, color: '#0f172a', fillColor: '#f1f5f9' },
    },
    content: [
      { text: 'RÉPUBLIQUE DÉMOCRATIQUE DU CONGO', style: 'countryHeader' },
      { text: 'VILLE-PROVINCE DE KINSHASA · NZUBU CERTIFICATION', style: 'cityHeader' },
      { text: titleDoc, style: 'docTitle' },
      { 
        text: 'Établi contradictoirement en application stricte des Articles 14, 15 et 18 de la Loi n°15/025 du 31 décembre 2015 relative aux baux à loyer non professionnels.',
        style: 'legalRef'
      },

      { text: '1. IDENTIFICATION DES PARTIES & DU BIEN', style: 'sectionTitle' },
      {
        table: {
          widths: ['35%', '65%'],
          body: [
            [{ text: 'Bien immobilier', style: 'tableHeader' }, { text: `${report.listingTitle} (${report.commune})` }],
            [{ text: 'Bailleur / Gestionnaire', style: 'tableHeader' }, { text: `${report.landlordName} (Tél: ${report.landlordPhone})` }],
            [{ text: 'Preneur / Locataire', style: 'tableHeader' }, { text: `${report.tenantName} (Tél: ${report.tenantPhone})` }],
            [{ text: 'Date de réalisation', style: 'tableHeader' }, { text: `${report.createdAt} à Kinshasa` }],
            [{ text: 'Nombre de clés remises', style: 'tableHeader' }, { text: `${report.keysCount} trousseau(x) complet(s)` }],
          ]
        },
        layout: 'lightHorizontalLines'
      },

      { text: '2. RELEVÉS TECHNIQUES CONTRADICTOIRES (EAU & ÉLECTRICITÉ)', style: 'sectionTitle' },
      {
        table: {
          widths: ['50%', '50%'],
          body: [
            [
              { text: 'Index Compteur Électrique SNEL', style: 'tableHeader' },
              { text: 'Approvisionnement & Débit Eau REGIDESO', style: 'tableHeader' }
            ],
            [
              { text: `Index relevé : ${report.meterIndexKwh} kWh\n(Disjoncteur et scellé inspectés intacts)`, margin: [0, 2, 0, 2] },
              { text: `Pression constatée au robinet : ${report.waterPressure}\n(Cuve et surpresseur vérifiés en service)`, margin: [0, 2, 0, 2] }
            ]
          ]
        },
        layout: 'lightHorizontalLines'
      },

      { text: '3. CONSTAT DES FINITIONS, ÉQUIPEMENTS & MOBILIER', style: 'sectionTitle' },
      {
        table: {
          widths: ['35%', '65%'],
          body: [
            [{ text: 'État général des peintures', style: 'tableHeader' }, { text: `État : ${report.paintState}` }],
            [{ text: 'Climatiseurs en marche', style: 'tableHeader' }, { text: `${report.acWorkingCount} appareil(s) fonctionnel(s) avec télécommande(s)` }],
            [{ text: 'Observations des pièces', style: 'tableHeader' }, { text: report.roomsNotes || 'Locaux propres, sans fissures majeures ni dégradations constatées.' }],
            [{ text: 'Inventaire mobilier / accessoires', style: 'tableHeader' }, { text: report.furnitureInventoryNotes || 'Mobilier conforme à la liste contractuelle.' }],
          ]
        },
        layout: 'lightHorizontalLines'
      },

      { text: '4. CLAUSE LÉGALE DE RESTITUTION DE LA GARANTIE (LOI 15/025)', style: 'sectionTitle' },
      {
        text: isEntry
          ? "Le présent état des lieux d'entrée servira de preuve unique et contradictoire lors de la sortie du preneur. Conformément à l'Article 18 de la Loi 15/025, la garantie locative de 3 mois ne pourra subir aucune retenue autre que les dégradations expressément comparées au présent document."
          : "Le présent état des lieux de sortie atteste de la libération des lieux. Conformément à la Loi 15/025, la caution locative doit être restituée au preneur dans le délai maximum de 30 jours, déduction faite des réparations locatives justifiées sur devis ou factures conformes.",
        fontSize: 8.5,
        color: '#334155',
        margin: [0, 2, 0, 8]
      },

      { text: '5. DOUBLE ÉMARGEMENT & SIGNATURES CONTRADICTOIRES', style: 'sectionTitle' },
      {
        columns: [
          {
            width: '50%',
            text: [
              { text: 'Pour le Bailleur / Mandataire NZUBU :\n', bold: true, fontSize: 9 },
              { text: '« Lu et approuvé, remise effective »\n\n' },
              { text: `Signé par : ${report.landlordName}\n`, fontSize: 8.5 },
              { text: `Horodaté le : ${report.createdAt}`, fontSize: 8, color: '#047857' }
            ]
          },
          {
            width: '50%',
            text: [
              { text: 'Pour le Preneur (Locataire) :\n', bold: true, fontSize: 9 },
              { text: '« Lu et approuvé, clés reçues »\n\n' },
              { text: `Signé par : ${report.tenantName}\n`, fontSize: 8.5 },
              { text: `Horodaté le : ${report.createdAt}`, fontSize: 8, color: '#047857' }
            ]
          }
        ]
      },

      {
        text: `\nDocument numérique certifié NZUBU Sarl · Kinshasa RDC · Réf. Unique : PV-${report.id.toUpperCase()}`,
        alignment: 'center',
        fontSize: 8,
        color: '#64748b',
        margin: [0, 15, 0, 0]
      }
    ]
  };

  pdfMake.createPdf(docDefinition).download(`nzubu-etat-des-lieux-${report.type.toLowerCase()}-${report.id}.pdf`);
}
