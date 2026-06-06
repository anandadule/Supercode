import React from 'react';

const EXAMPLE_PROMPTS = [
  { text: 'Build a landing page for a SaaS product', icon: 'i-ph:globe' },
  { text: 'Create a mobile app with Expo', icon: 'i-ph:device-mobile' },
  { text: 'Build a full-stack Next.js dashboard', icon: 'i-ph:chart-bar' },
  { text: 'Make an e-commerce storefront', icon: 'i-ph:shopping-cart' },
  { text: 'Create a blog with Astro + Tailwind', icon: 'i-ph:pencil-line' },
  { text: 'Build a real-time chat application', icon: 'i-ph:chat-dots' },
];

export function ExamplePrompts(sendMessage?: { (event: React.UIEvent, messageInput?: string): void | undefined }) {
  return (
    <div id="examples" className="relative flex flex-col gap-6 w-full max-w-3xl mx-auto flex justify-center mt-8">
      <p className="text-center text-xs text-bolt-elements-textTertiary font-medium uppercase tracking-wider">
        Try these examples
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        {EXAMPLE_PROMPTS.map((examplePrompt, index: number) => {
          return (
            <button
              key={index}
              onClick={(event) => {
                sendMessage?.(event, examplePrompt.text);
              }}
              className="flex items-center gap-1.5 border border-bolt-elements-borderColor rounded-full bg-bolt-elements-background-depth-2 hover:bg-bolt-elements-background-depth-3 text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary px-4 py-2 text-xs transition-all duration-200 hover:border-accent-500/30 hover:shadow-sm"
            >
              <span className={`${examplePrompt.icon} text-sm opacity-70`} />
              {examplePrompt.text}
            </button>
          );
        })}
      </div>
    </div>
  );
}
