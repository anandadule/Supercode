import { useState, useEffect, useCallback } from 'react';
import { json, type MetaFunction } from '@remix-run/cloudflare';
import { ClientOnly } from 'remix-utils/client-only';
import { Header } from '~/components/header/Header';
import BackgroundRays from '~/components/ui/BackgroundRays';
import { ProjectList } from '~/components/projects/ProjectList';
import { getAll, db } from '~/lib/persistence';
import type { ChatHistoryItem } from '~/lib/persistence';

export const meta: MetaFunction = () => {
  return [
    { title: 'Projects - Supercode' },
    {
      name: 'description',
      content: 'Browse and manage your Supercode projects',
    },
  ];
};

export const loader = () => json({});

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div
          key={i}
          className="bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor rounded-xl p-5 animate-pulse"
        >
          <div className="h-4 bg-bolt-elements-background-depth-3 rounded w-3/4 mb-3" />
          <div className="h-3 bg-bolt-elements-background-depth-3 rounded w-1/2 mb-2" />
          <div className="h-3 bg-bolt-elements-background-depth-3 rounded w-1/3" />
        </div>
      ))}
    </div>
  );
}

function ProjectsContent() {
  const [projects, setProjects] = useState<ChatHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadProjects = useCallback(async () => {
    try {
      if (db) {
        const items = await getAll(db);
        setProjects(items.filter((item) => item.urlId));
      }
    } catch (error) {
      console.error('Failed to load projects:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const handleRefresh = useCallback(() => {
    loadProjects();
  }, [loadProjects]);

  return (
    <main className="flex-1 overflow-auto">
      <div className="max-w-6xl mx-auto px-4 lg:px-8 py-8">
        <div className="mb-8 flex items-center gap-4">
          <a
            href="/"
            className="flex items-center justify-center w-9 h-9 rounded-lg bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary hover:bg-bolt-elements-background-depth-3 transition-colors"
            title="Back to home"
          >
            <span className="i-ph:arrow-left text-lg" />
          </a>
          <div>
            <h1 className="text-2xl font-semibold text-bolt-elements-textPrimary">Projects</h1>
            <p className="mt-1 text-sm text-bolt-elements-textTertiary">Browse and manage your saved projects</p>
          </div>
        </div>
        {loading ? (
          <SkeletonGrid />
        ) : (
          <ProjectList
            projects={projects}
            onDeleted={handleRefresh}
            onDuplicated={handleRefresh}
            onStarChanged={handleRefresh}
          />
        )}
      </div>
    </main>
  );
}

export default function Projects() {
  return (
    <div className="flex flex-col h-full w-full bg-bolt-elements-background-depth-1">
      <BackgroundRays />
      <Header />
      <ClientOnly
        fallback={
          <main className="flex-1 overflow-auto">
            <div className="max-w-6xl mx-auto px-4 lg:px-8 py-8">
              <div className="mb-8 flex items-center gap-4">
                <a
                  href="/"
                  className="flex items-center justify-center w-9 h-9 rounded-lg bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary hover:bg-bolt-elements-background-depth-3 transition-colors"
                  title="Back to home"
                >
                  <span className="i-ph:arrow-left text-lg" />
                </a>
                <div>
                  <h1 className="text-2xl font-semibold text-bolt-elements-textPrimary">Projects</h1>
                  <p className="mt-1 text-sm text-bolt-elements-textTertiary">Browse and manage your saved projects</p>
                </div>
              </div>
              <SkeletonGrid />
            </div>
          </main>
        }
      >
        {() => <ProjectsContent />}
      </ClientOnly>
    </div>
  );
}
