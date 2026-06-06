import { classNames } from '~/utils/classNames';

interface DiscussModeProps {
  chatMode?: 'discuss' | 'build';
  setChatMode?: (mode: 'discuss' | 'build') => void;
}

export function DiscussMode({ chatMode, setChatMode }: DiscussModeProps) {
  if (chatMode !== 'discuss') {
    return null;
  }

  return (
    <div className="px-4 py-3 mx-auto w-full max-w-chat mb-2">
      <div className="p-4 rounded-2xl border border-accent-500/20 bg-accent-500/5">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-accent-500/10 flex items-center justify-center shrink-0 mt-0.5">
            <span className="i-ph:clipboard-text text-accent-500 text-lg" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-bolt-elements-textPrimary mb-1">Plan Mode Active</h3>
            <p className="text-xs text-bolt-elements-textSecondary leading-relaxed">
              I'll help you plan your project by generating a blueprint, architecture overview, component tree, and
              implementation roadmap — without writing any code yet. Describe your project idea below.
            </p>
            <button
              onClick={() => setChatMode?.('build')}
              className={classNames(
                'mt-3 text-xs font-medium flex items-center gap-1.5',
                'text-accent-500 hover:text-accent-600 transition-colors',
              )}
            >
              <span className="i-ph:rocket-launch text-sm" />
              Switch to Build mode to start coding
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
