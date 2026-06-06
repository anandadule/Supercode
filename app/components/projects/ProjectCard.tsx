import { memo, useState } from 'react';
import { useNavigate } from '@remix-run/react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { classNames } from '~/utils/classNames';
import { db, duplicateChat, deleteById, setChatStarred } from '~/lib/persistence';
import type { ChatHistoryItem } from '~/lib/persistence';
import { Dialog, DialogButton, DialogRoot, DialogTitle, DialogDescription } from '~/components/ui/Dialog';

interface ProjectCardProps {
  item: ChatHistoryItem;
  onDeleted: () => void;
  onDuplicated: () => void;
  onStarChanged?: () => void;
}

export const ProjectCard = memo(({ item, onDeleted, onDuplicated, onStarChanged }: ProjectCardProps) => {
  const navigate = useNavigate();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isStarred, setIsStarred] = useState<boolean>(Boolean(item.starred));

  const messageCount = item.messages?.length ?? 0;
  const dateStr = item.timestamp ? formatDistanceToNow(new Date(item.timestamp), { addSuffix: true }) : 'Unknown date';

  const handleOpen = () => {
    if (item.urlId) {
      navigate(`/chat/${item.urlId}`);
    }
  };

  const handleToggleStar = async (event: React.MouseEvent) => {
    event.stopPropagation();

    if (!db) {
      toast.error('Database not available');
      return;
    }

    const next = !isStarred;

    // Optimistic update so the icon flips instantly; roll back on error.
    setIsStarred(next);

    try {
      await setChatStarred(db, item.id, next);
      onStarChanged?.();
    } catch (error) {
      setIsStarred(!next);
      toast.error('Failed to update star');
      console.error(error);
    }
  };

  const handleFork = async () => {
    if (!db) {
      toast.error('Database not available');
      return;
    }

    try {
      const newUrlId = await duplicateChat(db, item.id);
      navigate(`/chat/${newUrlId}`);
      toast.success('Chat forked successfully');
      onDuplicated();
    } catch (error) {
      toast.error('Failed to fork chat');
      console.error(error);
    }
  };

  const handleDelete = async () => {
    if (!db) {
      toast.error('Database not available');
      return;
    }

    try {
      await deleteById(db, item.id);
      toast.success('Chat deleted successfully');
      setShowDeleteDialog(false);
      onDeleted();
    } catch (error) {
      toast.error('Failed to delete chat');
      console.error(error);
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="group relative bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor rounded-xl p-5 hover:border-accent-500/40 transition-all duration-200 hover:shadow-lg hover:shadow-accent-500/5 hover:bg-bolt-elements-background-depth-3"
      >
        <div className="flex items-start justify-between gap-2">
          <button onClick={handleOpen} className="flex-1 text-left min-w-0 cursor-pointer bg-transparent">
            <h3 className="text-sm font-medium text-bolt-elements-textPrimary truncate">
              {item.description || 'Untitled Chat'}
            </h3>
          </button>

          <button
            type="button"
            onClick={handleToggleStar}
            className={classNames(
              'shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-transparent',
              'hover:bg-bolt-elements-item-backgroundActive transition-colors cursor-pointer',
              isStarred
                ? 'text-yellow-400 opacity-100'
                : 'text-bolt-elements-textTertiary opacity-0 group-hover:opacity-100 focus:opacity-100',
            )}
            aria-label={isStarred ? 'Unstar project' : 'Star project'}
            aria-pressed={isStarred}
            title={isStarred ? 'Unstar' : 'Star'}
          >
            <span className={`${isStarred ? 'i-ph:star-fill' : 'i-ph:star'} text-lg`} />
          </button>

          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button
                className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-transparent text-bolt-elements-textTertiary hover:text-bolt-elements-textPrimary hover:bg-bolt-elements-item-backgroundActive transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 cursor-pointer"
                aria-label="Project actions"
              >
                <span className="i-ph:dots-three-vertical text-lg" />
              </button>
            </DropdownMenu.Trigger>

            <DropdownMenu.Portal>
              <DropdownMenu.Content
                className={classNames(
                  'min-w-[180px] rounded-lg p-1.5',
                  'bg-bolt-elements-background-depth-2',
                  'border border-bolt-elements-borderColor',
                  'shadow-lg z-[1000]',
                  'animate-in fade-in-80 zoom-in-95',
                )}
                sideOffset={5}
                align="end"
              >
                <DropdownMenu.Item
                  className="relative flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-bolt-elements-textPrimary hover:bg-bolt-elements-background-depth-3 transition-colors cursor-pointer outline-none"
                  onSelect={handleOpen}
                >
                  <span className="i-ph:arrow-square-out text-base" />
                  Open
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  className="relative flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-bolt-elements-textPrimary hover:bg-bolt-elements-background-depth-3 transition-colors cursor-pointer outline-none"
                  onSelect={handleFork}
                >
                  <span className="i-ph:copy text-base" />
                  Fork
                </DropdownMenu.Item>
                <DropdownMenu.Separator className="h-px bg-bolt-elements-borderColor my-1" />
                <DropdownMenu.Item
                  className="relative flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer outline-none"
                  onSelect={(event) => {
                    event.preventDefault();
                    setShowDeleteDialog(true);
                  }}
                >
                  <span className="i-ph:trash text-base" />
                  Delete
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>

        <div className="mt-3 flex items-center gap-3 text-xs text-bolt-elements-textTertiary">
          <span className="flex items-center gap-1">
            <span className="i-ph:clock text-sm" />
            {dateStr}
          </span>
          <span className="flex items-center gap-1">
            <span className="i-ph:chat-dots text-sm" />
            {messageCount} message{messageCount !== 1 ? 's' : ''}
          </span>
        </div>
      </motion.div>

      <DialogRoot open={showDeleteDialog}>
        <Dialog onClose={() => setShowDeleteDialog(false)} onBackdrop={() => setShowDeleteDialog(false)}>
          <div className="p-6 bg-bolt-elements-background-depth-1">
            <DialogTitle className="text-bolt-elements-textPrimary">Delete Project?</DialogTitle>
            <DialogDescription className="mt-2 text-bolt-elements-textSecondary">
              <p>
                You are about to delete{' '}
                <span className="font-medium text-bolt-elements-textPrimary">{item.description || 'this project'}</span>
              </p>
              <p className="mt-2">Are you sure you want to delete this project?</p>
            </DialogDescription>
          </div>
          <div className="flex justify-end gap-3 px-6 py-4 bg-bolt-elements-background-depth-2 border-t border-bolt-elements-borderColor">
            <DialogButton type="secondary" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </DialogButton>
            <DialogButton type="danger" onClick={handleDelete}>
              Delete
            </DialogButton>
          </div>
        </Dialog>
      </DialogRoot>
    </>
  );
});
