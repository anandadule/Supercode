import { useCallback, useEffect, useRef } from 'react';
import { autoFixEnabled, autoFixInProgress, autoFixHistory, type AutoFixAttempt } from '~/lib/stores/autoFix';
import { workbenchStore } from '~/lib/stores/workbench';
import type { File } from '~/lib/stores/files';

const MAX_AUTO_FIX_ATTEMPTS = 3;

export function useAutoFix() {
  const fixCountRef = useRef(0);
  const previousAlertRef = useRef<string>('');

  const triggerFix = useCallback(async (errorText: string, source: 'terminal' | 'preview' | 'build') => {
    if (!autoFixEnabled.get() || autoFixInProgress.get()) {
      return;
    }

    if (fixCountRef.current >= MAX_AUTO_FIX_ATTEMPTS) {
      return;
    }

    // Don't re-trigger for the same error
    if (errorText === previousAlertRef.current) {
      return;
    }

    previousAlertRef.current = errorText;

    autoFixInProgress.set(true);
    fixCountRef.current++;

    const attemptId = `fix_${Date.now()}`;
    const attempt: AutoFixAttempt = {
      id: attemptId,
      timestamp: new Date().toISOString(),
      error: errorText,
      errorSource: source,
      success: false,
      messages: ['Analyzing error and attempting fix...'],
    };

    try {
      // Get current file context
      const files = workbenchStore.files.get();
      const fileEntries = (Object.entries(files).filter(([, v]) => v?.type === 'file') as Array<[string, File]>)
        .slice(0, 15)
        .map(([path, file]) => `// ${path}\n${file.content}`)
        .join('\n\n---\n\n');

      const response = await fetch('/api/llmcall', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: `You are an expert debugger. Analyze the error below and provide a fix.
The error occurred in a web project running in WebContainer (browser-based Node.js).
Respond with a JSON object: { "analysis": "short description", "fix": "exact code or command to run", "fixType": "file" | "shell" | "none", "filePath": "path if file fix" }

Error source: ${source}`,
            },
            {
              role: 'user',
              content: `Error: ${errorText}\n\nCurrent project files:\n${fileEntries || '(no files)'}`,
            },
          ],
        }),
      });

      const data = (await response.json()) as {
        analysis?: string;
        fix?: string;
        fixType?: 'file' | 'shell' | 'none';
        filePath?: string;
      };
      attempt.messages.push(`Fix attempt: ${data.analysis || 'Analyzed error'}`);
      attempt.fixSummary = data.analysis;
      attempt.success = data.fixType !== 'none';

      if (data.fixType === 'file' && data.filePath && data.fix) {
        workbenchStore.files.setKey(data.filePath, { type: 'file', content: data.fix, isBinary: false });
        attempt.messages.push(`Applied fix to ${data.filePath}`);
      } else if (data.fixType === 'shell' && data.fix) {
        attempt.messages.push(`Suggested command: ${data.fix}`);
      }
    } catch (err) {
      attempt.messages.push(`Auto-fix failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      autoFixInProgress.set(false);

      const history = autoFixHistory.get();
      autoFixHistory.set([attempt, ...history]);
    }
  }, []);

  // Watch for action alerts
  useEffect(() => {
    const unsubscribe = workbenchStore.actionAlert.subscribe((alert) => {
      if (alert?.type === 'error' || alert?.type === 'FAILED') {
        const errorText = `${alert.title || ''} ${alert.description || ''}`.trim();

        if (errorText) {
          triggerFix(errorText, 'terminal');
        }
      }
    });

    return () => unsubscribe();
  }, [triggerFix]);

  return {
    triggerFix,
    resetFixCount: () => {
      fixCountRef.current = 0;
    },
  };
}
