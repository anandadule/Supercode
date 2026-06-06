import { useEffect, useRef } from 'react';
import { classNames } from '~/utils/classNames';

interface FileMentionDropdownProps {
  isOpen: boolean;
  filteredFiles: string[];
  selectedIndex: number;
  mentionQuery: string;
  onSelect: (filePath: string) => void;
  onClose: () => void;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
}

export function FileMentionDropdown({
  isOpen,
  filteredFiles,
  selectedIndex,
  mentionQuery,
  onSelect,
  onClose: _onClose,
  textareaRef,
}: FileMentionDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen || !textareaRef.current || !dropdownRef.current) {
      return;
    }

    const textarea = textareaRef.current;
    const textareaRect = textarea.getBoundingClientRect();
    const lineHeight = parseInt(getComputedStyle(textarea).lineHeight || '20');
    const paddingTop = parseInt(getComputedStyle(textarea).paddingTop || '16');
    const value = textarea.value;
    const cursorPos = textarea.selectionStart || 0;
    const textBefore = value.slice(0, cursorPos);
    const lines = textBefore.split('\n');
    const currentLine = lines.length - 1;
    const currentLineText = lines[currentLine] || '';

    // Measure approximate position
    const charsPerLine = Math.floor(textarea.clientWidth / 8);
    const lineOffset = currentLine * lineHeight + paddingTop;
    const charOffset = Math.min(currentLineText.length, charsPerLine) * 8;

    const left = Math.min(charOffset, textareaRect.width - 300);
    const top = Math.max(lineOffset - 200, 0);

    dropdownRef.current.style.left = `${left}px`;
    dropdownRef.current.style.top = `${top}px`;
  }, [isOpen, mentionQuery, textareaRef]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      ref={dropdownRef}
      className="absolute z-50 w-[300px] max-h-[240px] overflow-y-auto rounded-lg bg-bolt-elements-background-depth-1 border border-bolt-elements-borderColor shadow-xl"
    >
      {filteredFiles.length === 0 ? (
        <div className="px-3 py-2 text-sm text-bolt-elements-textTertiary">No matching files</div>
      ) : (
        filteredFiles.map((filePath, index) => {
          const parts = filePath.split('/');
          const fileName = parts.pop() || '';
          const folder = parts.join('/');

          return (
            <button
              key={filePath}
              className={classNames(
                'w-full px-3 py-2 flex items-center gap-2 text-left transition-colors',
                index === selectedIndex
                  ? 'bg-accent-500/10 text-accent-500'
                  : 'text-bolt-elements-textPrimary hover:bg-bolt-elements-background-depth-2',
              )}
              onClick={() => onSelect(filePath)}
              onMouseEnter={() => undefined}
            >
              <div className="i-ph:file-code text-sm shrink-0 text-bolt-elements-textTertiary" />
              <div className="flex-1 min-w-0">
                <span className="text-sm truncate block">{fileName}</span>
                {folder && <span className="text-xs text-bolt-elements-textTertiary truncate block">{folder}</span>}
              </div>
            </button>
          );
        })
      )}
    </div>
  );
}
