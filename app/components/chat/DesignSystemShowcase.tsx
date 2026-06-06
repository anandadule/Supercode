import React from 'react';
import { toast } from 'react-toastify';

const DESIGN_SYSTEMS = [
  { name: 'React', icon: 'i-bolt:react', system: 'React Library' },
  { name: 'Vue', icon: 'i-bolt:vue', system: 'Vue Framework' },
  { name: 'Angular', icon: 'i-bolt:angular', system: 'Angular Framework' },
  { name: 'Svelte', icon: 'i-bolt:svelte', system: 'Svelte Framework' },
  { name: 'Next.js', icon: 'i-bolt:nextjs', system: 'Next.js Framework' },
  { name: 'shadcn/ui', icon: 'i-bolt:shadcn', system: 'shadcn/ui Design' },
];

export function DesignSystemShowcase() {
  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <h2 className="text-xl md:text-2xl font-bold text-bolt-elements-textPrimary mb-3">
          Your framework, now in Supercode
        </h2>
        <p className="text-sm text-bolt-elements-textSecondary">
          Use your favorite frameworks and components to build for production
        </p>
      </div>
      <div className="grid grid-cols-3 md:grid-cols-6 gap-4 md:gap-6">
        {DESIGN_SYSTEMS.map((ds) => (
          <div key={ds.name} className="flex flex-col items-center gap-2 group cursor-pointer">
            <div className="w-16 h-16 rounded-2xl bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor flex items-center justify-center group-hover:border-accent-500/50 group-hover:shadow-lg group-hover:shadow-accent-500/10 transition-all duration-300">
              <span
                className={`${ds.icon} text-3xl text-bolt-elements-textSecondary group-hover:text-accent-500 transition-colors`}
              />
            </div>
            <span className="text-xs font-medium text-bolt-elements-textTertiary group-hover:text-bolt-elements-textPrimary transition-colors">
              {ds.name}
            </span>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-center gap-4 mt-8">
        <button
          type="button"
          onClick={() => toast.info('Design systems docs coming soon')}
          className="text-xs text-bolt-elements-textSecondary hover:text-accent-500 transition-colors"
        >
          Learn more
        </button>
        <span className="text-bolt-elements-textTertiary">·</span>
        <button
          onClick={() => {
            const input = document.getElementById('folder-import');
            input?.click();
          }}
          className="text-xs font-medium text-accent-500 hover:text-accent-400 transition-colors"
        >
          Import your project
        </button>
      </div>
    </div>
  );
}
