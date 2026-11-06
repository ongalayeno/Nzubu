import assert from 'node:assert/strict';
import test from 'node:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { LivePartnerDashboard } from './LivePartnerDashboard';

test('le tableau partenaire expose toutes les rubriques même sans données', () => {
  const html = renderToStaticMarkup(<LivePartnerDashboard
    listings={[]} bookings={[]} invoices={[]}
    counts={{ blocks: 0, viewings: 0, applications: 0, refunds: 0, tickets: 0, notifications: 0 }}
    onAccept={() => {}} onConfirm={() => {}} onCancel={() => {}}
    onOpenListing={() => {}} onNewListing={() => {}} onOpenSection={() => {}}
  />);
  for (const label of ['Demandes &amp; Séjours', 'Mes Logements', 'Facturation Commissions', 'Pièces et vérification', 'Vidéos', 'Disponibilités', 'Visites', 'Candidatures et baux', 'Remboursements', 'Preuves de séjour', 'Preuves de bail', 'Assistance', 'Notifications']) {
    assert.ok(html.includes(label), `Rubrique absente : ${label}`);
  }
  assert.ok(html.includes('Aucune demande de séjour'));
  assert.ok(html.includes('0 période(s) bloquée(s)'));
});
