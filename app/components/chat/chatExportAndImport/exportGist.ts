import type { Message } from 'ai';
import { toast } from 'react-toastify';

const GIST_API_URL = 'https://api.github.com/gists';

function serializeChatToMarkdown(description: string, messages: Message[]): string {
  const lines: string[] = [`# ${description || 'Bolt Chat'}`, ''];

  for (const message of messages) {
    const role = message.role === 'user' ? 'User' : 'Assistant';
    lines.push(`## ${role}`, '', (message.content || '').trim(), '');
  }

  return lines.join('\n');
}

export async function exportChatAsGist(
  description: string,
  messages: Message[],
  token: string,
): Promise<{ html_url: string } | null> {
  const filename = `${(description || 'bolt-chat')
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .slice(0, 60)}.md`;
  const content = serializeChatToMarkdown(description, messages);

  const response = await fetch(GIST_API_URL, {
    method: 'POST',
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      description: description || 'Bolt chat export',
      public: false,
      files: {
        [filename]: {
          content,
        },
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`GitHub Gist API returned ${response.status}: ${errorText || response.statusText}`);
  }

  return (await response.json()) as { html_url: string };
}

export async function shareChatAsGist(
  description: string,
  messages: Message[],
  token: string | undefined,
): Promise<void> {
  if (!token) {
    toast.error('GitHub token not set. Connect GitHub in settings first.');
    return;
  }

  if (!messages || messages.length === 0) {
    toast.error('No messages to share');
    return;
  }

  const toastId = toast.loading('Creating Gist...');

  try {
    const gist = await exportChatAsGist(description, messages, token);

    if (gist?.html_url) {
      toast.update(toastId, {
        render: 'Gist created',
        type: 'success',
        isLoading: false,
        autoClose: 5000,
      });
      window.open(gist.html_url, '_blank', 'noopener,noreferrer');
    } else {
      toast.update(toastId, {
        render: 'Gist created but no URL returned',
        type: 'warning',
        isLoading: false,
        autoClose: 5000,
      });
    }
  } catch (error) {
    toast.update(toastId, {
      render: `Failed to create Gist: ${error instanceof Error ? error.message : 'Unknown error'}`,
      type: 'error',
      isLoading: false,
      autoClose: 5000,
    });
  }
}
