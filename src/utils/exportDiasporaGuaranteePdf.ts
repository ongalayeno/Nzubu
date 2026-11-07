/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { DiasporaPayment } from '../types';

export async function exportDiasporaGuaranteePdf(payment: DiasporaPayment, _listing?: unknown): Promise<void> {
  const [{ default: pdfMake }, { default: pdfFonts }] = await Promise.all([
    import('pdfmake/build/pdfmake'),
    import('pdfmake/build/vfs_fonts'),
  ]);
  pdfMake.addVirtualFileSystem(pdfFonts);

  const formatCDF = (num: number) => new Intl.NumberFormat('fr-CD').format(num) + ' CDF';

  const docDefinition: import('pdfmake/interfaces').TDocumentDefinitions = {
    pageSize: 'A4',
    pageMargins: [40, 40, 40, 40],
    defaultStyle: { font: 'Roboto', fontSize: 9.5, color: '#0f172a', lineHeight: 1.25 },
    styles: {
      headerTitle: { fontSize: 16, bold: true, color: '#0f766e', alignment: 'center', margin: [0, 0, 0, 4] },
      subHeader: { fontSize: 9.5, bold: true, color: '#475569', alignment: 'center', margin: [0, 0, 0, 15] },
      sectionTitle: { fontSize: 11, bold: true, color: '#0f766e', margin: [0, 12, 0, 4] },
      tableHeader: { bold: true, fontSize: 9, color: '#0f172a', fillColor: '#f1f5f9' },
    },
    content: [
      { text: 'RÉPUBLIQUE DÉMOCRATIQUE DU CONGO', alignment: 'center', bold: true, fontSize: 13, color: '#1e293b' },
      { text: 'PLATEFORME NZUBU · CERTIFICAT DE GARANTIE LOCATIVE DIASPORA', style: 'headerTitle' },
      { text: `Réf. Certificat : ${payment.guaranteeCertificateNumber} · Validation MaishaPay International`, style: 'subHeader' },

      {
        text: "Le présent certificat atteste qu'un paiement ou caution solidaire a été valablement souscrit depuis l'étranger par un membre de la diaspora pour le compte d'un bénéficiaire locataire à Kinshasa, conformément aux dispositions de la Loi n°15/025.",
        margin: [0, 0, 0, 10],
        fontSize: 9,
        italics: true,
        color: '#334155'
      },

      { text: '1. RENSEIGNEMENTS DU GARANT / PAYEUR À L’ÉTRANGER', style: 'sectionTitle' },
      {
        table: {
          widths: ['40%', '60%'],
          body: [
            [{ text: 'Nom complet du garant', style: 'tableHeader' }, { text: payment.guarantorName }],
            [{ text: 'Pays de résidence', style: 'tableHeader' }, { text: payment.guarantorCountry }],
            [{ text: 'Moyen de règlement', style: 'tableHeader' }, { text: payment.paymentMethod }],
            [{ text: 'Montant en devises', style: 'tableHeader' }, { text: `${payment.amountOriginal} ${payment.currency}` }],
            [{ text: 'Taux officiel de conversion BCC', style: 'tableHeader' }, { text: `1 ${payment.currency} = ${payment.exchangeRateBcc} CDF` }],
            [{ text: 'Montant garanti en Franc Congolais', style: 'tableHeader' }, { text: formatCDF(payment.amountCdfEquivalent), bold: true, color: '#047857' }],
          ]
        },
        layout: 'lightHorizontalLines'
      },

      { text: '2. BÉNÉFICIAIRE & BIEN IMMOBILIER À KINSHASA', style: 'sectionTitle' },
      {
        table: {
          widths: ['40%', '60%'],
          body: [
            [{ text: 'Bénéficiaire sur place', style: 'tableHeader' }, { text: payment.beneficiaryName }],
            [{ text: 'Logement concerné', style: 'tableHeader' }, { text: payment.listingTitle }],
            [{ text: 'Dossier de réservation', style: 'tableHeader' }, { text: payment.bookingId }],
            [{ text: 'Date d’enregistrement', style: 'tableHeader' }, { text: `${payment.createdAt} (Kinshasa)` }],
          ]
        },
        layout: 'lightHorizontalLines'
      },

      { text: '3. ENGAGEMENT DE SÉCURITÉ LOCATIVE NZUBU', style: 'sectionTitle' },
      {
        text: "NZUBU garantit au bailleur que le règlement de la caution ou des loyers a été contrôlé avec succès via l'agrégateur bancaire sécurisé MaishaPay. En cas de défaillance, le bailleur dispose de la garantie numérique scellée.",
        fontSize: 8.5,
        color: '#475569',
        margin: [0, 4, 0, 12]
      },

      {
        columns: [
          {
            width: '50%',
            text: [
              { text: 'Sceau de la Régie NZUBU :\n', bold: true, fontSize: 9 },
              { text: 'Certifié Conforme & Vérifié MaishaPay\n' },
              { text: 'Kinshasa, République Démocratique du Congo', fontSize: 8, color: '#047857' }
            ]
          },
          {
            width: '50%',
            text: [
              { text: 'Garantie Solidaire :\n', bold: true, fontSize: 9 },
              { text: `Signé numériquement par : ${payment.guarantorName}\n` },
              { text: `IP certifiée · ${payment.createdAt}`, fontSize: 8, color: '#047857' }
            ]
          }
        ]
      }
    ]
  };

  pdfMake.createPdf(docDefinition).download(`nzubu-garantie-diaspora-${payment.id}.pdf`);
}
