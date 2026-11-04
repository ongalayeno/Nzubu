import { del, get, set } from 'idb-keyval';

export type PendingMissionReport = {
  missionId: string;
  listingId: string;
  checks: Record<string,boolean>;
  gps: { latitude: number; longitude: number; accuracyMeters: number } | null;
  outcome: string;
  notes: string;
  photos: File[];
  idempotencyKey: string;
};

const key = (userId: string, missionId: string) => `nzubu:pending-report:${userId}:${missionId}`;
export const saveMissionDraft = (userId: string, draft: PendingMissionReport) => set(key(userId, draft.missionId), draft);
export const readMissionDraft = (userId: string, missionId: string) => get<PendingMissionReport>(key(userId, missionId));
export const clearMissionDraft = (userId: string, missionId: string) => del(key(userId, missionId));
