import { atom } from 'nanostores';

export interface PromptItem {
  id: string;
  name: string;
  description: string;
  prompt: string;
  category: string;
  isBuiltIn: boolean;
}

export const promptCategories = atom<string[]>(['All', 'General', 'Design', 'Database', 'Deployment', 'Testing']);

const BUILT_IN_PROMPTS: PromptItem[] = [
  {
    id: 'build-fullstack-app',
    name: 'Build a Full-Stack App',
    description: 'Create a complete full-stack application with database',
    prompt:
      'Build a full-stack web application with a frontend, API routes, and a database. Include authentication, CRUD operations, and responsive design.',
    category: 'General',
    isBuiltIn: true,
  },
  {
    id: 'fix-bug',
    name: 'Debug & Fix Issue',
    description: 'Analyze and fix a bug in your code',
    prompt:
      "I'm encountering an issue with my application. Please analyze the code, identify the root cause, and provide a fix.",
    category: 'General',
    isBuiltIn: true,
  },
  {
    id: 'add-auth',
    name: 'Add Authentication',
    description: 'Set up user authentication with Supabase',
    prompt:
      'Add user authentication to the app using Supabase Auth. Include sign-up, sign-in, password reset, and protected routes.',
    category: 'Database',
    isBuiltIn: true,
  },
  {
    id: 'beautiful-ui',
    name: 'Beautiful UI Design',
    description: 'Create an Apple-level polished UI',
    prompt:
      'Redesign the UI to be stunning and production-ready. Use modern design principles, smooth animations, gradients, and thoughtful spacing. Make it look Apple-level polished.',
    category: 'Design',
    isBuiltIn: true,
  },
  {
    id: 'deploy-vercel',
    name: 'Deploy to Vercel',
    description: 'Set up deployment configuration for Vercel',
    prompt:
      'Configure the project for deployment on Vercel. Set up the necessary build configuration, environment variables, and routing.',
    category: 'Deployment',
    isBuiltIn: true,
  },
  {
    id: 'add-tests',
    name: 'Add Unit Tests',
    description: 'Set up and write comprehensive tests',
    prompt:
      'Add unit tests for the application. Set up a testing framework and write comprehensive tests for the key components and utilities.',
    category: 'Testing',
    isBuiltIn: true,
  },
  {
    id: 'responsive-design',
    name: 'Make It Responsive',
    description: 'Ensure the app works on all device sizes',
    prompt:
      'Make the entire application responsive and mobile-friendly. Ensure all components adapt properly to different screen sizes from mobile to desktop.',
    category: 'Design',
    isBuiltIn: true,
  },
  {
    id: 'add-search',
    name: 'Add Search Functionality',
    description: 'Implement full-text search across your data',
    prompt:
      'Add search functionality to the application. Implement full-text search that allows users to find and filter data efficiently.',
    category: 'Database',
    isBuiltIn: true,
  },
];

export const promptLibraryItems = atom<PromptItem[]>(BUILT_IN_PROMPTS);
export const selectedCategory = atom<string>('All');
export const promptSearchQuery = atom<string>('');
export const promptLibraryOpen = atom<boolean>(false);

export function addUserPrompt(item: Omit<PromptItem, 'id' | 'isBuiltIn'>) {
  const current = promptLibraryItems.get();
  const newPrompt: PromptItem = {
    ...item,
    id: `user-${Date.now()}`,
    isBuiltIn: false,
  };
  promptLibraryItems.set([newPrompt, ...current]);

  // Persist to localStorage
  try {
    const saved = JSON.parse(localStorage.getItem('bolt_user_prompts') || '[]');
    saved.unshift(newPrompt);
    localStorage.setItem('bolt_user_prompts', JSON.stringify(saved));
  } catch {}
}

export function removeUserPrompt(id: string) {
  const current = promptLibraryItems.get();
  promptLibraryItems.set(current.filter((p) => p.id !== id || p.isBuiltIn));

  try {
    const saved = JSON.parse(localStorage.getItem('bolt_user_prompts') || '[]');
    localStorage.setItem('bolt_user_prompts', JSON.stringify(saved.filter((p: PromptItem) => p.id !== id)));
  } catch {}
}

export function loadUserPrompts() {
  try {
    const saved = JSON.parse(localStorage.getItem('bolt_user_prompts') || '[]');

    if (saved.length > 0) {
      const builtIn = promptLibraryItems.get().filter((p) => p.isBuiltIn);
      promptLibraryItems.set([...saved, ...builtIn]);
    }
  } catch {}
}
