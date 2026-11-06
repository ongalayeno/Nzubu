import { del, get, keys, set } from 'idb-keyval';

export type PendingMissionReport = {
  missionId: string;
  listingId: string;
  checks: Record<string,boolean>;
  gps: { latitude: number; longitude: number; accuracyMeters: number } | null;
  outcome: string;
  notes: string;
  photos: File[];
  photoCaptions?: string[];
  idempotencyKey: string;
  queued?: boolean;
};

const key = (userId: string, missionId: string) => `nzubu:pending-report:${userId}:${missionId}`;
export const saveMissionDraft = (userId: string, draft: PendingMissionReport) => set(key(userId, draft.missionId), draft);
export const readMissionDraft = (userId: string, missionId: string) => get<PendingMissionReport>(key(userId, missionId));
export const clearMissionDraft = (userId: string, missionId: string) => del(key(userId, missionId));
export async function listMissionDraftIds(userId: string): Promise<string[]> {
  const prefix = `nzubu:pending-report:${userId}:`;
  return (await keys()).filter((entry): entry is string => typeof entry === 'string' && entry.startsWith(prefix)).map((entry) => entry.slice(prefix.length));
}
export async function clearAllMissionDrafts(userId: string) {
  await Promise.all((await listMissionDraftIds(userId)).map((missionId) => clearMissionDraft(userId, missionId)));
}
