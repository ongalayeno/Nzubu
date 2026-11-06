import 'fake-indexeddb/auto';
import assert from 'node:assert/strict';
import test from 'node:test';
import { clearAllMissionDrafts, listMissionDraftIds, readMissionDraft, saveMissionDraft } from './offlineMission';

test('un rapport mis en file reste relisible après réouverture et se nettoie par utilisateur', async () => {
  const userId = 'agent-fictif';
  const draft = { missionId: 'mission-fictive', listingId: 'logement-fictif', checks: { identityVerified: true }, gps: { latitude: -4.3, longitude: 15.3, accuracyMeters: 5 }, outcome: 'PASS', notes: 'Inspection fictive', photos: [], idempotencyKey: 'rapport-fictif', queued: true };
  await saveMissionDraft(userId, draft);
  assert.deepEqual(await listMissionDraftIds(userId), [draft.missionId]);
  assert.deepEqual(await readMissionDraft(userId, draft.missionId), draft);
  assert.deepEqual(await listMissionDraftIds('autre-agent'), []);
  await clearAllMissionDrafts(userId);
  assert.equal(await readMissionDraft(userId, draft.missionId), undefined);
});
