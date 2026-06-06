import React, { useEffect, useState } from 'react';
import { useStore } from '@nanostores/react';
import * as RadixDialog from '@radix-ui/react-dialog';
import { motion } from 'framer-motion';
import { useNavigate } from '@remix-run/react';
import { DialogTitle } from '~/components/ui/Dialog';
import { Button } from '~/components/ui/Button';
import { teamTemplateDialogOpen } from '~/lib/stores/teamTemplate';
import { loadStarterTemplates } from '~/utils/starterTemplates';
import type { Template } from '~/types/template';

export const TeamTemplateDialog: React.FC = () => {
  const open = useStore(teamTemplateDialogOpen);
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<Template[] | null>(null);

  // Load templates lazily when the dialog is first opened.
  useEffect(() => {
    if (!open || templates) {
      return;
    }

    let cancelled = false;
    loadStarterTemplates().then((t) => {
      if (!cancelled) {
        setTemplates(t);
      }
    });

    // eslint-disable-next-line consistent-return
    return () => {
      cancelled = true;
    };
  }, [open, templates]);

  const handleSelect = (githubRepo: string) => {
    teamTemplateDialogOpen.set(false);
    navigate(`/git?url=https://github.com/${githubRepo}.git`);
  };

  const handleClose = () => {
    teamTemplateDialogOpen.set(false);
  };

  return (
    <RadixDialog.Root open={open} onOpenChange={(isOpen) => teamTemplateDialogOpen.set(isOpen)}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fixed inset-0 bg-black/70 dark:bg-black/80 backdrop-blur-sm z-[9998]" />
        <RadixDialog.Content
          aria-describedby={undefined}
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[9999] focus:outline-none w-[calc(100%-2rem)] max-w-2xl max-h-[90vh]"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            className="bg-bolt-elements-background-depth-1 rounded-xl shadow-2xl border border-bolt-elements-borderColor overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="px-6 py-4 border-b border-bolt-elements-borderColor flex items-center justify-between flex-shrink-0">
              <DialogTitle className="flex items-center gap-2">
                <div className="i-ph:layout text-xl text-accent-500" />
                Team Templates
              </DialogTitle>
              <button
                onClick={handleClose}
                className="flex items-center justify-center w-8 h-8 rounded-full bg-transparent hover:bg-bolt-elements-item-backgroundActive transition-colors"
              >
                <div className="i-ph:x w-4 h-4 text-bolt-elements-textTertiary" />
              </button>
            </div>

            <div className="px-6 py-5 overflow-y-auto flex-1">
              <p className="text-sm text-bolt-elements-textSecondary mb-4">
                Pick a starter template to clone and start from.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 min-h-[200px]">
                {templates
                  ? templates.map((template) => (
                      <button
                        key={template.name}
                        onClick={() => handleSelect(template.githubRepo)}
                        className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor hover:border-accent-500/40 hover:bg-accent-500/5 transition-all duration-200 group"
                        title={template.description}
                      >
                        <div className="w-10 h-10 rounded-lg bg-bolt-elements-background-depth-3 flex items-center justify-center group-hover:bg-accent-500/10 transition-colors">
                          <span
                            className={`${template.icon} text-xl text-bolt-elements-textSecondary group-hover:text-accent-500 transition-colors`}
                          />
                        </div>
                        <span className="text-[11px] text-bolt-elements-textTertiary group-hover:text-bolt-elements-textPrimary transition-colors text-center leading-tight">
                          {template.label}
                        </span>
                      </button>
                    ))
                  : Array.from({ length: 6 }).map((_, i) => (
                      <div
                        key={i}
                        className="h-[88px] rounded-xl bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor animate-pulse"
                      />
                    ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 px-6 py-4 border-t border-bolt-elements-borderColor flex-shrink-0">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
            </div>
          </motion.div>
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
};

export default TeamTemplateDialog;
