import { useState, useMemo } from 'react';
import { classNames } from '~/utils/classNames';
import { ThemeSwitch } from '~/components/ui/ThemeSwitch';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { ControlPanel } from '~/components/@settings/core/ControlPanel';
import { toast } from 'react-toastify';
import { useStore } from '@nanostores/react';
import { profileStore } from '~/lib/stores/profile';

const NAV_ITEMS = [
  { id: 'home', label: 'Home', icon: 'i-ph:house', href: '/' },
  { id: 'projects', label: 'Projects', icon: 'i-ph:folder', href: '/projects' },
  { id: 'starred', label: 'Starred', icon: 'i-ph:star', href: '/projects?filter=starred' },
  { id: 'recent', label: 'Recently viewed', icon: 'i-ph:clock-counter-clockwise', href: '/projects?filter=recent' },
  { id: 'shared', label: 'Shared with you', icon: 'i-ph:share-network', href: '/projects?filter=shared' },
  { id: 'guide', label: 'User Guide', icon: 'i-ph:book-open', href: '/guide' },
];

const SOCIAL_ICONS = [
  { icon: 'i-ph:discord-logo', href: 'https://discord.com/', label: 'Discord' },
  { icon: 'i-ph:linkedin-logo', href: 'https://www.linkedin.com/', label: 'LinkedIn' },
  { icon: 'i-ph:x-logo', href: 'https://x.com/', label: 'X' },
  { icon: 'i-ph:reddit-logo', href: 'https://www.reddit.com/', label: 'Reddit' },
];

export default function LandingSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const profile = useStore(profileStore);

  const filteredNavItems = useMemo(
    () => NAV_ITEMS.filter((item) => item.label.toLowerCase().includes(searchQuery.toLowerCase())),
    [searchQuery],
  );

  return (
    <>
      {/* Mobile overlay */}
      {!collapsed && <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setCollapsed(true)} />}

      <div className="relative flex h-full">
        <aside
          className={classNames(
            'h-full flex flex-col',
            'bg-bolt-elements-background-depth-1 border-r border-bolt-elements-borderColor',
            'transition-all duration-200 bolt-ease-cubic-bezier text-sm overflow-hidden',
            collapsed ? 'w-0 opacity-0' : 'w-[300px]',
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-bolt-elements-borderColor bg-bolt-elements-background-depth-2/70 shrink-0">
            <a href="/" className="flex items-center gap-2 select-none hover:opacity-90 mr-6">
              <img
                src="/supercode-logo.png"
                alt="Supercode Logo"
                className={classNames(
                  'rounded-lg object-contain transition-all duration-300',
                  collapsed ? 'w-8 h-8' : 'w-36',
                )}
              />
            </a>
            <div className="ml-auto flex items-center gap-3">
              {!collapsed && (
                <>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 i-ph:magnifying-glass text-sm text-bolt-elements-textTertiary pointer-events-none" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && searchQuery.trim()) {
                          window.location.href = `/projects?q=${encodeURIComponent(searchQuery.trim())}`;
                        }
                      }}
                      placeholder="Search..."
                      className="w-28 pl-8 pr-2 py-1.5 rounded-md bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor text-xs text-bolt-elements-textPrimary placeholder-bolt-elements-textTertiary focus:outline-none focus:border-bolt-elements-borderColorActive transition-colors"
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* User profile / plan box */}
          {!collapsed && (
            <DropdownMenu.Root>
              <div className="px-3 pt-3 border-b border-bolt-elements-borderColor/30 shrink-0">
                <DropdownMenu.Trigger asChild>
                  <div className="flex items-center gap-2 p-1.5 rounded-lg bg-bolt-elements-background-depth-3 border border-bolt-elements-borderColor/50 hover:bg-bolt-elements-background-depth-2 transition-all duration-200 cursor-pointer">
                    <div className="w-6 h-6 rounded-md bg-blue-600/30 border border-blue-500/30 flex items-center justify-center text-blue-200 text-[10px] font-semibold shrink-0">
                      {profile?.username ? profile.username.charAt(0).toUpperCase() : 'G'}
                    </div>
                    <span className="text-sm font-medium text-bolt-elements-textPrimary truncate flex-1">
                      {profile?.username || 'Guest'}
                    </span>
                    <div className="i-ph:caret-down text-xs text-bolt-elements-textTertiary shrink-0" />
                  </div>
                </DropdownMenu.Trigger>
              </div>

              <DropdownMenu.Portal>
                <DropdownMenu.Content
                  className={classNames(
                    'min-w-[200px] z-[250]',
                    'bg-bolt-elements-background-depth-3',
                    'rounded-lg shadow-lg',
                    'border border-bolt-elements-borderColor/50',
                    'overflow-hidden',
                  )}
                  sideOffset={0}
                  align="start"
                >
                  <DropdownMenu.Item
                    className={classNames(
                      'flex items-center gap-2 px-4 py-2.5',
                      'text-sm text-bolt-elements-textSecondary',
                      'hover:bg-bolt-elements-background-depth-2 hover:text-bolt-elements-textPrimary',
                      'cursor-pointer transition-all duration-150 outline-none group',
                    )}
                    onClick={() => toast.info('Sign in feature coming soon')}
                  >
                    <div className="i-ph:sign-in w-4 h-4 text-bolt-elements-textTertiary group-hover:text-bolt-elements-textSecondary transition-colors" />
                    Sign In
                  </DropdownMenu.Item>

                  <div className="border-t border-bolt-elements-borderColor/30" />

                  <DropdownMenu.Item
                    className={classNames(
                      'flex items-center gap-2 px-4 py-2.5',
                      'text-sm text-bolt-elements-textSecondary',
                      'hover:bg-bolt-elements-background-depth-2 hover:text-bolt-elements-textPrimary',
                      'cursor-pointer transition-all duration-150 outline-none group',
                    )}
                    onClick={() => setSettingsOpen(true)}
                  >
                    <div className="i-ph:gear-six w-4 h-4 text-bolt-elements-textTertiary group-hover:text-bolt-elements-textSecondary transition-colors" />
                    Settings
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          )}

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
            {filteredNavItems.length === 0 ? (
              <div className="px-3 py-4 text-xs text-bolt-elements-textTertiary text-center">No results found</div>
            ) : (
              filteredNavItems.map((item) => {
                /*
                 * Highlight the active nav item. We compare both pathname and
                 * the `filter` query param so /projects?filter=starred correctly
                 * highlights the "Starred" item rather than "Projects".
                 */
                const isActive =
                  typeof window !== 'undefined' &&
                  window.location.pathname === '/projects' &&
                  item.href === `/projects?filter=${window.location.search.split('filter=')[1] || ''}`;

                return (
                  <a
                    key={item.id}
                    href={item.href}
                    className={classNames(
                      'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-all duration-150 group',
                      collapsed ? 'justify-center' : '',
                      isActive
                        ? 'bg-bolt-elements-item-backgroundActive text-bolt-elements-item-contentActive font-medium'
                        : 'text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary hover:bg-bolt-elements-item-backgroundActive',
                    )}
                    title={collapsed ? item.label : undefined}
                  >
                    <span
                      className={classNames(
                        item.icon,
                        'text-lg shrink-0',
                        isActive
                          ? 'text-bolt-elements-item-contentActive'
                          : 'text-bolt-elements-textTertiary group-hover:text-bolt-elements-textSecondary',
                      )}
                    />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </a>
                );
              })
            )}
          </nav>

          {/* Sidebar Bottom */}
          <div
            className={classNames(
              'border-t border-bolt-elements-borderColor p-3 flex items-center shrink-0',
              collapsed ? 'flex-col gap-3 justify-center' : 'justify-between',
            )}
          >
            {collapsed ? (
              <>
                <div className="w-7 h-7 rounded-md bg-blue-600/35 border border-blue-500/40 flex items-center justify-center text-blue-200 text-xs font-semibold shrink-0 cursor-pointer hover:opacity-95">
                  A
                </div>
                <ThemeSwitch />
              </>
            ) : (
              <>
                <div className="flex items-center gap-1">
                  {SOCIAL_ICONS.map((social) => (
                    <a
                      key={social.label}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-7 h-7 rounded-md flex items-center justify-center text-bolt-elements-textTertiary hover:text-bolt-elements-textPrimary hover:bg-bolt-elements-item-backgroundActive transition-all duration-150"
                      title={social.label}
                    >
                      <span className={`${social.icon} text-base`} />
                    </a>
                  ))}
                </div>
                <ThemeSwitch />
              </>
            )}
          </div>
        </aside>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={classNames(
            'absolute left-full top-4 z-50',
            'w-6 h-6 rounded-full bg-bolt-elements-background-depth-3 border border-bolt-elements-borderColor',
            'flex items-center justify-center text-xs text-bolt-elements-textSecondary',
            'hover:text-bolt-elements-textPrimary transition-colors',
          )}
        >
          <div className={classNames(collapsed ? 'i-ph:caret-right' : 'i-ph:caret-left')} />
        </button>
      </div>
      <ControlPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  );
}
