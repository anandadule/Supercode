import React from 'react';

const FEATURES = [
  {
    icon: 'i-ph:check-circle',
    title: 'Always the best, without switching tools',
    stat: '98%',
    statLabel: 'less errors',
    description:
      'Supercode integrates the frontier coding agents from the AI labs directly inside one familiar visual interface. No more AI anxiety or juggling multiple platforms.',
  },
  {
    icon: 'i-ph:buildings',
    title: 'Build big without breaking',
    description:
      'Supercode handles projects 1,000 times larger than before. Its improved built-in context management handles complexity and keeps your projects running smoothly.',
  },
  {
    icon: 'i-ph:paint-bucket',
    title: 'Build with your design system',
    description: 'Stop building from scratch. Start building on-brand with your existing components and design tokens.',
  },
];

export function FeatureCards() {
  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <h2 className="text-xl md:text-2xl font-bold text-bolt-elements-textPrimary mb-3">
          Empowering product builders with the most powerful coding agents
        </h2>
        <p className="text-sm text-bolt-elements-textSecondary max-w-2xl mx-auto">
          Supercode does the heavy lifting for you, so you can focus on your vision instead of fighting errors.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {FEATURES.map((feature) => (
          <div
            key={feature.title}
            className="p-6 rounded-2xl border border-bolt-elements-borderColor bg-bolt-elements-background-depth-2/50 hover:bg-bolt-elements-background-depth-2 transition-all duration-300 group card-hover-lift"
          >
            <div className="w-10 h-10 rounded-xl bg-accent-500/10 flex items-center justify-center mb-4 group-hover:bg-accent-500/20 transition-colors">
              <span className={`${feature.icon} text-xl text-accent-500`} />
            </div>
            <h3 className="text-base font-semibold text-bolt-elements-textPrimary mb-2">{feature.title}</h3>
            {feature.stat && (
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-2xl font-bold text-accent-500">{feature.stat}</span>
                <span className="text-xs text-bolt-elements-textTertiary">{feature.statLabel}</span>
              </div>
            )}
            <p className="text-sm text-bolt-elements-textSecondary leading-relaxed">{feature.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
