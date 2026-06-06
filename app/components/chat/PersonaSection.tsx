import React from 'react';

const PERSONAS = [
  {
    icon: 'i-ph:user-gear',
    title: 'Product managers',
    description: 'Go from insight to prototype in hours and test ideas with your team before the day is over.',
  },
  {
    icon: 'i-ph:rocket',
    title: 'Entrepreneurs',
    description: 'Launch a full business in days, not months. From landing page to product, all in one flow.',
  },
  {
    icon: 'i-ph:megaphone',
    title: 'Marketers',
    description: 'Spin up high-performing campaign pages in hours, with built-in analytics and deployment.',
  },
  {
    icon: 'i-ph:buildings',
    title: 'Agencies',
    description: 'Multiply your impact: deliver more projects, faster, without scaling headcount.',
  },
  {
    icon: 'i-ph:student',
    title: 'Students & builders',
    description: 'Learn by doing. Take ideas from class or side projects and turn them into fully working apps.',
  },
];

export function PersonaSection() {
  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <h2 className="text-xl md:text-2xl font-bold text-bolt-elements-textPrimary mb-2">Whatever your role</h2>
        <p className="text-sm text-bolt-elements-textSecondary">Supercode gives you superpowers</p>
        <p className="text-xs text-bolt-elements-textTertiary mt-2 max-w-xl mx-auto">
          From idea to live product, Supercode adapts to the way you work — turning every vision into something real
          &amp; fast.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {PERSONAS.map((persona) => (
          <div
            key={persona.title}
            className="p-5 rounded-2xl border border-bolt-elements-borderColor bg-bolt-elements-background-depth-2/30 hover:bg-bolt-elements-background-depth-2 hover:border-accent-500/20 transition-all duration-300 group card-hover-lift"
          >
            <div className="w-10 h-10 rounded-xl bg-accent-500/10 flex items-center justify-center mb-4 group-hover:bg-accent-500/20 group-hover:scale-110 transition-all duration-300">
              <span className={`${persona.icon} text-xl text-accent-500`} />
            </div>
            <h3 className="text-sm font-semibold text-bolt-elements-textPrimary mb-2 capitalize">{persona.title}</h3>
            <p className="text-xs text-bolt-elements-textSecondary leading-relaxed">{persona.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
