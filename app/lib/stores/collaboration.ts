import { atom, computed } from 'nanostores';

export interface Collaborator {
  id: string;
  name: string;
  color: string;
  role: 'admin' | 'editor' | 'viewer';
  lastSeen: number;
  cursor?: { line: number; col: number; file: string };
}

export const collaborators = atom<Collaborator[]>([]);
export const isCollaborating = atom<boolean>(false);
export const showCollaborationPanel = atom<boolean>(false);
export const myCollaboratorId = atom<string>('');
export const collaborationChatId = atom<string>('');

export const collaboratorCount = computed(collaborators, (list) => list.length);

const COLORS = [
  '#FF6B6B',
  '#4ECDC4',
  '#45B7D1',
  '#96CEB4',
  '#FFEAA7',
  '#DDA0DD',
  '#98D8C8',
  '#F7DC6F',
  '#6C5CE7',
  '#FD79A8',
  '#00CEC9',
  '#E17055',
];

export function generateCollaboratorId(): string {
  return `user_${Math.random().toString(36).slice(2, 9)}`;
}

export function generateColor(index: number): string {
  return COLORS[index % COLORS.length];
}

export function getInitials(name: string): string {
  return name.charAt(0).toUpperCase();
}
