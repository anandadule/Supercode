import React, { useEffect, useState } from 'react';
import type { Template } from '~/types/template';
import { loadStarterTemplates } from '~/utils/starterTemplates';

interface FrameworkIconProps {
  template: Template;
}

const FrameworkIcon: React.FC<FrameworkIconProps> = ({ template }) => (
  <a
    href={`/git?url=https://github.com/${template.githubRepo}.git`}
    data-state="closed"
    data-discover="true"
    className="flex flex-col items-center gap-1.5 group"
    title={template.label}
  >
    <div className="w-12 h-12 rounded-xl bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor flex items-center justify-center group-hover:border-accent-500/40 group-hover:bg-accent-500/5 transition-all duration-300">
      <span
        className={`${template.icon} text-2xl text-bolt-elements-textSecondary group-hover:text-accent-500 transition-colors duration-300`}
      />
    </div>
    <span className="text-[10px] text-bolt-elements-textTertiary group-hover:text-bolt-elements-textPrimary transition-colors whitespace-nowrap">
      {template.label}
    </span>
  </a>
);

const StarterTemplates: React.FC = () => {
  const [templates, setTemplates] = useState<Template[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadStarterTemplates().then((t) => {
      if (!cancelled) {
        setTemplates(t);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="flex flex-col items-center gap-5 mt-6">
      <p className="text-xs text-bolt-elements-textTertiary font-medium uppercase tracking-wider">
        Or start with a template
      </p>
      <div className="flex justify-center">
        <div className="flex flex-wrap justify-center items-start gap-3 max-w-xl min-h-[60px]">
          {templates
            ? templates.map((template) => <FrameworkIcon key={template.name} template={template} />)
            : // Skeleton so the empty-state height doesn't pop in when templates load
              Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="w-12 h-12 rounded-xl bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor animate-pulse"
                />
              ))}
        </div>
      </div>
    </div>
  );
};

export default StarterTemplates;
