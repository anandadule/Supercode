import { useState, useCallback, useRef, useEffect } from 'react';
import { workbenchStore } from '~/lib/stores/workbench';

interface UseFileAutocompleteReturn {
  mentionTriggered: boolean;
  mentionQuery: string;
  mentionStartPos: number;
  filteredFiles: string[];
  isOpen: boolean;
  selectedIndex: number;
  handleInputChange: (
    e: React.ChangeEvent<HTMLTextAreaElement>,
    originalOnChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void,
  ) => void;
  handleKeyDown: (e: React.KeyboardEvent, originalOnKeyDown?: (e: React.KeyboardEvent) => void) => boolean;
  selectFile: (filePath: string) => void;
  dropdownRef: React.RefObject<HTMLDivElement | null>;
  menuRef: React.RefObject<HTMLDivElement | null>;
}

export function useFileAutocomplete(
  textareaRef: React.RefObject<HTMLTextAreaElement | null>,
  input: string,
  setInput: (value: string) => void,
): UseFileAutocompleteReturn {
  const [mentionTriggered, setMentionTriggered] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionStartPos, setMentionStartPos] = useState(-1);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const allFiles = useRef<string[]>([]);

  useEffect(() => {
    const files = workbenchStore.files.get();
    allFiles.current = Object.keys(files).filter((key) => {
      const entry = files[key];
      return entry?.type === 'file' && !entry.isBinary;
    });
  }, []);

  const getFilteredFiles = useCallback((query: string) => {
    if (!query) {
      return allFiles.current.slice(0, 20);
    }

    const lower = query.toLowerCase();

    return allFiles.current.filter((f) => f.toLowerCase().includes(lower)).slice(0, 20);
  }, []);

  const filteredFiles = getFilteredFiles(mentionQuery);
  const isOpen = mentionTriggered && filteredFiles.length > 0;

  const parseMention = useCallback((value: string, cursorPos: number) => {
    const beforeCursor = value.slice(0, cursorPos);
    const atIndex = beforeCursor.lastIndexOf('@');

    if (atIndex === -1) {
      return { triggered: false, query: '', startPos: -1 };
    }

    // Check that @ is at word boundary (preceded by space, start of string, or punctuation)
    const charBefore = atIndex > 0 ? beforeCursor[atIndex - 1] : ' ';

    if (charBefore !== ' ' && charBefore !== '\n' && charBefore !== '(' && charBefore !== '[' && charBefore !== '{') {
      return { triggered: false, query: '', startPos: -1 };
    }

    const queryText = beforeCursor.slice(atIndex + 1);

    // Only trigger if there's no space/newline in the query
    if (queryText.includes(' ')) {
      return { triggered: false, query: '', startPos: -1 };
    }

    return { triggered: true, query: queryText, startPos: atIndex };
  }, []);

  const handleInputChange = useCallback(
    (
      e: React.ChangeEvent<HTMLTextAreaElement>,
      originalOnChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void,
    ) => {
      originalOnChange?.(e);

      const value = e.target.value;
      const cursorPos = e.target.selectionStart || 0;
      const result = parseMention(value, cursorPos);

      setMentionTriggered(result.triggered);
      setMentionQuery(result.query);
      setMentionStartPos(result.startPos);
      setSelectedIndex(0);
    },
    [parseMention],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, originalOnKeyDown?: (e: React.KeyboardEvent) => void): boolean => {
      if (!isOpen) {
        originalOnKeyDown?.(e);
        return false;
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        e.stopPropagation();
        setSelectedIndex((prev) => Math.min(prev + 1, filteredFiles.length - 1));

        return true;
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        e.stopPropagation();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));

        return true;
      }

      if (e.key === 'Enter' || e.key === 'Tab') {
        if (filteredFiles[selectedIndex]) {
          e.preventDefault();
          e.stopPropagation();
          selectFile(filteredFiles[selectedIndex]);

          return true;
        }
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        setMentionTriggered(false);

        return true;
      }

      originalOnKeyDown?.(e);

      return false;
    },
    [isOpen, filteredFiles, selectedIndex],
  );

  const selectFile = useCallback(
    (filePath: string) => {
      if (mentionStartPos < 0) {
        return;
      }

      const before = input.slice(0, mentionStartPos);
      const after = input.slice(mentionStartPos + 1 + mentionQuery.length);
      const newValue = `${before}@${filePath} ${after}`;
      setInput(newValue);

      setMentionTriggered(false);
      setMentionQuery('');
      setMentionStartPos(-1);

      // Restore cursor position after React re-render
      requestAnimationFrame(() => {
        if (textareaRef.current) {
          const newCursor = before.length + filePath.length + 2;
          textareaRef.current.setSelectionRange(newCursor, newCursor);
          textareaRef.current.focus();
        }
      });
    },
    [input, mentionStartPos, mentionQuery, setInput, textareaRef],
  );

  return {
    mentionTriggered,
    mentionQuery,
    mentionStartPos,
    filteredFiles,
    isOpen,
    selectedIndex,
    handleInputChange,
    handleKeyDown,
    selectFile,
    dropdownRef,
    menuRef,
  };
}
