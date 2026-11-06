import assert from 'node:assert/strict';
import test from 'node:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { LiveAdminDashboard } from './LiveAdminDashboard';

const callbacks = { onOpenSection: () => {}, onPublish: () => {}, onSuspend: () => {}, onResolveTicket: () => {} };
const counts = { bookings: 0, viewings: 0, applications: 0, invoices: 0, notifications: 0 };

test('toutes les rubriques Admin restent affichées sans données', () => {
  const html = renderToStaticMarkup(<LiveAdminDashboard listings={[]} missions={[]} users={[]} tickets={[]} counts={counts} {...callbacks} />);
  for (const label of ['Revue Marché', 'Dispatching Agents', 'Registre légal', 'Alertes prioritaires', 'Annonces et pièces', 'Revue des vidéos', 'Comptes partenaires et agents', 'Réinspection', 'Remboursements', 'Preuves des baux', 'Tickets et alertes', 'Commissions', 'Notifications']) {
    assert.ok(html.includes(label), `Rubrique absente : ${label}`);
  }
  assert.ok(html.includes('Aucune alerte critique ouverte'));
  assert.ok(html.includes('Aucun logement saisi'));
});

test('une alerte terrain critique expose le constat et la preuve GPS', () => {
  const html = renderToStaticMarkup(<LiveAdminDashboard
    listings={[{ id: 'listing-1', title: 'Logement test', commune: 'Gombe', rental_mode: 'SHORT_STAY', price_cdf: 100000, status: 'SUSPENDED' }]}
    missions={[{ id: 'mission-1', listing_id: 'listing-1', status: 'REPORT_SUBMITTED', outcome: 'SAFETY_CONCERN', report: { gps: { latitude: -4.3, longitude: 15.3, accuracyMeters: 5 }, photoIds: ['photo-1'] } }]}
    users={[]} tickets={[{ id: 'ticket-1', listing_id: 'listing-1', category: 'FIELD_SAFETY_ALERT', message: 'Danger électrique', status: 'OPEN', priority: 'CRITICAL' }]}
    counts={counts} {...callbacks}
  />);
  for (const label of ['Danger électrique', 'GPS :', 'photo-1', 'Résoudre avec justification']) assert.ok(html.includes(label));
});
