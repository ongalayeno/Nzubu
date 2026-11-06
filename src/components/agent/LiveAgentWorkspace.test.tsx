import assert from 'node:assert/strict';
import test from 'node:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { LiveAgentWorkspace } from './LiveAgentWorkspace';

test('l’espace agent affiche missions, archives et assistance sans mission assignée', () => {
  const html = renderToStaticMarkup(<LiveAgentWorkspace
    agent="agent@example.test" missions={[]} listings={[]} selectedMission={null}
    checks={{}} gps={null} photos={[]} photoCaptions={[]} outcome="PASS" notes="" draftPending={false} documents={{}}
    onSelect={() => {}} onChecks={() => {}} onGps={() => {}} onGpsError={() => {}}
    onPhotos={() => {}} onPhotoCaptions={() => {}} onOutcome={() => {}} onNotes={() => {}} onSubmit={() => {}}
    onClearDrafts={() => {}} onLoadDocuments={() => {}} onOpenSection={() => {}}
    ticketCount={0} notificationCount={0}
  />);
  for (const label of ['Missions actives (0)', 'Archives (0)', 'Aucune mission assignée', 'Position GPS', 'Grille de 9 contrôles', 'Photos de preuve', 'Avis et rapport', 'Travail hors ligne', 'Assistance et signalements', 'Notifications', 'Effacer les brouillons']) {
    assert.ok(html.includes(label), `Option absente : ${label}`);
  }
});

test('une mission assignée montre le contrôle complet et les preuves photo', () => {
  const html = renderToStaticMarkup(<LiveAgentWorkspace
    agent="agent@example.test"
    missions={[{ id: 'mission-1', listing_id: 'listing-1', status: 'ASSIGNED' }]}
    listings={[{ id: 'listing-1', title: 'Appartement test', commune: 'Gombe', partner_email: 'hote@example.test' }]}
    selectedMission="mission-1" checks={{}} gps={null} photos={[]} photoCaptions={[]}
    outcome="PASS" notes="" draftPending={false} documents={{}}
    onSelect={() => {}} onChecks={() => {}} onGps={() => {}} onGpsError={() => {}}
    onPhotos={() => {}} onPhotoCaptions={() => {}} onOutcome={() => {}} onNotes={() => {}} onSubmit={() => {}}
    onClearDrafts={() => {}} onLoadDocuments={() => {}} onOpenSection={() => {}}
    ticketCount={0} notificationCount={0}
  />);
  assert.equal((html.match(/type="checkbox"/g) || []).length, 9);
  for (const label of ['Appartement test', 'Capturer position GPS', 'Consulter les pièces', 'Compteur SNEL', '+ Salon', '+ Façade / Eau', 'Alerte sécurité', 'Position GPS requise']) {
    assert.ok(html.includes(label), `Fonction absente : ${label}`);
  }
});
