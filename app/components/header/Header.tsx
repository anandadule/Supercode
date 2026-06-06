import { useStore } from '@nanostores/react';
import { ClientOnly } from 'remix-utils/client-only';
import { chatStore } from '~/lib/stores/chat';
import { classNames } from '~/utils/classNames';
import { HeaderActionButtons } from './HeaderActionButtons.client';
import { ChatDescription } from '~/lib/persistence/ChatDescription.client';

const NAV_LINKS = [
  { label: 'Projects', href: '/projects', external: false },
  { label: 'Community', href: 'https://discord.gg/bolt', external: true },
  { label: 'GitHub', href: 'https://github.com/stackblitz/bolt.new', external: true },
];

const SOCIAL_ICONS = [
  { icon: 'i-ph:github-logo', href: 'https://github.com/stackblitz/bolt.new', label: 'GitHub' },
  { icon: 'i-ph:discord-logo', href: 'https://discord.gg/bolt', label: 'Discord' },
];

export function Header() {
  const chat = useStore(chatStore);

  if (!chat.started) {
    return null;
  }

  return (
    <header
      className={classNames(
        'flex items-center justify-between px-4 lg:px-8 h-[var(--header-height)] border-b backdrop-blur-md bg-bolt-elements-background-depth-1/80 border-bolt-elements-borderColor',
      )}
    >
      {!chat.started && (
        <div className="flex items-center gap-4 flex-1 justify-center px-4 max-w-2xl mx-auto">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor/40 w-full text-sm text-bolt-elements-textTertiary cursor-pointer hover:bg-bolt-elements-background-depth-3 transition-colors">
            <span className="i-ph:magnifying-glass text-sm shrink-0" />
            <span>Search</span>
            <span className="ml-auto text-xs px-1.5 py-0.5 rounded bg-bolt-elements-background-depth-3 border border-bolt-elements-borderColor/30">
              Ctrl+K
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                target={link.external ? '_blank' : undefined}
                rel={link.external ? 'noopener noreferrer' : undefined}
                className="text-sm text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary transition-colors duration-200"
              >
                {link.label}
              </a>
            ))}
          </nav>
        </div>
      )}

      {chat.started && (
        <span className="flex-1 px-4 truncate text-center text-bolt-elements-textPrimary text-sm max-w-[40%]">
          <ClientOnly>{() => <ChatDescription />}</ClientOnly>
        </span>
      )}

      <div className="flex items-center gap-3">
        {!chat.started && (
          <>
            <div className="hidden sm:flex items-center gap-2 mr-2">
              {SOCIAL_ICONS.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-bolt-elements-textTertiary hover:text-bolt-elements-textPrimary hover:bg-bolt-elements-background-depth-2 transition-all duration-200"
                  title={social.label}
                >
                  <span className={`${social.icon} text-lg`} />
                </a>
              ))}
            </div>
            <a
              href="https://github.com/stackblitz/bolt.new"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1.5 text-xs text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary transition-colors mr-1"
            >
              <span className="i-ph:star text-sm" />
              <span className="hidden lg:inline">Star on GitHub</span>
            </a>
            <button
              type="button"
              onClick={() => {
                /*
                 * The empty-state page has exactly one main chat textarea.
                 * Focus it (and scroll into view) so the user can start typing immediately.
                 */
                const textarea = document.querySelector<HTMLTextAreaElement>('textarea');
                textarea?.focus({ preventScroll: false });
                textarea?.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }}
              className="px-4 py-1.5 rounded-full bg-accent-500 text-white text-sm font-semibold hover:bg-accent-600 transition-all duration-200 shadow-lg shadow-accent-500/25"
            >
              Get started
            </button>
          </>
        )}
        {chat.started && (
          <ClientOnly>
            {() => (
              <div className="flex items-center gap-2">
                <HeaderActionButtons chatStarted={chat.started} />
              </div>
            )}
          </ClientOnly>
        )}
      </div>
    </header>
  );
}
