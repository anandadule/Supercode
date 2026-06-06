import { atom } from 'nanostores';

export interface AutoFixAttempt {
  id: string;
  timestamp: string;
  error: string;
  errorSource: 'terminal' | 'preview' | 'build';
  fixSummary?: string;
  success: boolean;
  messages: string[];
}

export const autoFixEnabled = atom<boolean>(true);
export const autoFixInProgress = atom<boolean>(false);
export const autoFixHistory = atom<AutoFixAttempt[]>([]);
export const autoFixHistoryOpen = atom<boolean>(false);
