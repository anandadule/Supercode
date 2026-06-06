import type { FileMap } from '~/lib/stores/files';

export interface Snapshot {
  chatIndex: string;
  files: FileMap;
  summary?: string;
}

export interface SnapshotEntry {
  id: string;
  chatIndex: string;
  timestamp: string;
  label?: string;
  bookmarked: boolean;
  files: FileMap;
  summary?: string;
}

export interface SnapshotTimeline {
  entries: SnapshotEntry[];
  chatId: string;
}

export interface AppVersion {
  id: string;
  chatId: string;
  version: number;
  label: string;
  description?: string;
  timestamp: string;
  files: FileMap;
  messages?: any[];
}

export interface AppVersionStore {
  versions: AppVersion[];
  chatId: string;
}
