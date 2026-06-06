import { atom } from 'nanostores';

export interface ImageGenState {
  prompt: string;
  style?: string;
  size?: '256x256' | '512x512' | '1024x1024';
  generatedUrl?: string;
  isGenerating: boolean;
  error?: string;
}

export const imageGenState = atom<ImageGenState>({ prompt: '', isGenerating: false });
export const imageGenDialogOpen = atom<boolean>(false);
export const imageEditDialogOpen = atom<boolean>(false);
export const editingImageData = atom<string | undefined>(undefined);
