import React from 'react';

const BRANDS = [
  { name: 'React', icon: 'i-bolt:react' },
  { name: 'Next.js', icon: 'i-bolt:nextjs' },
  { name: 'Vue', icon: 'i-bolt:vue' },
  { name: 'Svelte', icon: 'i-bolt:svelte' },
  { name: 'Angular', icon: 'i-bolt:angular' },
  { name: 'shadcn/ui', icon: 'i-bolt:shadcn' },
];

export function SocialProof() {
  return (
    <div className="w-full py-8 px-4">
      <p className="text-center text-xs text-bolt-elements-textTertiary font-medium uppercase tracking-wider mb-6">
        The #1 professional AI coding tool trusted by developers using
      </p>
      <div className="flex flex-wrap justify-center gap-6 md:gap-10 max-w-4xl mx-auto">
        {BRANDS.map((brand) => (
          <div
            key={brand.name}
            className="flex flex-col items-center gap-1.5 opacity-50 hover:opacity-80 transition-opacity duration-300"
          >
            <span className={`${brand.icon} text-2xl text-bolt-elements-textSecondary`} />
            <span className="text-[10px] text-bolt-elements-textTertiary font-medium">{brand.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
