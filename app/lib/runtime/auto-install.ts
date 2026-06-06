import { atom, type WritableAtom } from 'nanostores';
import { webcontainer } from '~/lib/webcontainer';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('AutoInstall');

/**
 * Files in the project root that should trigger an auto-install when written by the agent.
 * Only file actions with a package-related path are observed.
 */
const PACKAGE_FILE_PATTERNS: RegExp[] = [
  /(^|\/)package\.json$/,
  /(^|\/)package-lock\.json$/,
  /(^|\/)pnpm-lock\.yaml$/,
  /(^|\/)yarn\.lock$/,
  /(^|\/)bun\.lockb$/,
];

const INSTALL_DEBOUNCE_MS = 750;

export const autoInstallEnabled: WritableAtom<boolean> = atom(
  typeof window !== 'undefined' ? window.localStorage.getItem('supercode:autoInstall') !== '0' : true,
);

export const autoInstallStatus: WritableAtom<'idle' | 'installing' | 'failed'> = atom('idle');
export const autoInstallMessage: WritableAtom<string> = atom('');

let pendingInstall: ReturnType<typeof setTimeout> | null = null;
let lastInstalledSignature: string | null = null;

export function setAutoInstallEnabled(enabled: boolean) {
  autoInstallEnabled.set(enabled);

  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem('supercode:autoInstall', enabled ? '1' : '0');
    } catch {
      // ignore
    }
  }

  if (!enabled) {
    autoInstallStatus.set('idle');
    autoInstallMessage.set('');
  }
}

export function isPackageFilePath(filePath: string): boolean {
  return PACKAGE_FILE_PATTERNS.some((pattern) => pattern.test(filePath));
}

async function readPackageSignature(container: Awaited<typeof webcontainer>): Promise<string | null> {
  try {
    return await container.fs.readFile('package.json', 'utf-8');
  } catch {
    return null;
  }
}

async function runInstall(container: Awaited<typeof webcontainer>): Promise<{ exitCode: number; output: string }> {
  autoInstallStatus.set('installing');
  autoInstallMessage.set('Running npm install...');

  try {
    const process = await container.spawn('npm', ['install', '--no-audit', '--no-fund', '--prefer-offline']);
    let output = '';

    const pipe = process.output.pipeTo(
      new WritableStream({
        write(chunk) {
          output += chunk;
        },
      }),
    );

    const exitCode = await process.exit;
    await pipe.catch(() => undefined);

    return { exitCode, output };
  } catch (error) {
    logger.error('Auto-install spawn failed:', error);
    return { exitCode: 1, output: error instanceof Error ? error.message : String(error) };
  }
}

function scheduleInstall(reason: string) {
  if (!autoInstallEnabled.get()) {
    return;
  }

  if (pendingInstall) {
    clearTimeout(pendingInstall);
  }

  pendingInstall = setTimeout(async () => {
    pendingInstall = null;

    try {
      const container = await webcontainer;
      const signature = await readPackageSignature(container);

      if (!signature) {
        return;
      }

      if (signature === lastInstalledSignature) {
        return;
      }

      logger.debug(`Running auto-install after: ${reason}`);

      const result = await runInstall(container);

      if (result.exitCode === 0) {
        lastInstalledSignature = signature;
        autoInstallStatus.set('idle');
        autoInstallMessage.set('Dependencies installed');
      } else {
        autoInstallStatus.set('failed');
        autoInstallMessage.set('npm install failed');
        logger.error('Auto-install failed with exit code', result.exitCode, result.output);
      }
    } catch (error) {
      autoInstallStatus.set('failed');
      autoInstallMessage.set('Auto-install error');
      logger.error('Auto-install failed:', error);
    }
  }, INSTALL_DEBOUNCE_MS);
}

/**
 * Call this from a file action to schedule an auto-install if the file is a package manifest.
 * Safe to call for every file write - the path is filtered here.
 */
export function maybeAutoInstallForFile(filePath: string) {
  if (!isPackageFilePath(filePath)) {
    return;
  }

  scheduleInstall(filePath);
}
