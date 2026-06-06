/* eslint-disable @blitz/lines-around-comment */
import { useStore } from '@nanostores/react';
import { useState, useEffect, useMemo } from 'react';
import { classNames } from '~/utils/classNames';
import {
  promptLibraryItems,
  promptCategories,
  selectedCategory,
  promptLibraryOpen,
  addUserPrompt,
  removeUserPrompt,
  loadUserPrompts,
  type PromptItem,
} from '~/lib/stores/promptLibrary';

interface PromptLibraryProps {
  onSelectPrompt: (prompt: string) => void;
}

export function PromptLibrary({ onSelectPrompt }: PromptLibraryProps) {
  const items = useStore(promptLibraryItems);
  const categories = useStore(promptCategories);
  const activeCategory = useStore(selectedCategory);
  const isOpen = useStore(promptLibraryOpen);
  const [localSearch, setLocalSearch] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPrompt, setNewPrompt] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadUserPrompts();
    }
  }, [isOpen]);

  const filteredItems = useMemo(() => {
    let result = items;

    if (activeCategory !== 'All') {
      result = result.filter((item) => item.category === activeCategory);
    }

    if (localSearch.trim()) {
      const query = localSearch.toLowerCase();
      result = result.filter(
        (item) =>
          item.name.toLowerCase().includes(query) ||
          item.description.toLowerCase().includes(query) ||
          item.prompt.toLowerCase().includes(query),
      );
    }

    return result;
  }, [items, activeCategory, localSearch]);

  const handleCreatePrompt = () => {
    if (!newName.trim() || !newPrompt.trim()) {
      return;
    }

    addUserPrompt({
      name: newName.trim(),
      description: '',
      prompt: newPrompt.trim(),
      category: 'General',
    });
    setNewName('');
    setNewPrompt('');
    setShowCreateDialog(false);
  };

  const handleSelect = (item: PromptItem) => {
    onSelectPrompt(item.prompt);
    promptLibraryOpen.set(false);
  };

  if (!isOpen && !showCreateDialog) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-[600px] max-h-[80vh] bg-bolt-elements-background-depth-1 rounded-xl border border-bolt-elements-borderColor shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-bolt-elements-borderColor">
          <h2 className="text-lg font-semibold text-bolt-elements-textPrimary">Prompt Library</h2>
          <button
            onClick={() => {
              promptLibraryOpen.set(false);
              setShowCreateDialog(false);
            }}
            className="p-1 hover:bg-bolt-elements-background-depth-2 rounded transition-colors text-bolt-elements-item-contentDefault"
          >
            <div className="i-ph:x text-xl" />
          </button>
        </div>

        {showCreateDialog ? (
          /* Create Prompt Form */
          <div className="p-4 flex flex-col gap-3">
            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Prompt name..."
              className="w-full px-3 py-2 text-sm bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor rounded-lg text-bolt-elements-textPrimary outline-none focus:border-accent-500"
            />
            <textarea
              value={newPrompt}
              onChange={(e) => setNewPrompt(e.target.value)}
              placeholder="Enter your prompt..."
              rows={6}
              className="w-full px-3 py-2 text-sm bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor rounded-lg text-bolt-elements-textPrimary outline-none focus:border-accent-500 resize-none"
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowCreateDialog(false)}
                className="px-4 py-2 text-sm rounded-lg bg-bolt-elements-background-depth-2 text-bolt-elements-textPrimary hover:bg-bolt-elements-background-depth-3 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreatePrompt}
                disabled={!newName.trim() || !newPrompt.trim()}
                className="px-4 py-2 text-sm rounded-lg bg-accent-500 text-white hover:bg-accent-600 disabled:opacity-50 transition-colors"
              >
                Save Prompt
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Search */}
            <div className="px-4 py-2">
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 i-ph:magnifying-glass text-sm text-bolt-elements-textTertiary" />
                <input
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                  placeholder="Search prompts..."
                  className="w-full pl-8 pr-3 py-2 text-sm bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor rounded-lg text-bolt-elements-textPrimary outline-none focus:border-accent-500"
                />
              </div>
            </div>

            {/* Categories */}
            <div className="px-4 pb-2 flex gap-2 overflow-x-auto">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => selectedCategory.set(cat)}
                  className={classNames(
                    'px-3 py-1 text-xs font-medium rounded-full transition-colors shrink-0',
                    activeCategory === cat
                      ? 'bg-accent-500 text-white'
                      : 'bg-bolt-elements-background-depth-2 text-bolt-elements-textTertiary hover:text-bolt-elements-textPrimary',
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Prompt List */}
            <div className="flex-1 overflow-y-auto px-4 pb-4">
              {filteredItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="i-ph:book-open-text text-3xl text-bolt-elements-textTertiary mb-2" />
                  <p className="text-sm text-bolt-elements-textTertiary">No prompts found</p>
                  <button
                    onClick={() => setShowCreateDialog(true)}
                    className="mt-2 text-sm text-accent-500 hover:text-accent-400 transition-colors"
                  >
                    Create a new prompt
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => setShowCreateDialog(true)}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-dashed border-bolt-elements-borderColor text-bolt-elements-textTertiary hover:text-accent-500 hover:border-accent-500/50 transition-colors text-sm"
                  >
                    <div className="i-ph:plus-circle text-base" />
                    <span>Create custom prompt</span>
                  </button>
                  {filteredItems.map((item) => (
                    <div
                      key={item.id}
                      className="group flex items-start gap-3 px-3 py-2.5 rounded-lg bg-bolt-elements-background-depth-2 hover:bg-bolt-elements-background-depth-3 transition-colors cursor-pointer"
                      onClick={() => handleSelect(item)}
                    >
                      <div className="i-ph:file-text text-lg text-bolt-elements-textTertiary mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-bolt-elements-textPrimary truncate">{item.name}</p>
                        {item.description && (
                          <p className="text-xs text-bolt-elements-textTertiary mt-0.5">{item.description}</p>
                        )}
                        <p className="text-xs text-bolt-elements-textTertiary mt-0.5 truncate opacity-70">
                          {item.prompt}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!item.isBuiltIn && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeUserPrompt(item.id);
                            }}
                            className="p-1 rounded text-bolt-elements-textTertiary hover:text-red-500 hover:bg-red-500/10 transition-colors"
                            title="Delete prompt"
                          >
                            <div className="i-ph:trash text-sm" />
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelect(item);
                          }}
                          className="p-1 rounded text-bolt-elements-textTertiary hover:text-accent-500 hover:bg-accent-500/10 transition-colors"
                          title="Use prompt"
                        >
                          <div className="i-ph:arrow-square-out text-sm" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
