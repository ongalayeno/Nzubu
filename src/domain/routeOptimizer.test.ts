import assert from 'node:assert/strict';
import test from 'node:test';
import type { FieldMission } from '../types';
import { sortMissionsByGeographicProximity } from './routeOptimizer';

const makeMission = (id: string, commune: string, quartier: string): FieldMission => ({
  id,
  unitTitle: `Logement ${id}`,
  commune,
  quartier,
  landmark: `Repère ${quartier}`,
  contactPerson: 'Contact Test',
  contactPhone: '+243 81 000 0000',
  scheduledTime: '10:00',
  agentId: 'NZUBU-AG-02',
  agentName: 'Alain Kambale',
  status: 'ASSIGNED',
  checklist: {
    identityVerified: false,
    mandateOrTitleChecked: false,
    physicalPresenceConfirmed: false,
    waterSupplyTested: false,
    electricityTested: false,
    roomsMatchedListing: false,
    pricingInCdfNoExcessiveDeposit: false,
    videoFilmedVerticalNoFaces: false,
    safetyEgressChecked: false,
  },
});

test('regroupe et trie automatiquement les missions par proximité géographique (Gombe -> Lingwala -> Ngaliema)', () => {
  const scattered: FieldMission[] = [
    makeMission('m-ng1', 'Ngaliema', 'Macampagne'),
    makeMission('m-gom1', 'Gombe', 'Golf'),
    makeMission('m-ling1', 'Lingwala', 'Kabinda'),
    makeMission('m-ng2', 'Ngaliema', 'Joli Parc'),
    makeMission('m-gom2', 'Gombe', 'Haut Commandement'),
  ];

  const result = sortMissionsByGeographicProximity(scattered, 'Gombe', 'AUTO_PROXIMITY');

  assert.deepEqual(
    result.communeSequence.map((c) => `${c.commune}:${c.count}`),
    ['Gombe:2', 'Lingwala:1', 'Ngaliema:2']
  );

  assert.deepEqual(
    result.stops.map((s) => s.commune),
    ['Gombe', 'Gombe', 'Lingwala', 'Ngaliema', 'Ngaliema']
  );

  assert.ok(result.distanceSavedKm > 0, 'Le regroupement doit économiser des kilomètres de trajet');
  assert.ok(result.totalSavedMinutes > 0, 'Le regroupement doit économiser du temps de trajet');
});

test('adapte l’ordre des communes selon le point de départ (Ngaliema -> Lingwala -> Gombe)', () => {
  const scattered: FieldMission[] = [
    makeMission('m-gom1', 'Gombe', 'Golf'),
    makeMission('m-ling1', 'Lingwala', 'Kabinda'),
    makeMission('m-ng1', 'Ngaliema', 'Macampagne'),
  ];

  const result = sortMissionsByGeographicProximity(scattered, 'Ngaliema', 'AUTO_PROXIMITY');

  assert.deepEqual(
    result.communeSequence.map((c) => c.commune),
    ['Ngaliema', 'Lingwala', 'Gombe']
  );
});
