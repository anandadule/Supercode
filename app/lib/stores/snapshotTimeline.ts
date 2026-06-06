import { atom, map } from 'nanostores';
import type { SnapshotEntry } from '~/lib/persistence/types';

export const timelineEntries = map<Record<string, SnapshotEntry>>({});
export const timelineLoading = atom<boolean>(false);
export const timelineOpen = atom<boolean>(false);
export const selectedSnapshotId = atom<string | undefined>(undefined);
