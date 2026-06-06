import { atom } from 'nanostores';

/**
 * The stored Figma personal access token.
 * Persisted to localStorage on writes.
 */
export const figmaToken = atom<string>('');

/**
 * Whether the Figma import dialog is open.
 */
export const figmaDialogOpen = atom<boolean>(false);

/**
 * Whether a Figma import operation is in progress.
 */
export const figmaImporting = atom<boolean>(false);

/**
 * List of frames fetched from the Figma file.
 */
export interface FigmaFrameItem {
  id: string;
  name: string;
  thumbnailUrl?: string;
}

export const figmaFrames = atom<FigmaFrameItem[]>([]);

/**
 * IDs of frames the user has selected for import.
 */
export const figmaSelectedFrames = atom<string[]>([]);

/**
 * Current error message, if any.
 */
export const figmaError = atom<string | undefined>(undefined);

/**
 * The current file key from the last successful figma fetch.
 */
export const figmaFileKey = atom<string | undefined>(undefined);

/**
 * The current file name from the last successful figma fetch.
 */
export const figmaFileName = atom<string | undefined>(undefined);

// --- Persistence helpers ---

const STORAGE_KEY = 'bolt_figma_token';

/**
 * Initialize the figma token from localStorage.
 */
export function initFigmaToken(): void {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(STORAGE_KEY);

    if (stored) {
      figmaToken.set(stored);
    }
  }
}

/**
 * Persist the figma token to localStorage whenever it changes.
 */
figmaToken.subscribe((value) => {
  if (typeof window !== 'undefined') {
    if (value) {
      localStorage.setItem(STORAGE_KEY, value);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }
});

/**
 * Reset all figma import state.
 */
export function resetFigmaState(): void {
  figmaFrames.set([]);
  figmaSelectedFrames.set([]);
  figmaError.set(undefined);
  figmaImporting.set(false);
  figmaFileKey.set(undefined);
  figmaFileName.set(undefined);
}
