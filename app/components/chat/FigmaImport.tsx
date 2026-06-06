import React, { useCallback, useEffect, useState } from 'react';
import { useStore } from '@nanostores/react';
import * as RadixDialog from '@radix-ui/react-dialog';
import { motion } from 'framer-motion';
import { classNames } from '~/utils/classNames';
import { DialogTitle } from '~/components/ui/Dialog';
import { Button } from '~/components/ui/Button';
import { toast } from 'react-toastify';
import {
  figmaDialogOpen,
  figmaToken,
  figmaImporting,
  figmaFrames,
  figmaSelectedFrames,
  figmaError,
  figmaFileKey,
  figmaFileName,
  resetFigmaState,
  type FigmaFrameItem,
} from '~/lib/stores/figma';
import { getFigmaImages, downloadImageContent, sanitizeFrameName } from '~/lib/services/figmaService';
import { workbenchStore } from '~/lib/stores/workbench';

type Step = 'entry' | 'loading' | 'select' | 'importing' | 'done' | 'error';

export const FigmaImport: React.FC = () => {
  const open = useStore(figmaDialogOpen);
  const storedToken = useStore(figmaToken);
  const frames = useStore(figmaFrames);
  const error = useStore(figmaError);
  const fileKey = useStore(figmaFileKey);
  const fileName = useStore(figmaFileName);

  const [url, setUrl] = useState('');
  const [token, setToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [step, setStep] = useState<Step>('entry');
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [selection, setSelection] = useState<string[]>([]);

  // Sync token from store
  useEffect(() => {
    setToken(storedToken);
  }, [storedToken, open]);

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setStep('entry');
      setProgress({ current: 0, total: 0 });
      setSelection([]);
      setShowToken(false);
      resetFigmaState();
    }
  }, [open]);

  const handleFetchFrames = useCallback(async () => {
    const accessToken = token || storedToken;

    if (!url.trim()) {
      toast.error('Please enter a Figma file URL');
      return;
    }

    if (!accessToken) {
      toast.error('Please enter your Figma access token');
      return;
    }

    setStep('loading');
    figmaError.set(undefined);

    try {
      const res = await fetch('/api/figma', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim(), accessToken }),
      });

      const data = (await res.json()) as {
        frames?: FigmaFrameItem[];
        fileKey?: string;
        fileName?: string;
        error?: string;
      };

      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch Figma file');
      }

      figmaFrames.set(data.frames || []);
      figmaFileKey.set(data.fileKey);
      figmaFileName.set(data.fileName);

      // Persist the token
      figmaToken.set(accessToken);

      setStep('select');
    } catch (err) {
      figmaError.set(err instanceof Error ? err.message : 'Unknown error');
      setStep('error');
    }
  }, [url, token, storedToken]);

  const handleToggleFrame = (frameId: string) => {
    setSelection((prev) => (prev.includes(frameId) ? prev.filter((id) => id !== frameId) : [...prev, frameId]));
  };

  const handleSelectAll = () => {
    if (selection.length === frames.length) {
      setSelection([]);
    } else {
      setSelection(frames.map((f) => f.id));
    }
  };

  const handleImport = useCallback(async () => {
    const accessToken = token || storedToken;

    if (!fileKey || selection.length === 0) {
      return;
    }

    setStep('importing');
    figmaImporting.set(true);
    figmaSelectedFrames.set(selection);
    setProgress({ current: 0, total: selection.length });

    const selectedFrameItems = frames.filter((f) => selection.includes(f.id));

    try {
      // Fetch image URLs for all selected frames
      const imagesRes = await getFigmaImages(fileKey, selection, accessToken, 'svg');

      const imageEntries = Object.entries(imagesRes.images).filter(
        (entry): entry is [string, string] => entry[1] !== null,
      );

      if (imageEntries.length === 0) {
        throw new Error('No images returned from Figma API');
      }

      // Ensure the figma directory exists
      await workbenchStore.createFolder('/public/figma').catch(() => {
        // Folder may already exist, that's fine
      });

      let importedCount = 0;

      for (let i = 0; i < imageEntries.length; i++) {
        const [nodeId, imageUrl] = imageEntries[i];
        const frame = selectedFrameItems.find((f) => f.id === nodeId);

        if (!frame) {
          continue;
        }

        setProgress({ current: i + 1, total: imageEntries.length });

        try {
          const svgContent = await downloadImageContent(imageUrl);
          const safeName = sanitizeFrameName(frame.name);
          const filePath = `/public/figma/${safeName}.svg`;

          await workbenchStore.createFile(filePath, svgContent);
          importedCount++;
        } catch (downloadErr) {
          console.warn(`Failed to import frame "${frame.name}":`, downloadErr);

          // Continue with remaining frames
        }
      }

      setProgress({ current: importedCount, total: imageEntries.length });

      if (importedCount > 0) {
        toast.success(`Imported ${importedCount} frame${importedCount > 1 ? 's' : ''} from Figma`);
      }

      setStep('done');
    } catch (err) {
      figmaError.set(err instanceof Error ? err.message : 'Import failed');
      setStep('error');
      toast.error('Failed to import frames');
    } finally {
      figmaImporting.set(false);
    }
  }, [fileKey, selection, frames, token, storedToken]);

  const handleClose = () => {
    figmaDialogOpen.set(false);
  };

  const handleRetry = () => {
    setStep('entry');
    figmaError.set(undefined);
  };

  const handleClearSavedToken = () => {
    figmaToken.set('');
    setToken('');
  };

  const renderEntry = () => (
    <div className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-bolt-elements-textPrimary mb-1.5">Figma File URL</label>
        <input
          type="url"
          placeholder="https://www.figma.com/file/ABC123/My-Design"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-bolt-elements-borderColor bg-bolt-elements-background-depth-2 text-bolt-elements-textPrimary text-sm placeholder:text-bolt-elements-textTertiary focus:outline-none focus:ring-2 focus:ring-accent-500/40 focus:border-accent-500"
        />
        <p className="mt-1 text-xs text-bolt-elements-textTertiary">Paste a Figma file or design URL</p>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-sm font-medium text-bolt-elements-textPrimary">Figma Access Token</label>
          {storedToken && (
            <span className="inline-flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-green-500">
              <span className="i-ph:check-circle-fill" />
              Saved
            </span>
          )}
        </div>
        <div className="relative">
          <input
            type={showToken ? 'text' : 'password'}
            placeholder={storedToken ? '••••••••••••••••' : 'figd_xxxx...'}
            value={token}
            onChange={(e) => setToken(e.target.value)}
            className="w-full pl-3 pr-20 py-2 rounded-lg border border-bolt-elements-borderColor bg-bolt-elements-background-depth-2 text-bolt-elements-textPrimary text-sm placeholder:text-bolt-elements-textTertiary focus:outline-none focus:ring-2 focus:ring-accent-500/40 focus:border-accent-500"
          />
          <div className="absolute inset-y-0 right-1 flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => setShowToken(!showToken)}
              className="p-1.5 rounded-md text-bolt-elements-textTertiary hover:text-bolt-elements-textPrimary hover:bg-bolt-elements-background-depth-3 transition-colors"
              title={showToken ? 'Hide token' : 'Show token'}
              aria-label={showToken ? 'Hide token' : 'Show token'}
            >
              <span className={`${showToken ? 'i-ph:eye-slash' : 'i-ph:eye'} text-base`} />
            </button>
            {storedToken && (
              <button
                type="button"
                onClick={handleClearSavedToken}
                className="p-1.5 rounded-md text-bolt-elements-textTertiary hover:text-red-400 hover:bg-bolt-elements-background-depth-3 transition-colors"
                title="Clear saved token"
                aria-label="Clear saved token"
              >
                <span className="i-ph:trash text-base" />
              </button>
            )}
          </div>
        </div>
        <p className="mt-1 text-xs text-bolt-elements-textTertiary">
          Generate a token in{' '}
          <a
            href="https://www.figma.com/developers/api#access-tokens"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent-500 hover:underline"
          >
            Figma Account Settings
          </a>
          {storedToken && token === storedToken && <> — using your saved token. Type to replace.</>}
        </p>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={handleClose}>
          Cancel
        </Button>
        <Button
          onClick={handleFetchFrames}
          disabled={!url.trim() || !(token || storedToken)}
          className="bg-accent-500 text-white hover:bg-accent-600 disabled:opacity-50"
        >
          <div className="i-ph:figma-logo text-lg" />
          Fetch Frames
        </Button>
      </div>
    </div>
  );

  const renderLoading = () => (
    <div className="flex flex-col items-center justify-center py-12 gap-4">
      <div className="i-svg-spinners:90-ring-with-bg text-4xl text-accent-500 animate-spin" />
      <p className="text-sm text-bolt-elements-textSecondary">Fetching frames from Figma...</p>
    </div>
  );

  const renderSelect = () => (
    <div className="space-y-4">
      {fileName && (
        <p className="text-sm text-bolt-elements-textSecondary">
          File: <span className="font-medium text-bolt-elements-textPrimary">{fileName}</span> &middot; {frames.length}{' '}
          frame{frames.length !== 1 ? 's' : ''} found
        </p>
      )}

      <div className="flex items-center justify-between">
        <span className="text-sm text-bolt-elements-textSecondary">
          {selection.length} of {frames.length} selected
        </span>
        <button onClick={handleSelectAll} className="text-xs text-accent-500 hover:underline font-medium">
          {selection.length === frames.length ? 'Deselect All' : 'Select All'}
        </button>
      </div>

      <div className="max-h-[320px] overflow-y-auto space-y-2 pr-1">
        {frames.map((frame) => (
          <label
            key={frame.id}
            className={classNames(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg border cursor-pointer transition-all',
              selection.includes(frame.id)
                ? 'border-accent-500/40 bg-accent-500/5'
                : 'border-bolt-elements-borderColor hover:border-bolt-elements-borderColor/60 bg-bolt-elements-background-depth-2',
            )}
          >
            <input
              type="checkbox"
              checked={selection.includes(frame.id)}
              onChange={() => handleToggleFrame(frame.id)}
              className="w-4 h-4 rounded border-bolt-elements-borderColor text-accent-500 focus:ring-accent-500/40"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-bolt-elements-textPrimary truncate">{frame.name}</p>
              <p className="text-xs text-bolt-elements-textTertiary font-mono">{frame.id}</p>
            </div>
            <div className="i-ph:frame-corners text-lg text-bolt-elements-textTertiary flex-shrink-0" />
          </label>
        ))}
      </div>

      <div className="flex justify-between gap-2 pt-2">
        <Button variant="outline" onClick={handleRetry}>
          Back
        </Button>
        <Button
          onClick={handleImport}
          disabled={selection.length === 0}
          className="bg-accent-500 text-white hover:bg-accent-600 disabled:opacity-50"
        >
          Import {selection.length > 0 ? `(${selection.length})` : ''}
        </Button>
      </div>
    </div>
  );

  const renderImporting = () => (
    <div className="flex flex-col items-center justify-center py-12 gap-4">
      <div className="i-svg-spinners:90-ring-with-bg text-4xl text-accent-500 animate-spin" />
      <p className="text-sm text-bolt-elements-textSecondary">
        Importing frames... ({progress.current}/{progress.total})
      </p>
      <div className="w-full max-w-xs bg-bolt-elements-background-depth-2 rounded-full h-2 overflow-hidden">
        <div
          className="h-full bg-accent-500 rounded-full transition-all duration-300"
          style={{
            width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 0}%`,
          }}
        />
      </div>
    </div>
  );

  const renderDone = () => (
    <div className="flex flex-col items-center justify-center py-12 gap-4">
      <div className="w-14 h-14 rounded-full bg-green-500/10 flex items-center justify-center">
        <div className="i-ph:check-circle text-3xl text-green-500" />
      </div>
      <p className="text-sm font-medium text-bolt-elements-textPrimary">Import Complete</p>
      <p className="text-sm text-bolt-elements-textSecondary text-center max-w-sm">
        {progress.current} frame{progress.current !== 1 ? 's were' : ' was'} imported to{' '}
        <code className="text-accent-500">/public/figma/</code> in your project.
      </p>
      <Button onClick={handleClose} className="mt-2 bg-accent-500 text-white hover:bg-accent-600">
        Done
      </Button>
    </div>
  );

  const renderError = () => (
    <div className="flex flex-col items-center justify-center py-12 gap-4">
      <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center">
        <div className="i-ph:x-circle text-3xl text-red-500" />
      </div>
      <p className="text-sm font-medium text-bolt-elements-textPrimary">Import Failed</p>
      <p className="text-sm text-bolt-elements-textSecondary text-center max-w-sm">
        {error || 'An unexpected error occurred'}
      </p>
      <div className="flex gap-2 mt-2">
        <Button variant="outline" onClick={handleClose}>
          Close
        </Button>
        <Button onClick={handleRetry} className="bg-accent-500 text-white hover:bg-accent-600">
          Try Again
        </Button>
      </div>
    </div>
  );

  const renderStep = () => {
    switch (step) {
      case 'entry':
        return renderEntry();
      case 'loading':
        return renderLoading();
      case 'select':
        return renderSelect();
      case 'importing':
        return renderImporting();
      case 'done':
        return renderDone();
      case 'error':
        return renderError();
      default:
        return renderEntry();
    }
  };

  return (
    <RadixDialog.Root open={open} onOpenChange={(isOpen) => figmaDialogOpen.set(isOpen)}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fixed inset-0 bg-black/70 dark:bg-black/80 backdrop-blur-sm z-[9998]" />
        <RadixDialog.Content
          aria-describedby={undefined}
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[9999] focus:outline-none w-full max-w-lg"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: '-40%', x: '-50%' }}
            animate={{ opacity: 1, scale: 1, y: '-50%', x: '-50%' }}
            exit={{ opacity: 0, scale: 0.96, y: '-40%', x: '-50%' }}
            className="bg-bolt-elements-background-depth-1 rounded-xl shadow-2xl border border-bolt-elements-borderColor overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-bolt-elements-borderColor flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2">
                <div className="i-ph:figma-logo text-xl text-accent-500" />
                Import from Figma
              </DialogTitle>
              <button
                onClick={handleClose}
                className="flex items-center justify-center w-8 h-8 rounded-full bg-transparent hover:bg-bolt-elements-item-backgroundActive transition-colors"
                disabled={step === 'importing'}
              >
                <div className="i-ph:x w-4 h-4 text-bolt-elements-textTertiary" />
              </button>
            </div>

            <div className="px-6 py-5">{renderStep()}</div>
          </motion.div>
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
};
