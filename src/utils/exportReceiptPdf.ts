/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { BookingRequest } from '../types';

export async function exportReceiptPdf(booking: BookingRequest): Promise<void> {
  const [{ default: pdfMake }, { default: pdfFonts }] = await Promise.all([
    import('pdfmake/build/pdfmake'),
    import('pdfmake/build/vfs_fonts'),
  ]);
  pdfMake.addVirtualFileSystem(pdfFonts);

  const formatCDF = (num: number) => new Intl.NumberFormat('fr-CD').format(num) + ' CDF';

  const docDefinition: import('pdfmake/interfaces').TDocumentDefinitions = {
    pageSize: 'A5',
    pageOrientation: 'landscape',
    pageMargins: [35, 30, 35, 30],
    defaultStyle: { font: 'Roboto', fontSize: 9.5, color: '#1e293b' },
    styles: {
      headerTitle: { fontSize: 15, bold: true, color: '#0f172a' },
      badge: { fontSize: 8.5, bold: true, color: '#047857' },
      sectionTitle: { fontSize: 10, bold: true, color: '#0369a1', margin: [0, 8, 0, 4] },
    },
    content: [
      {
        columns: [
          {
            width: '*',
            stack: [
              { text: 'NZUBU KINSHASA', style: 'headerTitle' },
              { text: 'Plateforme Immobilière Certifiée · Pilote Gombe · Ngaliema · Lingwala', fontSize: 8, color: '#64748b' },
            ],
          },
          {
            width: 'auto',
            stack: [
              { text: 'QUITTANCE NUMÉRIQUE OFFICIELLE', alignment: 'right', bold: true, fontSize: 11, color: '#059669' },
              { text: `Réf : ${booking.id} · ${booking.createdAt}`, alignment: 'right', fontSize: 8, color: '#64748b' },
              { text: `Passerelle : MaishaPay RDC (STK Push)`, alignment: 'right', fontSize: 8, bold: true, color: '#0284c7' },
            ],
          },
        ],
        margin: [0, 0, 0, 10],
      },

      {
        canvas: [{ type: 'line', x1: 0, y1: 0, x2: 520, y2: 0, lineWidth: 1.5, lineColor: '#e2e8f0' }],
        margin: [0, 0, 0, 10],
      },

      {
        columns: [
          {
            width: '60%',
            stack: [
              { text: 'DÉTAILS DU SÉJOUR & BÉNÉFICIAIRE', style: 'sectionTitle' },
              { text: `Voyageur : ${booking.guestName} (${booking.guestPhone})`, fontSize: 9 },
              { text: `Logement : ${booking.listingTitle}`, fontSize: 9, bold: true },
              { text: `Commune : ${booking.commune} · Kinshasa`, fontSize: 9 },
              { text: `Dates : Du ${booking.checkInDate} au ${booking.checkOutDate} (${booking.nightsCount} nuits)`, fontSize: 9 },
              { text: `Hôte référencé : ${booking.hostPhone || '+243 81 555 4949'}`, fontSize: 9 },
            ],
          },
          {
            width: '40%',
            stack: [
              { text: 'VENTILATION FINANCIÈRE (CDF)', style: 'sectionTitle' },
              {
                table: {
                  widths: ['*', 'auto'],
                  body: [
                    [{ text: 'Loyer total séjour :', fontSize: 8.5 }, { text: formatCDF(booking.totalPriceCdf), bold: true, fontSize: 8.5 }],
                    [{ text: 'Avance 20% réglée :', fontSize: 8.5, color: '#047857' }, { text: formatCDF(booking.advanceAmountCdf), bold: true, fontSize: 8.5, color: '#047857' }],
                    [{ text: 'Solde dû à l\'arrivée :', fontSize: 8.5 }, { text: formatCDF(booking.balanceDueArrivalCdf), bold: true, fontSize: 8.5 }],
                  ],
                },
                layout: 'noBorders',
              },
            ],
          },
        ],
      },

      {
        table: {
          widths: ['*'],
          body: [
            [
              {
                fillColor: '#f8fafc',
                borderColor: ['#cbd5e1', '#cbd5e1', '#cbd5e1', '#cbd5e1'],
                stack: [
                  { text: `AUTHENTIFICATION PAIEMENT MAISHAPAY`, bold: true, fontSize: 8.5, color: '#334155' },
                  {
                    text: `Référence opérateur : ${booking.paymentReference || 'MPAY-CDF-VALIDATED'} · Mode : ${booking.paymentMethod || 'Mobile Money'} · Garantie séquestre NZUBU activée jusqu'à l'entrée des lieux.`,
                    fontSize: 8,
                    color: '#475569',
                  },
                ],
              },
            ],
          ],
        },
        margin: [0, 10, 0, 10],
      },

      {
        columns: [
          {
            width: '*',
            text: 'TAMPON NUMÉRIQUE NZUBU KINSHASA\nCertifié conforme sur place · Direction des Opérations',
            fontSize: 7.5,
            color: '#059669',
            bold: true,
          },
          {
            width: 'auto',
            text: `[QR Code Vérification]\nID: ${booking.id}`,
            alignment: 'right',
            fontSize: 7.5,
            color: '#64748b',
          },
        ],
      },
    ],
  };

  const safeId = booking.id.replace(/[^a-zA-Z0-9]/g, '_');
  pdfMake.createPdf(docDefinition).download(`quittance-nzubu-${safeId}.pdf`);
}
