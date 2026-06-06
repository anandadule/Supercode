import React from 'react';

const RESOURCES = [
  { label: 'Documentation', href: '#' },
  { label: 'GitHub', href: 'https://github.com/stackblitz/bolt.new' },
  { label: 'API Reference', href: '#' },
  { label: 'Status', href: '#' },
];

const SOCIAL = [
  { icon: 'i-ph:github-logo', href: 'https://github.com/stackblitz/bolt.new', label: 'GitHub' },
  { icon: 'i-ph:discord-logo', href: 'https://discord.gg/bolt', label: 'Discord' },
  { icon: 'i-ph:twitter-logo', href: '#', label: 'Twitter' },
];

export function FooterSection() {
  return (
    <footer className="w-full border-t border-bolt-elements-borderColor mt-16">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-6 h-6 rounded-lg bg-accent-500 flex items-center justify-center text-white text-[10px] font-bold">
                S
              </span>
              <span className="text-sm font-bold text-bolt-elements-textPrimary">Supercode</span>
            </div>
            <p className="text-xs text-bolt-elements-textTertiary leading-relaxed max-w-xs">
              AI-powered full-stack web development environment. Build stunning apps &amp; websites by chatting with AI.
            </p>
            <p className="text-xs text-bolt-elements-textTertiary mt-3">
              Developed by <span className="text-bolt-elements-textSecondary">Anand Adule</span>
            </p>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-bolt-elements-textPrimary uppercase tracking-wider mb-4">
              Resources
            </h4>
            <ul className="space-y-2.5">
              {RESOURCES.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    target={link.href.startsWith('http') ? '_blank' : undefined}
                    rel={link.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                    className="text-xs text-bolt-elements-textTertiary hover:text-bolt-elements-textPrimary transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-bolt-elements-textPrimary uppercase tracking-wider mb-4">
              Social
            </h4>
            <div className="flex items-center gap-3">
              {SOCIAL.map((social) => (
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
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-bolt-elements-borderColor">
          <p className="text-[11px] text-bolt-elements-textTertiary text-center">
            &copy; {new Date().getFullYear()} Supercode. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
