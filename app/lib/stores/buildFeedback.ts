import { atom, type WritableAtom } from 'nanostores';

export interface BuildError {
  id: string;
  output: string;
  command: string;
  createdAt: number;
}

/**
 * Buffer of build errors that the chat layer can consume to auto-prompt the LLM.
 * Consumers should call `shiftBuildError()` after handling an entry to remove it.
 */
export const pendingBuildErrors: WritableAtom<BuildError[]> = atom([]);

let counter = 0;

export function pushBuildError(payload: Omit<BuildError, 'id' | 'createdAt'>): BuildError {
  counter += 1;

  const entry: BuildError = {
    id: `build-error-${Date.now()}-${counter}`,
    createdAt: Date.now(),
    ...payload,
  };

  const current = pendingBuildErrors.get();
  pendingBuildErrors.set([...current, entry]);

  return entry;
}

export function shiftBuildError(): BuildError | undefined {
  const current = pendingBuildErrors.get();

  if (current.length === 0) {
    return undefined;
  }

  const [first, ...rest] = current;
  pendingBuildErrors.set(rest);

  return first;
}

export function clearBuildErrors() {
  pendingBuildErrors.set([]);
}
