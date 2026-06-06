/* eslint-disable @blitz/lines-around-comment */
import { classNames } from '~/utils/classNames';
import { figmaDialogOpen } from '~/lib/stores/figma';
import { teamTemplateDialogOpen } from '~/lib/stores/teamTemplate';

interface StartFromOption {
  label: string;
  icon: string;
  description: string;
  kind: 'figma' | 'github' | 'team';
  href?: string;
}

const START_FROM_OPTIONS: StartFromOption[] = [
  {
    label: 'Figma',
    icon: 'i-ph:figma-logo',
    description: 'Import from Figma',
    kind: 'figma',
  },
  {
    label: 'GitHub',
    icon: 'i-ph:github-logo',
    description: 'Clone from GitHub',
    kind: 'github',
    href: '/git',
  },
  {
    label: 'Team template',
    icon: 'i-ph:layout',
    description: 'Start from a template',
    kind: 'team',
  },
];

export default function LandingBottom() {
  const handleClick = (option: StartFromOption) => {
    if (option.kind === 'figma') {
      figmaDialogOpen.set(true);
    } else if (option.kind === 'team') {
      teamTemplateDialogOpen.set(true);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 px-4 pb-12 pt-6 z-10">
      <p className="text-[11px] text-bolt-elements-textTertiary font-medium uppercase tracking-widest">or start from</p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        {START_FROM_OPTIONS.map((option) => {
          const className = classNames(
            /*
             * justify-center centers the icon+label group within the button;
             * min-w-[160px] gives every button a consistent width so the
             * centering is visible (otherwise the button auto-sizes to its
             * content and the label visually hugs the icon on the left).
             */
            'flex items-center justify-center gap-3 min-w-[160px] px-4 py-2 rounded-full',
            'bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor hover:bg-bolt-elements-background-depth-3 hover:border-bolt-elements-borderColor/80',
            'text-bolt-elements-textTertiary hover:text-bolt-elements-textPrimary transition-all duration-200 group',
          );

          if (option.kind === 'github' && option.href) {
            return (
              <a key={option.label} href={option.href} className={className} title={option.description}>
                <span className="text-lg text-bolt-elements-textTertiary group-hover:text-bolt-elements-textPrimary transition-colors">
                  <span className={option.icon} />
                </span>
                <div className="text-center">
                  <p className="text-xs font-medium">{option.label}</p>
                </div>
              </a>
            );
          }

          return (
            <button
              key={option.label}
              type="button"
              onClick={() => handleClick(option)}
              className={className}
              title={option.description}
            >
              <span className="text-lg text-bolt-elements-textTertiary group-hover:text-bolt-elements-textPrimary transition-colors">
                <span className={option.icon} />
              </span>
              <div className="text-center">
                <p className="text-xs font-medium">{option.label}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
