import { json, type MetaFunction } from '@remix-run/cloudflare';
import { ClientOnly } from 'remix-utils/client-only';
import { Header } from '~/components/header/Header';
import BackgroundRays from '~/components/ui/BackgroundRays';
import { GuideContent } from '~/components/guide/GuideContent';

export const meta: MetaFunction = () => {
  return [
    { title: 'User Guide - Supercode' },
    {
      name: 'description',
      content: 'Complete user guide for Supercode AI-powered development environment',
    },
  ];
};

export const loader = () => json({});

export default function Guide() {
  return (
    <div className="flex flex-col h-full w-full bg-bolt-elements-background-depth-1">
      <BackgroundRays />
      <Header />
      <ClientOnly
        fallback={
          <div className="flex-1 flex items-center justify-center text-bolt-elements-textTertiary">
            Loading guide...
          </div>
        }
      >
        {() => <GuideContent />}
      </ClientOnly>
    </div>
  );
}
