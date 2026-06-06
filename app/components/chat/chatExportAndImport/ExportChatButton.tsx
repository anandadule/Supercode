import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { workbenchStore } from '~/lib/stores/workbench';
import { classNames } from '~/utils/classNames';
import Cookies from 'js-cookie';
import { useStore } from '@nanostores/react';
import { useState } from 'react';
import { useChatHistory } from '~/lib/persistence';
import { description as descriptionAtom } from '~/lib/persistence/useChatHistory';
import { shareChatAsGist } from './exportGist';

export const ExportChatButton = ({ exportChat }: { exportChat?: () => void }) => {
  const { getCurrentMessages } = useChatHistory();
  const description = useStore(descriptionAtom);
  const [gistLoading, setGistLoading] = useState(false);

  const handleShareAsGist = async () => {
    const token = Cookies.get('githubToken');
    setGistLoading(true);

    try {
      const messages = await getCurrentMessages();
      await shareChatAsGist(description || 'Bolt chat', messages || [], token);
    } finally {
      setGistLoading(false);
    }
  };

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger className="rounded-md items-center justify-center [&:is(:disabled,.disabled)]:cursor-not-allowed [&:is(:disabled,.disabled)]:opacity-60 w-7 h-7 bg-transparent text-bolt-elements-textTertiary hover:text-bolt-elements-textPrimary hover:bg-bolt-elements-item-backgroundActive transition-colors flex outline-none">
        <div className="i-ph:download-simple text-sm" />
      </DropdownMenu.Trigger>
      <DropdownMenu.Content
        className={classNames(
          'z-[250]',
          'bg-bolt-elements-background-depth-2',
          'rounded-lg shadow-lg',
          'border border-bolt-elements-borderColor',
          'animate-in fade-in-0 zoom-in-95',
          'py-1',
        )}
        sideOffset={5}
        align="end"
      >
        <DropdownMenu.Item
          className={classNames(
            'cursor-pointer flex items-center w-auto px-4 py-2 text-sm text-bolt-elements-textPrimary hover:bg-bolt-elements-item-backgroundActive gap-2 rounded-md group relative',
          )}
          onClick={() => {
            workbenchStore.downloadZip();
          }}
        >
          <div className="i-ph:code size-4.5"></div>
          <span>Download Code</span>
        </DropdownMenu.Item>
        <DropdownMenu.Item
          className={classNames(
            'cursor-pointer flex items-center w-full px-4 py-2 text-sm text-bolt-elements-textPrimary hover:bg-bolt-elements-item-backgroundActive gap-2 rounded-md group relative',
          )}
          onClick={() => exportChat?.()}
        >
          <div className="i-ph:chat size-4.5"></div>
          <span>Export Chat</span>
        </DropdownMenu.Item>
        <DropdownMenu.Separator className="my-1 h-px bg-bolt-elements-borderColor" />
        <DropdownMenu.Item
          className={classNames(
            'cursor-pointer flex items-center w-full px-4 py-2 text-sm text-bolt-elements-textPrimary hover:bg-bolt-elements-item-backgroundActive gap-2 rounded-md group relative',
            gistLoading && 'opacity-60 pointer-events-none',
          )}
          onClick={handleShareAsGist}
          disabled={gistLoading}
        >
          <div className="i-ph:github-logo size-4.5"></div>
          <span>{gistLoading ? 'Creating Gist...' : 'Share as GitHub Gist'}</span>
        </DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  );
};
