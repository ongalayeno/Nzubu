import assert from 'node:assert/strict';
import test from 'node:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { LiveClientExperience, type ClientListing } from './LiveClientExperience';

const defaults = {
  bookings: [], viewings: [], applications: [], tickets: [], notifications: [], favorites: [],
  filters: { commune: '', mode: '', furnished: '', maxPriceCdf: '' }, authenticated: true,
  onFilters: () => {}, onFavorite: () => {}, onAvailability: async () => [], onBooking: () => {}, onViewing: () => {},
  onApplication: () => {}, onDeclarePayment: () => {}, onCancelBooking: () => {}, onReportMedia: () => {},
  onTicket: () => {}, onCloseAccount: () => {}, onLogin: () => {},
};

test('le feed client garde ses accès et son état vide visibles', () => {
  const html = renderToStaticMarkup(<LiveClientExperience {...defaults} listings={[]} />);
  for (const label of ['Feed vidéo NZUBU', 'Explorer les filtres', 'Feed Vidéo', 'Explorer', 'Dossiers']) assert.ok(html.includes(label), label);
});

test('une annonce expose les commandes mobiles essentielles', () => {
  const listing: ClientListing = { id: 'id-1', title: 'Studio à Gombe', commune: 'Gombe', rental_mode: 'SHORT_STAY', price_cdf: 250000, video_status: 'APPROVED' };
  const html = renderToStaticMarkup(<LiveClientExperience {...defaults} listings={[listing]} />);
  for (const label of ['Toutes communes', 'Gombe', 'Vérifié par NZUBU', 'Aimer', 'Contrôles', 'Réserver', 'Fiche', 'Partager', 'Demander à réserver', 'Avance de 20 %']) assert.ok(html.includes(label), label);
});
