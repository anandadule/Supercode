import React, { useState, useRef, useEffect } from 'react';
import * as RadixDialog from '@radix-ui/react-dialog';
import { Dialog, DialogTitle } from '~/components/ui/Dialog';
import { Button } from '~/components/ui/Button';
import { classNames } from '~/utils/classNames';
import { toast } from 'react-toastify';
import { imageEditDialogOpen, editingImageData } from '~/lib/stores/imageGeneration';
import { useStore } from '@nanostores/react';
import { workbenchStore } from '~/lib/stores/workbench';

const API_KEY_STORAGE_KEY = 'bolt_openai_api_key';

export function ImageEditor() {
  const isOpen = useStore(imageEditDialogOpen);
  const currentImage = useStore(editingImageData);

  const [editPrompt, setEditPrompt] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editedUrl, setEditedUrl] = useState<string | undefined>();
  const [error, setError] = useState<string | undefined>();

  const promptRef = useRef<HTMLTextAreaElement>(null);

  // Focus the prompt textarea when dialog opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => promptRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Load saved API key on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(API_KEY_STORAGE_KEY);

      if (saved) {
        setApiKey(saved);
      }
    } catch {
      // localStorage not available
    }
  }, []);

  const saveApiKey = (key: string) => {
    setApiKey(key);

    try {
      localStorage.setItem(API_KEY_STORAGE_KEY, key);
    } catch {
      // localStorage not available
    }
  };

  const handleClose = () => {
    imageEditDialogOpen.set(false);
    setEditPrompt('');
    setEditedUrl(undefined);
    setError(undefined);
  };

  const handleEdit = async () => {
    if (!editPrompt.trim() || !currentImage) {
      return;
    }

    setIsEditing(true);
    setError(undefined);
    setEditedUrl(undefined);

    try {
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: editPrompt.trim(),
          size: '1024x1024',
          style: 'vivid',
          apiKey: apiKey || undefined,
          editingImage: currentImage,
        }),
      });

      const data = (await response.json()) as { url?: string; error?: string };

      if (!response.ok || data.error) {
        throw new Error(data.error || 'Failed to edit image');
      }

      setEditedUrl(data.url || '');
      toast.success('Image edited!');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to edit image';
      setError(message);
      toast.error(message);
    } finally {
      setIsEditing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleEdit();
    }
  };

  const handleAddToProject = async () => {
    if (!editedUrl) {
      return;
    }

    try {
      const timestamp = Date.now();
      const fileName = `/public/generated/edited-image-${timestamp}.png`;

      const response = await fetch(editedUrl);
      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      await workbenchStore.createFile(fileName, uint8Array);
      toast.success('Edited image added to project at ' + fileName);
    } catch (err) {
      console.error('Failed to add edited image to project:', err);
      toast.error('Failed to add image to project. Try downloading instead.');
    }
  };

  const handleDownload = async () => {
    if (!editedUrl) {
      return;
    }

    try {
      const response = await fetch(editedUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `edited-image-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Image downloaded!');
    } catch (err) {
      console.error('Failed to download image:', err);
      toast.error('Failed to download image');
    }
  };

  return (
    <RadixDialog.Root
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          handleClose();
        }
      }}
    >
      <Dialog onClose={handleClose} onBackdrop={handleClose}>
        <div className="p-6">
          <DialogTitle>Edit Image with AI</DialogTitle>

          <div className="mt-4 space-y-4">
            {/* Original image preview */}
            {currentImage && (
              <div>
                <label className="block text-sm font-medium text-bolt-elements-textPrimary mb-1.5">
                  Original Image
                </label>
                <div className="relative rounded-lg overflow-hidden border border-bolt-elements-borderColor bg-bolt-elements-background-depth-1">
                  <img src={currentImage} alt="Original" className="w-full h-auto max-h-40 object-contain" />
                </div>
              </div>
            )}

            {/* Edit description */}
            <div>
              <label className="block text-sm font-medium text-bolt-elements-textPrimary mb-1.5">
                Describe the edit
              </label>
              <textarea
                ref={promptRef}
                value={editPrompt}
                onChange={(e) => setEditPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Describe what you want to change about the image..."
                rows={3}
                className={classNames(
                  'w-full px-3 py-2 text-sm rounded-lg resize-none',
                  'border border-bolt-elements-borderColor',
                  'bg-bolt-elements-background-depth-1 text-bolt-elements-textPrimary',
                  'placeholder-bolt-elements-textTertiary',
                  'focus:outline-none focus:ring-2 focus:ring-bolt-elements-focus',
                )}
              />
              <p className="mt-1 text-xs text-bolt-elements-textTertiary">Press Cmd+Enter to apply edit</p>
            </div>

            {/* API Key (optional) */}
            <div>
              <label className="block text-sm font-medium text-bolt-elements-textPrimary mb-1.5">
                OpenAI API Key <span className="text-bolt-elements-textTertiary">(optional, for DALL-E 3)</span>
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => saveApiKey(e.target.value)}
                placeholder="sk-..."
                className={classNames(
                  'w-full px-3 py-2 text-sm rounded-lg',
                  'border border-bolt-elements-borderColor',
                  'bg-bolt-elements-background-depth-1 text-bolt-elements-textPrimary',
                  'placeholder-bolt-elements-textTertiary',
                  'focus:outline-none focus:ring-2 focus:ring-bolt-elements-focus',
                )}
              />
              <p className="mt-1 text-xs text-bolt-elements-textTertiary">
                Without a key, a placeholder will be generated
              </p>
            </div>

            {/* Edit button */}
            <Button
              onClick={handleEdit}
              disabled={isEditing || !editPrompt.trim() || !currentImage}
              className={classNames(
                'w-full',
                'bg-accent-500 text-white hover:bg-accent-600',
                'disabled:opacity-50 disabled:cursor-not-allowed',
              )}
            >
              {isEditing ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="i-svg-spinners:90-ring-with-bg text-xl animate-spin" />
                  Applying Edit...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <div className="i-ph:pencil-simple-line text-lg" />
                  Apply Edit
                </span>
              )}
            </Button>

            {/* Error */}
            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
                <div className="flex items-start gap-2">
                  <div className="i-ph:warning-circle text-lg flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              </div>
            )}

            {/* Edited result */}
            {editedUrl && (
              <div>
                <label className="block text-sm font-medium text-bolt-elements-textPrimary mb-2">Result</label>
                <div className="relative rounded-lg overflow-hidden border border-bolt-elements-borderColor bg-bolt-elements-background-depth-1">
                  <div className="flex">
                    {/* Original thumbnail */}
                    <div className="w-1/2 border-r border-bolt-elements-borderColor">
                      <div className="p-1.5 text-center text-xs text-bolt-elements-textTertiary bg-bolt-elements-background-depth-1">
                        Before
                      </div>
                      {currentImage && (
                        <img
                          src={currentImage}
                          alt="Before"
                          className="w-full h-auto object-contain"
                          style={{ maxHeight: '200px' }}
                        />
                      )}
                    </div>
                    {/* Edited thumbnail */}
                    <div className="w-1/2">
                      <div className="p-1.5 text-center text-xs text-accent-500 bg-bolt-elements-background-depth-1">
                        After
                      </div>
                      <img
                        src={editedUrl}
                        alt="After"
                        className="w-full h-auto object-contain"
                        style={{ maxHeight: '200px' }}
                        onError={() => {
                          toast.error('Failed to load edited image preview');
                        }}
                      />
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <Button
                    onClick={handleAddToProject}
                    className={classNames(
                      'flex-1',
                      'bg-bolt-elements-item-backgroundAccent text-bolt-elements-item-contentAccent',
                      'hover:bg-bolt-elements-button-primary-backgroundHover',
                    )}
                  >
                    <div className="i-ph:package text-base" />
                    <span className="ml-1.5">Add to Project</span>
                  </Button>
                  <Button onClick={handleDownload} variant="outline" className="flex-1">
                    <div className="i-ph:download-simple text-base" />
                    <span className="ml-1.5">Download</span>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </Dialog>
    </RadixDialog.Root>
  );
}
