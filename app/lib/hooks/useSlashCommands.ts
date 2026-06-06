import { useCallback, useState } from 'react';
import { chatStore } from '~/lib/stores/chat';

interface UseSlashCommandsReturn {
  handleInputChange: (
    e: React.ChangeEvent<HTMLTextAreaElement>,
    originalOnChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void,
  ) => void;
  handleKeyDown: (
    e: React.KeyboardEvent,
    originalOnKeyDown?: (e: React.KeyboardEvent) => void,
  ) => { handled: boolean; action?: 'clear' | 'create-prompt' };
  isSlashCommand: boolean;
  currentCommand: string;
}

export function useSlashCommands(
  input: string,
  setInput: (value: string) => void,
  clearMessages: () => void,
  onCreatePrompt?: (text: string) => void,
): UseSlashCommandsReturn {
  const [isSlashCommand, setIsSlashCommand] = useState(false);
  const [currentCommand, setCurrentCommand] = useState('');

  const parseCommand = useCallback((value: string): string | null => {
    if (!value.startsWith('/')) {
      return null;
    }

    const spaceIndex = value.indexOf(' ');

    return spaceIndex > 0 ? value.slice(1, spaceIndex) : value.slice(1);
  }, []);

  const handleInputChange = useCallback(
    (
      e: React.ChangeEvent<HTMLTextAreaElement>,
      originalOnChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void,
    ) => {
      const value = e.target.value;
      const command = parseCommand(value);

      setIsSlashCommand(!!command);
      setCurrentCommand(command || '');

      originalOnChange?.(e);
    },
    [parseCommand],
  );

  const handleKeyDown = useCallback(
    (
      e: React.KeyboardEvent,
      originalOnKeyDown?: (e: React.KeyboardEvent) => void,
    ): { handled: boolean; action?: 'clear' | 'create-prompt' } => {
      if (e.key === 'Enter' && !e.shiftKey) {
        const command = parseCommand(input);

        if (command === 'clear') {
          e.preventDefault();
          e.stopPropagation();
          clearMessages();
          setInput('');
          setIsSlashCommand(false);
          setCurrentCommand('');
          chatStore.setKey('started', false);

          return { handled: true, action: 'clear' };
        }

        if (command === 'create') {
          e.preventDefault();
          e.stopPropagation();

          const promptText = input.replace('/create ', '').trim();

          if (promptText && onCreatePrompt) {
            onCreatePrompt(promptText);
          }

          setInput('');
          setIsSlashCommand(false);
          setCurrentCommand('');

          return { handled: true, action: 'create-prompt' };
        }
      }

      originalOnKeyDown?.(e);

      return { handled: false };
    },
    [input, parseCommand, clearMessages, setInput, onCreatePrompt],
  );

  return {
    handleInputChange,
    handleKeyDown,
    isSlashCommand,
    currentCommand,
  };
}
