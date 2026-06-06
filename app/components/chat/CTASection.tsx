import React from 'react';
import { classNames } from '~/utils/classNames';

interface CtaSectionProps {
  chatMode?: 'discuss' | 'build';
  setChatMode?: (mode: 'discuss' | 'build') => void;
}

export function CtaSection({ chatMode, setChatMode }: CtaSectionProps) {
  return (
    <div className="w-full px-4 py-16">
      <div className="max-w-2xl mx-auto text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-bolt-elements-textPrimary mb-3">
          Ready to build something amazing?
        </h2>
        <p className="text-sm text-bolt-elements-textSecondary mb-8">Try it out and start building for free</p>
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setChatMode?.('build')}
            className={classNames(
              'px-8 py-3 rounded-full font-semibold text-sm transition-all duration-200 glow-accent',
              chatMode === 'build' || !chatMode
                ? 'bg-accent-500 text-white shadow-lg shadow-accent-500/25 hover:bg-accent-600'
                : 'border border-bolt-elements-borderColor text-bolt-elements-textPrimary hover:bg-bolt-elements-background-depth-2',
            )}
          >
            <span className="flex items-center gap-2">
              <span className="i-ph:rocket-launch text-lg" />
              Let's build
            </span>
          </button>
          <button
            onClick={() => setChatMode?.('discuss')}
            className={classNames(
              'px-8 py-3 rounded-full font-semibold text-sm transition-all duration-200',
              chatMode === 'discuss'
                ? 'bg-accent-500 text-white shadow-lg shadow-accent-500/25 hover:bg-accent-600'
                : 'border border-bolt-elements-borderColor text-bolt-elements-textPrimary hover:bg-bolt-elements-background-depth-2',
            )}
          >
            <span className="flex items-center gap-2">
              <span className="i-ph:clipboard-text text-lg" />
              Plan
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
