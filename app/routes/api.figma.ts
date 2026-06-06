import { json } from '@remix-run/cloudflare';
import { withSecurity } from '~/lib/security';
import { getFigmaFile, extractFileKey, extractFrames } from '~/lib/services/figmaService';

async function figmaAction({ request }: { request: Request; context: any }) {
  try {
    const body = (await request.json()) as { url?: string; accessToken?: string };

    if (!body.url) {
      return json({ error: 'Figma URL is required' }, { status: 400 });
    }

    if (!body.accessToken) {
      return json({ error: 'Figma access token is required' }, { status: 400 });
    }

    const fileKey = extractFileKey(body.url);

    if (!fileKey) {
      return json(
        {
          error:
            'Invalid Figma URL. Expected format: https://www.figma.com/file/KEY/name or https://www.figma.com/design/KEY/name',
        },
        { status: 400 },
      );
    }

    // Fetch the Figma file data
    const fileData = await getFigmaFile(fileKey, body.accessToken);

    // Extract all frames from the document tree
    const frames = extractFrames(fileData.document);

    return json({
      frames,
      fileKey,
      fileName: fileData.name,
      lastModified: fileData.lastModified,
    });
  } catch (error) {
    console.error('Error fetching Figma file:', error);

    const message = error instanceof Error ? error.message : 'Failed to fetch Figma file';

    return json({ error: message }, { status: 500 });
  }
}

export const action = withSecurity(figmaAction, {
  rateLimit: true,
  allowedMethods: ['POST'],
});
