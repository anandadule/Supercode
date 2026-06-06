import { atom } from 'nanostores';

export const activeDesignSystems = atom<string[]>([]);
export const designSystemSelectorOpen = atom<boolean>(false);

export function toggleDesignSystem(id: string) {
  const current = activeDesignSystems.get();

  if (current.includes(id)) {
    activeDesignSystems.set(current.filter((dsId) => dsId !== id));
  } else {
    activeDesignSystems.set([...current, id]);
  }
}

export function isDesignSystemActive(id: string): boolean {
  return activeDesignSystems.get().includes(id);
}

export function clearDesignSystems() {
  activeDesignSystems.set([]);
}
