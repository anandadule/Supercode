import { memo } from 'react';
import { getInitials } from '~/lib/stores/collaboration';

interface PresenceAvatarProps {
  name: string;
  color: string;
  isYou?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showDot?: boolean;
}

const sizeClasses = {
  sm: 'w-5 h-5 text-[10px]',
  md: 'w-7 h-7 text-xs',
  lg: 'w-9 h-9 text-sm',
};

const dotSizeClasses = {
  sm: 'w-1.5 h-1.5',
  md: 'w-2 h-2',
  lg: 'w-2.5 h-2.5',
};

export const PresenceAvatar = memo(
  ({ name, color, isYou = false, size = 'md', showDot = false }: PresenceAvatarProps) => {
    return (
      <div className="relative inline-flex items-center justify-center shrink-0">
        <div
          className={`${sizeClasses[size]} rounded-full flex items-center justify-center font-medium text-white select-none`}
          style={{ backgroundColor: color }}
          title={`${name}${isYou ? ' (You)' : ''}`}
        >
          {getInitials(name)}
        </div>
        {showDot && (
          <span
            className={`${dotSizeClasses[size]} rounded-full absolute -bottom-0.5 -right-0.5 ring-1 ring-white`}
            style={{ backgroundColor: color }}
          />
        )}
      </div>
    );
  },
);

interface PresenceAvatarsStackProps {
  collaborators: Array<{ name: string; color: string; id: string }>;
  myId?: string;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
}

export const PresenceAvatarsStack = memo(({ collaborators, myId, max = 4, size = 'sm' }: PresenceAvatarsStackProps) => {
  const visible = collaborators.slice(0, max);
  const overflow = collaborators.length - max;

  return (
    <div className="flex items-center -space-x-1.5">
      {visible.map((collab) => (
        <div key={collab.id} className="ring-1 ring-white rounded-full">
          <PresenceAvatar name={collab.name} color={collab.color} isYou={collab.id === myId} size={size} />
        </div>
      ))}
      {overflow > 0 && (
        <div className="w-5 h-5 rounded-full bg-bolt-elements-background-depth-3 flex items-center justify-center text-[10px] text-bolt-elements-textTertiary font-medium ring-1 ring-white">
          +{overflow}
        </div>
      )}
    </div>
  );
});
