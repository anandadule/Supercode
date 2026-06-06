import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useSearchParams } from '@remix-run/react';
import { classNames } from '~/utils/classNames';
import type { ChatHistoryItem } from '~/lib/persistence';
import { ProjectCard } from './ProjectCard';

interface ProjectListProps {
  projects: ChatHistoryItem[];
  onDeleted: () => void;
  onDuplicated: () => void;
  onStarChanged?: () => void;
}

export function ProjectList({ projects, onDeleted, onDuplicated, onStarChanged }: ProjectListProps) {
  const [searchParams] = useSearchParams();
  const filter = searchParams.get('filter');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  const filteredAndSorted = useMemo(() => {
    let result = [...projects];

    if (filter === 'starred') {
      result = result.filter((p) => p.starred);
    } else if (filter === 'recent') {
      /*
       * The default sort is by timestamp descending, so "recent" is the
       * natural view of the same list. We still apply an explicit filter
       * so future per-item hide-from-recent logic can hook in here.
       */
      result = result.filter((p) => Boolean(p.timestamp));
    } else if (filter === 'shared') {
      /*
       * No backend yet — the result is always empty and the empty-state
       * explains that. The hook is here so adding `shared: true` to a
       * ChatHistoryItem later will Just Work.
       */
      result = result.filter((p) => Boolean((p as ChatHistoryItem & { shared?: boolean }).shared));
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((p) => p.description?.toLowerCase().includes(query));
    }

    result.sort((a, b) => {
      const dateA = new Date(a.timestamp || 0).getTime();
      const dateB = new Date(b.timestamp || 0).getTime();

      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });

    return result;
  }, [projects, searchQuery, sortOrder, filter]);

  const filterLabel =
    filter === 'starred'
      ? 'Starred'
      : filter === 'recent'
        ? 'Recently viewed'
        : filter === 'shared'
          ? 'Shared with you'
          : 'All projects';

  return (
    <div className="flex flex-col gap-6">
      {/* Active filter chip */}
      {filter && (
        <div className="flex items-center gap-2 text-xs text-bolt-elements-textSecondary">
          <span className="i-ph:funnel text-sm" />
          <span>Showing:</span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent-500/10 text-accent-500 border border-accent-500/20 font-medium">
            {filter === 'starred' && <span className="i-ph:star-fill" />}
            {filter === 'recent' && <span className="i-ph:clock-counter-clockwise" />}
            {filter === 'shared' && <span className="i-ph:share-network" />}
            {filterLabel}
          </span>
          <a
            href="/projects"
            className="ml-1 text-bolt-elements-textTertiary hover:text-bolt-elements-textPrimary transition-colors"
          >
            Clear
          </a>
        </div>
      )}

      {/* Search and Sort Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <span className="i-ph:magnifying-glass h-4 w-4 text-bolt-elements-textTertiary" />
          </div>
          <input
            type="search"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-bolt-elements-background-depth-2 pl-9 pr-3 py-2.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-accent-500/50 text-sm text-bolt-elements-textPrimary placeholder-bolt-elements-textTertiary border border-bolt-elements-borderColor transition-colors"
          />
        </div>
        <button
          onClick={() => setSortOrder((prev) => (prev === 'newest' ? 'oldest' : 'newest'))}
          className={classNames(
            'flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm transition-colors cursor-pointer',
            'bg-bolt-elements-background-depth-2 border-bolt-elements-borderColor',
            'text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary hover:bg-bolt-elements-background-depth-3',
          )}
          aria-label={`Sort by ${sortOrder === 'newest' ? 'oldest' : 'newest'} first`}
        >
          <span
            className={classNames(
              'i-ph:arrow-down text-base transition-transform',
              sortOrder === 'oldest' ? 'rotate-180' : '',
            )}
          />
          <span className="hidden sm:inline">{sortOrder === 'newest' ? 'Newest' : 'Oldest'}</span>
        </button>
      </div>

      {/* Project Grid */}
      {filteredAndSorted.length > 0 ? (
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: {
              transition: {
                staggerChildren: 0.05,
              },
            },
          }}
        >
          {filteredAndSorted.map((project) => (
            <motion.div
              key={project.id}
              variants={{
                hidden: { opacity: 0, y: 10 },
                visible: { opacity: 1, y: 0 },
              }}
            >
              <ProjectCard
                item={project}
                onDeleted={onDeleted}
                onDuplicated={onDuplicated}
                onStarChanged={onStarChanged}
              />
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          {projects.length === 0 ? (
            <>
              <div className="w-16 h-16 rounded-2xl bg-bolt-elements-background-depth-2 flex items-center justify-center mb-4">
                <span className="i-ph:folder-open text-3xl text-bolt-elements-textTertiary" />
              </div>
              <h3 className="text-lg font-medium text-bolt-elements-textPrimary mb-2">No projects yet</h3>
              <p className="text-sm text-bolt-elements-textTertiary mb-6 max-w-sm">
                Start a new chat to create your first project. Your conversations and code will be saved here
                automatically.
              </p>
              <a
                href="/"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-accent-500 text-white text-sm font-medium hover:bg-accent-600 transition-colors shadow-lg shadow-accent-500/25"
              >
                <span className="i-ph:plus-circle text-base" />
                Start new chat
              </a>
            </>
          ) : (
            <>
              <div className="w-16 h-16 rounded-2xl bg-bolt-elements-background-depth-2 flex items-center justify-center mb-4">
                <span
                  className={`${filter === 'starred' ? 'i-ph:star' : filter === 'shared' ? 'i-ph:share-network' : filter === 'recent' ? 'i-ph:clock-counter-clockwise' : 'i-ph:magnifying-glass'} text-3xl text-bolt-elements-textTertiary`}
                />
              </div>
              <h3 className="text-lg font-medium text-bolt-elements-textPrimary mb-2">
                {filter === 'starred'
                  ? 'No starred projects'
                  : filter === 'recent'
                    ? 'No recent activity'
                    : filter === 'shared'
                      ? 'No shared projects'
                      : 'No matches found'}
              </h3>
              <p className="text-sm text-bolt-elements-textTertiary mb-6">
                {filter === 'starred'
                  ? 'Click the star on a project card to add it here.'
                  : filter === 'recent'
                    ? 'Projects you open will show up here.'
                    : filter === 'shared'
                      ? 'Projects others share with you will appear here.'
                      : 'Try a different search term or clear the filter.'}
              </p>
              {filter ? (
                <a
                  href="/projects"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-accent-500 text-white text-sm font-medium hover:bg-accent-600 transition-colors shadow-lg shadow-accent-500/25"
                >
                  <span className="i-ph:funnel-x text-base" />
                  Show all projects
                </a>
              ) : (
                <button
                  onClick={() => setSearchQuery('')}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-bolt-elements-background-depth-2 text-bolt-elements-textPrimary text-sm font-medium hover:bg-bolt-elements-background-depth-3 transition-colors border border-bolt-elements-borderColor cursor-pointer"
                >
                  <span className="i-ph:x-circle text-base" />
                  Clear search
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
