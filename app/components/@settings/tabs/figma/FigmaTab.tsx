import React, { useEffect, useState } from 'react';
import { useStore } from '@nanostores/react';
import { figmaToken, initFigmaToken } from '~/lib/stores/figma';
import { Button } from '~/components/ui/Button';
import { toast } from 'react-toastify';

const FigmaLogo = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M12 2H8a4 4 0 0 0 0 8h4V2Z" />
    <path d="M12 10H8a4 4 0 0 0 0 8h4v-8Z" stroke="#1ABCFE" />
    <path d="M12 10h4a4 4 0 0 1 0 8h-4v-8Z" stroke="#0ACF83" />
    <path d="M12 2h4a4 4 0 0 1 0 8h-4V2Z" stroke="#FF7262" />
    <path d="M8 18a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" stroke="#F24E1E" />
  </svg>
);

export default function FigmaTab() {
  const storedToken = useStore(figmaToken);
  const [localToken, setLocalToken] = useState('');
  const [showToken, setShowToken] = useState(false);

  useEffect(() => {
    initFigmaToken();
  }, []);

  useEffect(() => {
    setLocalToken(storedToken);
  }, [storedToken]);

  const handleSave = () => {
    figmaToken.set(localToken);
    toast.success('Figma access token saved');
  };

  const handleClear = () => {
    setLocalToken('');
    figmaToken.set('');
    toast.success('Figma access token cleared');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <FigmaLogo />
        <h2 className="text-lg font-medium text-bolt-elements-textPrimary">Figma Integration</h2>
      </div>

      <p className="text-sm text-bolt-elements-textSecondary">
        Connect your Figma account to import design frames directly into your project. Generate a personal access token
        from your{' '}
        <a
          href="https://www.figma.com/developers/api#access-tokens"
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent-500 hover:underline"
        >
          Figma Account Settings
        </a>
        .
      </p>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-bolt-elements-textPrimary mb-1.5">Access Token</label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type={showToken ? 'text' : 'password'}
                value={localToken}
                onChange={(e) => setLocalToken(e.target.value)}
                placeholder="figd_xxxx..."
                className="w-full px-3 py-2 pr-10 rounded-lg border border-bolt-elements-borderColor bg-bolt-elements-background-depth-2 text-bolt-elements-textPrimary text-sm placeholder:text-bolt-elements-textTertiary focus:outline-none focus:ring-2 focus:ring-accent-500/40 focus:border-accent-500"
              />
              <button
                type="button"
                onClick={() => setShowToken(!showToken)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-bolt-elements-textTertiary hover:text-bolt-elements-textSecondary transition-colors"
                title={showToken ? 'Hide token' : 'Show token'}
              >
                <div className={showToken ? 'i-ph:eye-slash w-4 h-4' : 'i-ph:eye w-4 h-4'} />
              </button>
            </div>
          </div>
          <p className="mt-1 text-xs text-bolt-elements-textTertiary">
            Your token is stored locally and never sent to our servers.
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleSave}
            disabled={!localToken}
            className="bg-accent-500 text-white hover:bg-accent-600 disabled:opacity-50"
          >
            Save Token
          </Button>
          <Button variant="outline" onClick={handleClear} disabled={!storedToken && !localToken}>
            Clear Token
          </Button>
        </div>
      </div>

      <div className="border-t border-bolt-elements-borderColor pt-6 mt-6">
        <h3 className="text-sm font-medium text-bolt-elements-textPrimary mb-2">How to use</h3>
        <ol className="text-sm text-bolt-elements-textSecondary space-y-1.5 list-decimal list-inside">
          <li>Generate a Figma personal access token from your account settings</li>
          <li>Paste the token above and click Save Token</li>
          <li>
            Click the Figma icon (<div className="i-ph:figma-logo inline-block text-sm align-middle" />) in the chat
            toolbar
          </li>
          <li>Paste a Figma file URL and select the frames to import</li>
          <li>
            Frames are saved as SVGs in <code className="text-accent-500">/public/figma/</code>
          </li>
        </ol>
      </div>
    </div>
  );
}
