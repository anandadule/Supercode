import { useState, useMemo } from 'react';

const SECTIONS = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    content: `Supercode is an AI-powered development environment that lets you build full-stack web applications entirely through natural language conversations with AI.

How to start your first project:

1. Open Supercode in your browser. You will see the landing page with the prompt "What will you build today?" and a chat input box at the center.
2. In the chat box, type a description of the app you want to build. For example: "Build a task management app with a React frontend and a Node.js backend." Be as specific or as broad as you like.
3. Before sending, you can optionally select an AI model provider (OpenAI, Anthropic, Google, etc.) by clicking the model settings icon in the chat box.
4. Press Enter or click the send button. The AI will begin generating code for your project.
5. Once the AI produces code, the workbench panel will slide in from the right side of the screen, showing your project files.
6. Use the tabs at the top of the workbench to switch between Code, Diff, and Preview views.
7. The Preview tab will show your app running live. If the preview is blank, wait for the dev server to start (check the terminal at the bottom of the workbench).
8. To make changes, simply describe what you want modified in the chat. The AI will update the code and you can see the results immediately.
9. When you are done, your project is automatically saved. You can return to it later from the Projects page.`,
  },
  {
    id: 'chat-interface',
    title: 'Chat Interface',
    content: `The chat interface is the primary way you interact with Supercode. It is divided into several key areas.

Chat Input Box:
- Type your prompts here. Be descriptive: explain what you want to build, what features to add, or what to fix.
- You can paste images directly into the input box for the AI to reference (useful for UI design).
- Use the paperclip icon to upload image files.
- The microphone icon enables speech-to-text input (available in supported browsers).
- The send button submits your message. While the AI is responding, it becomes a stop button.

Model Settings:
- Click the gear or model name icon next to the input box to expand the model settings panel.
- Here you can select the AI provider (OpenAI, Anthropic, Google, Mistral, DeepSeek, etc.) and the specific model.
- You can enter API keys for each provider. Keys are stored in browser cookies and persist across sessions.
- The available models list updates automatically based on the selected provider and your API key.

Chat Modes:
- Build mode: The AI generates and modifies code for your project. Use this for development.
- Discuss mode: The AI answers questions and provides explanations without modifying your code. Use this for learning or planning.

Message Thread:
- User messages appear on one side, AI responses on the other.
- AI responses often contain code blocks with syntax highlighting.
- Each AI response may include a <boltArtifact> block that contains the actual file changes and shell commands.
- You can scroll through the entire conversation history.

Import Buttons:
- Below the chat input, you will see options to import from Figma or clone a GitHub repository as a starting point.`,
  },
  {
    id: 'workbench',
    title: 'Workbench (Code Editor)',
    content: `The workbench is the development environment that appears when the AI starts generating code. It has three main views, switchable via the slider at the top.

Code View:
- The left pane shows the file tree. Click any file to open it in the editor.
- The right pane is the CodeMirror code editor with syntax highlighting for JavaScript, TypeScript, CSS, HTML, Python, JSON, and more.
- Use the Search tab within the file tree pane to search across all files in your project.
- The Locks tab lets you see which files are currently being modified by collaborators.
- A breadcrumb trail at the top shows your current file path.
- Unsaved files are indicated with a dot next to the filename.

Diff View:
- Shows a side-by-side or unified diff of file changes.
- Additions are highlighted in green, deletions in red.
- This is useful for reviewing what the AI changed before accepting the changes.

Preview View:
- Runs your application in an embedded browser powered by WebContainer.
- The preview updates live as the AI modifies code.
- See the Preview & Testing section for detailed features.

Toolbar:
- The toolbar at the top of the workbench contains:
  - Sidebar toggle: Show or hide the chat panel.
  - View slider: Switch between Code, Diff, and Preview.
  - Export Chat button: Download your conversation as JSON.
  - Sync Files button: Download all project files to your local machine.
  - Timeline button: View and restore automatic snapshots.
  - App Versions button: Save and manage named versions of your project.
  - Terminal toggle: Show or hide the built-in terminal.
  - Collaboration button: Open the real-time collaboration panel.
  - Close button: Close the workbench.`,
  },
  {
    id: 'preview',
    title: 'Preview & Testing',
    content: `The Preview panel renders your application live inside the browser. It has several powerful features accessible from the toolbar above the preview.

Address Bar:
- Shows the current URL of your running application.
- If multiple servers are running (e.g., frontend and backend on different ports), use the port dropdown on the left to switch between them.
- You can type a specific path to navigate within your app.

Toolbar Controls (left side):
- Reload: Refresh the preview iframe.
- Screenshot selection: Enable selection mode to capture parts of the preview.

Toolbar Controls (right side):
- Device mode: Toggle device emulation. When enabled, you can test your app at specific screen sizes.
- QR code: If you are building an Expo mobile app, a QR code appears for scanning on your phone.
- Rotate: In device mode, switch between portrait and landscape orientations.
- Device frame: Toggle a phone or tablet frame overlay around the preview.
- Element inspector: Click to enable. Then click any element in the preview to inspect its CSS selector and styles.
- Fullscreen: Expand the preview to full screen.
- New window options: Open the preview in a new browser tab or a resizable popup window with specific device dimensions.

Device Presets:
When device mode is active, you can select from presets including iPhone SE, iPhone 12/13, iPhone Pro Max, iPad Mini, iPad Air, iPad Pro, small laptop, laptop, large laptop, desktop, and 4K display.
Each preset automatically sets the preview width and height to match the target device.`,
  },
  {
    id: 'terminal',
    title: 'Terminal',
    content: `The built-in terminal gives you direct shell access to the WebContainer environment where your project runs.

Opening the Terminal:
- Click the terminal icon in the workbench toolbar to toggle the terminal panel open or closed.
- The terminal appears at the bottom of the workbench and can be resized by dragging the divider handle up or down.

What You Can Do:
- Install npm packages: Run npm install <package-name> to add dependencies.
- Run dev servers: The AI typically starts dev servers automatically, but you can restart them manually.
- Execute build commands: Run npm run build, npm run test, or any other script defined in package.json.
- View logs and errors: See real-time output from your running application.
- Run Node.js scripts: Execute one-off scripts for data migration, seeding, or testing.
- Use shell commands: ls, cat, mkdir, rm, and other common shell commands are available.

Terminal Features:
- Multiple terminal tabs are supported. Click the + icon to open a new tab.
- Each tab maintains its own shell session and working directory.
- You can close a terminal tab by clicking the X on the tab.
- The terminal supports standard output, error output in red, and command history.`,
  },
  {
    id: 'deploying',
    title: 'Deploying Your App',
    content: `Supercode lets you deploy your application to multiple hosting platforms directly from the interface.

Where to Find the Deploy Button:
- The Deploy button appears in the workbench toolbar (top bar of the workbench panel) when a preview is active.
- It is a green button labeled "Deploy" with a dropdown arrow.

How to Deploy to Vercel:
1. Click the Deploy button dropdown arrow.
2. Select "Deploy to Vercel".
3. If you have not connected your Vercel account, you will be prompted to authorize the connection.
4. Once connected, Supercode will deploy your project and provide you with a live URL.

How to Deploy to Netlify:
1. Click the Deploy button dropdown arrow.
2. Select "Deploy to Netlify".
3. Authorize the Netlify connection if prompted.
4. The deployment will start and a Netlify site URL will be generated.

How to Deploy to GitHub:
1. Click the Deploy button dropdown arrow.
2. Select "Deploy to GitHub".
3. A dialog will open showing the files to be committed.
4. Confirm to create a GitHub repository with your project code.

How to Deploy to GitLab:
1. Click the Deploy button dropdown arrow.
2. Select "Deploy to GitLab".
3. Authorize the GitLab connection and confirm the deployment.

Note: Each platform requires you to connect your account before deploying. The connection status is shown in the dropdown menu.`,
  },
  {
    id: 'projects',
    title: 'Managing Projects',
    content: `The Projects page lists all your saved chats and applications. You can access it by clicking "Projects" in the left sidebar navigation on the home page.

Browsing Projects:
- Each project card shows the project name (description), the date it was last modified (relative time), and the number of messages in the chat.
- Projects are sorted by the most recent first.

Opening a Project:
- Click anywhere on a project card (except the three-dot menu) to open that project in the chat interface.
- The chat will load with the full message history and file state restored.

Project Actions (three-dot menu):
- Open: Navigate to the project chat.
- Fork: Create a copy of the project as a new chat. This is useful for experimenting without affecting the original.
- Delete: Remove the project permanently. A confirmation dialog will appear before deletion.

Search:
- The left sidebar on the home page includes a search bar that filters projects by name as you type.
- Press Enter to navigate to the Projects page with the search query applied.

Export:
- From within a chat, use the Export Chat button in the workbench toolbar to download the entire conversation as a JSON file.
- Use the Download Code button (in the export dropdown) to download all project files as a ZIP archive.

Storage:
- All projects are stored locally in your browser's IndexedDB database.
- Data does not sync across devices unless you export and import manually.
- Clearing browser data will remove all projects. Export important projects as backups.`,
  },
  {
    id: 'versioning',
    title: 'Versioning & Rollback',
    content: `Supercode provides two levels of versioning: automatic snapshots and manual named versions.

Automatic Snapshots:
- Every time the AI generates a response, a snapshot of the entire project file state is automatically saved.
- These snapshots are stored in the Snapshot Timeline, accessible from the clock icon in the workbench toolbar.
- You can restore any snapshot to revert the project files to that exact state.
- The timeline keeps up to 50 automatic snapshots per project.

Manual Named Versions:
- For important milestones, you can save a named version with a descriptive label.
- Click the git branch icon in the workbench toolbar to open the App Versions panel.
- Click "Save Current Version", enter a label (e.g., "v1 - Initial MVP", "Added authentication"), and optionally add a description.
- The version captures the complete file state at that moment.

Restoring a Version:
- In the App Versions panel, find the version you want to restore.
- Click the rollback icon (counter-clockwise arrow) on that version card.
- The project files will be immediately restored to that version's state in the WebContainer.
- The workbench file tree and preview will update to reflect the restored files.

Version Limits:
- Up to 30 named versions are kept per project.
- When you save a 31st version, the oldest version is automatically deleted.
- Automatic snapshots (up to 50) are separate and do not count toward this limit.

Deleting Versions:
- In the App Versions panel, click the trash icon on any version to delete it permanently.`,
  },
  {
    id: 'design-systems',
    title: 'Design Systems',
    content: `Design systems allow you to guide the AI's visual output to match a specific style or brand identity.

Applying a Design System:
1. In the chat input area, look for the design system selector (brush/palette icon).
2. Click it to open the design system dropdown.
3. Select from available presets: Shadcn UI, Material Design, Chakra UI, or custom options.
4. The AI will then generate code that follows the selected design system's conventions for colors, typography, spacing, and component patterns.

Uploading a Custom Design System:
1. In the design system selector, choose the option to upload or configure a custom scheme.
2. You can specify:
   - Font family and sizes
   - Color palette (primary, secondary, accent, background, text colors)
   - Border radius, spacing scale
   - Component-specific styles
3. Once configured, the AI will use your custom design system for all generated code.

Best Practices:
- Set the design system before you start building for consistent results.
- If you change the design system mid-project, describe the change explicitly to the AI so it can update existing components.
- For brand-accurate results, provide your exact brand colors and typography in the custom settings.`,
  },
  {
    id: 'api-keys',
    title: 'API Keys & Providers',
    content: `Supercode supports multiple AI providers. You need to configure at least one provider with a valid API key to use the application.

Supported Providers:
- OpenAI (GPT-4, GPT-4o, GPT-4o-mini, o3-mini, etc.)
- Anthropic (Claude 3.5 Sonnet, Claude 3 Opus, etc.)
- Google (Gemini 1.5 Pro, Gemini 1.5 Flash, etc.)
- Mistral (Mistral Large, Mistral Small, etc.)
- DeepSeek (DeepSeek V3, DeepSeek R1, etc.)
- Cohere, Fireworks, Cerebras
- Amazon Bedrock
- Ollama (local models)
- OpenRouter (unified access to multiple models)

How to Configure:
1. In the chat input area, click the model settings icon (gear or model name) to expand the settings panel.
2. Select a provider from the provider dropdown list.
3. In the API key field for that provider, paste your API key.
4. The available models for that provider will load automatically.
5. Select the specific model you want to use for generation.
6. Close the settings panel. Your selection is remembered for the session.

Where to Get API Keys:
- OpenAI: https://platform.openai.com/api-keys
- Anthropic: https://console.anthropic.com/
- Google: https://makersuite.google.com/app/apikey
- Mistral: https://console.mistral.ai/
- DeepSeek: https://platform.deepseek.com/

Security:
- API keys are stored in browser cookies and are never sent to any server other than the respective API provider.
- Keys are not shared with other users or stored on any backend.
- Clear your browser cookies to remove stored keys.`,
  },
  {
    id: 'import-export',
    title: 'Import & Export',
    content: `Supercode provides several ways to bring code in and take your work out.

Importing from GitHub:
1. On the home page, click the "GitHub" button under "or start from".
2. Enter the URL of a public GitHub repository.
3. Supercode will clone the repository into the WebContainer environment.
4. The AI will analyze the code and you can start iterating from there.

Importing from Figma:
1. Click the "Figma" button under "or start from".
2. Authorize the Figma integration.
3. Select a Figma design file to import design tokens and components.

Exporting Chat History:
1. In the workbench toolbar, click the export button (download icon).
2. Select "Export Chat" from the dropdown.
3. The entire conversation including all messages will be downloaded as a JSON file.
4. This file can be re-imported later or shared.

Downloading Project Code:
1. In the workbench toolbar, click the export button.
2. Select "Download Code" from the dropdown.
3. All project files will be bundled into a ZIP archive and downloaded to your computer.
4. The ZIP file preserves the full directory structure.

Syncing Files:
- The sync button (cloud with arrow icon) in the workbench toolbar downloads all project files to your local machine.
- This is useful when you want to continue working in a local IDE like VS Code.
- Files are synced to your browser's download location.`,
  },
  {
    id: 'collaboration',
    title: 'Collaboration',
    content: `Supercode includes real-time collaboration features that allow multiple developers to work on the same project simultaneously.

How to Start Collaborating:
1. Click the collaboration button (users icon) in the workbench toolbar.
2. The collaboration panel will open on the right side of the screen.
3. Share the workspace URL with your team members. Anyone with the URL can join the session.

What You Can Do:
- See active collaborators: The panel shows who is currently in the session, along with their avatars.
- Broadcast changes: File changes made by one collaborator are visible to all others in real-time.
- File locks: When a collaborator is editing a file, it is locked to prevent conflicts. The lock indicator shows who is editing what.
- Chat alongside: Each collaborator can interact with the AI independently while seeing shared file changes.

Best Practices:
- Communicate with your team about what each person is working on to avoid conflicts.
- Use the Discuss mode for planning and the Build mode for implementation.
- The project state is shared, so changes are visible to everyone immediately.
- Collaboration is best suited for pair programming, code reviews, and team debugging sessions.`,
  },
  {
    id: 'keyboard-shortcuts',
    title: 'Keyboard Shortcuts',
    content: `The following interactions work across Supercode.

Chat:
- Enter: Send a message in the chat input.
- Shift + Enter: Add a new line without sending.
- Escape: Close any open modal, panel, or dropdown menu.

Navigation:
- Click the sidebar icon in the workbench toolbar to toggle the chat panel.
- Click the slider tabs (Code, Diff, Preview) to switch views.
- Click the terminal icon to show or hide the terminal panel.
- Click outside a modal or backdrop to close it.

Editing:
- Tab / Shift + Tab: Indent or unindent in the code editor.
- The code editor supports standard browser undo (Ctrl+Z) and redo (Ctrl+Y) within the editing session.

General:
- Right-click on a file in the file tree to open the context menu.
- Click the three-dot menu on project cards for additional actions.
- The Close button (X) in the workbench toolbar closes the workbench panel.`,
  },
  {
    id: 'troubleshooting',
    title: 'Troubleshooting',
    content: `Here are solutions to common issues you may encounter while using Supercode.

Preview shows blank or "No preview available":
- Wait a few seconds for the dev server to start. Check the terminal to see if the server is running.
- If the terminal shows errors, share the error message with the AI and ask it to fix the issue.
- Click the reload button in the preview toolbar to refresh the iframe.
- If using device mode, try switching to responsive mode.

AI is not responding or is very slow:
- Check your API key is valid and has sufficient credits remaining.
- Try switching to a faster model (e.g., GPT-4o-mini instead of GPT-4).
- Some providers may experience downtime. Try switching to a different provider.
- Ensure your internet connection is stable.

Code changes are not appearing in the preview:
- The AI generates code in full file updates. Check the latest AI message to verify it produced the expected code.
- Some changes require a server restart. Look for a "start" action in the AI's artifact.
- Click the reload button in the preview toolbar.

API key errors:
- Verify you entered the key correctly (no extra spaces, correct format).
- Ensure the key has the required permissions for the model you selected.
- Some providers require you to enable billing before the key works.
- Try clearing the key and re-entering it.

App is not saving or project is lost:
- Projects are stored in browser IndexedDB. Check that your browser has not cleared site data.
- Export important projects as JSON backup regularly.
- If using incognito/private browsing, data will be lost when you close the browser.

Terminal errors:
- If an npm install fails, try running it again. Network issues can cause intermittent failures.
- If a dev server fails to start, check the error message in the terminal and share it with the AI.
- Use the terminal's clear command to reset the view if it becomes cluttered.

If none of these solutions help, use the Report Bug button in the workbench toolbar to provide feedback, and include the debug log for faster troubleshooting.`,
  },
];

export function GuideContent() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) {
      return SECTIONS;
    }

    const query = searchQuery.toLowerCase();

    return SECTIONS.filter((s) => s.title.toLowerCase().includes(query) || s.content.toLowerCase().includes(query));
  }, [searchQuery]);

  return (
    <div className="flex flex-col h-full w-full bg-bolt-elements-background-depth-1">
      {/* Top navigation bar */}
      <div className="flex items-center justify-between px-4 lg:px-8 h-[var(--header-height)] border-b backdrop-blur-md bg-bolt-elements-background-depth-1/80 border-bolt-elements-borderColor shrink-0">
        <a href="/" className="flex items-center gap-2 select-none hover:opacity-90">
          <img src="/supercode-logo.png" alt="Supercode Logo" className="w-28 rounded-lg object-contain" />
        </a>
        <div className="flex items-center gap-3">
          <a
            href="/"
            className="flex items-center gap-1.5 text-sm text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary transition-colors"
          >
            <span className="i-ph:arrow-left text-base" />
            <span>Back to App</span>
          </a>
        </div>
      </div>
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar navigation */}
        <aside className="w-64 shrink-0 border-r border-bolt-elements-borderColor bg-bolt-elements-background-depth-2 guide-scrollbar">
          <div className="p-3">
            <h2 className="text-xs font-semibold text-bolt-elements-textTertiary uppercase tracking-wider mb-2">
              Guide Sections
            </h2>
            <nav className="space-y-0.5">
              {SECTIONS.map((section) => (
                <button
                  key={section.id}
                  onClick={() => {
                    setActiveSection(section.id);
                    document.getElementById(section.id)?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors bg-transparent ${
                    activeSection === section.id
                      ? 'bg-bolt-elements-item-backgroundActive text-bolt-elements-item-contentActive font-medium'
                      : 'text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary hover:bg-bolt-elements-item-backgroundActive'
                  }`}
                >
                  {section.title}
                </button>
              ))}
            </nav>
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 guide-scrollbar">
          <div className="max-w-4xl mx-auto px-6 py-8">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-bolt-elements-textPrimary mb-2">Supercode User Guide</h1>
              <p className="text-sm text-bolt-elements-textSecondary">
                Complete guide to using Supercode — the AI-powered development environment.
              </p>
            </div>

            {/* Search bar */}
            <div className="relative mb-8">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 i-ph:magnifying-glass text-sm text-bolt-elements-textTertiary pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search guide content..."
                className="w-full pl-9 pr-4 py-2.5 text-sm rounded-lg bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor text-bolt-elements-textPrimary placeholder-bolt-elements-textTertiary focus:outline-none focus:border-accent-500 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-bolt-elements-textTertiary hover:text-bolt-elements-textPrimary"
                >
                  <span className="i-ph:x text-sm" />
                </button>
              )}
            </div>

            {filteredSections.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-bolt-elements-textTertiary">
                <span className="i-ph:magnifying-glass text-3xl mb-3" />
                <p className="text-sm font-medium">No results found</p>
                <p className="text-xs mt-1">Try a different search term</p>
              </div>
            ) : (
              <div className="space-y-8">
                {filteredSections.map((section) => (
                  <section key={section.id} id={section.id} className="scroll-mt-4">
                    <h2 className="text-lg font-semibold text-bolt-elements-textPrimary mb-3 pb-2 border-b border-bolt-elements-borderColor">
                      {section.title}
                    </h2>
                    <div className="text-sm text-bolt-elements-textSecondary leading-relaxed whitespace-pre-line">
                      {section.content}
                    </div>
                  </section>
                ))}
              </div>
            )}

            <div className="mt-12 pt-6 border-t border-bolt-elements-borderColor text-xs text-bolt-elements-textTertiary text-center">
              Supercode User Guide
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
