import React from 'react';

const FEATURES = [
  {
    icon: 'i-ph:robot',
    title: 'Multiple AI Models',
    description: 'Choose from leading AI models including Claude, GPT, and more — all in one familiar interface.',
  },
  {
    icon: 'i-ph:folder',
    title: 'Full File System',
    description: 'Built-in code editor with syntax highlighting, file tree navigation, and real-time preview.',
  },
  {
    icon: 'i-ph:rocket',
    title: 'One-click Deploy',
    description: 'Deploy your apps to Netlify, Vercel, or Cloudflare Pages directly from the chat.',
  },
  {
    icon: 'i-ph:git-branch',
    title: 'Git Integration',
    description: 'Import projects from GitHub or GitLab and manage version control seamlessly.',
  },
  {
    icon: 'i-ph:paint-bucket',
    title: 'Custom Themes',
    description: 'Light and dark themes with a comprehensive design token system for personalized experiences.',
  },
  {
    icon: 'i-ph:package',
    title: 'Starter Templates',
    description: 'Begin from production-ready templates like Next.js, Vue, Svelte, Astro, and more.',
  },
];

export function FeatureGrid() {
  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <h2 className="text-xl md:text-2xl font-bold text-bolt-elements-textPrimary mb-3">
          Everything you need to build
        </h2>
        <p className="text-sm text-bolt-elements-textSecondary max-w-xl mx-auto">
          A complete development environment powered by AI — from idea to deployment.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {FEATURES.map((feature) => (
          <div
            key={feature.title}
            className="p-5 rounded-2xl border border-bolt-elements-borderColor bg-bolt-elements-background-depth-2/30 hover:bg-bolt-elements-background-depth-2 hover:border-accent-500/20 transition-all duration-300 group"
          >
            <div className="w-10 h-10 rounded-xl bg-accent-500/10 flex items-center justify-center mb-4 group-hover:bg-accent-500/20 group-hover:scale-110 transition-all duration-300">
              <span className={`${feature.icon} text-xl text-accent-500`} />
            </div>
            <h3 className="text-sm font-semibold text-bolt-elements-textPrimary mb-2">{feature.title}</h3>
            <p className="text-xs text-bolt-elements-textSecondary leading-relaxed">{feature.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
