/**
 * Figma API client service
 *
 * Provides functions to interact with the Figma REST API:
 * - Fetch file metadata (nodes tree, frame list)
 * - Fetch image URLs for specific nodes
 * - Parse Figma URLs to extract file keys
 * - Traverse the document tree to extract frame nodes
 */

const FIGMA_API_BASE = 'https://api.figma.com/v1';

export interface FigmaFrame {
  id: string;
  name: string;
  thumbnailUrl?: string;
}

export interface FigmaFileData {
  name: string;
  document: FigmaDocumentNode;
  lastModified: string;
  thumbnailUrl?: string;
  version?: string;
  role?: string;
}

export interface FigmaDocumentNode {
  id: string;
  name: string;
  type: string;
  children?: FigmaDocumentNode[];
}

export interface FigmaImagesResponse {
  err?: string;
  images: Record<string, string | null>;
}

/**
 * Fetch Figma file metadata including the full document tree.
 */
export async function getFigmaFile(fileKey: string, accessToken: string): Promise<FigmaFileData> {
  const res = await fetch(`${FIGMA_API_BASE}/files/${fileKey}`, {
    headers: { 'X-Figma-Token': accessToken },
  });

  if (!res.ok) {
    const errorBody = await res.text().catch(() => '');
    throw new Error(`Failed to fetch Figma file: ${res.status}${errorBody ? ` - ${errorBody}` : ''}`);
  }

  return res.json();
}

/**
 * Fetch image URLs for specific node IDs from a Figma file.
 * Returns a map of node ID to image URL (SVG or PNG).
 */
export async function getFigmaImages(
  fileKey: string,
  nodeIds: string[],
  accessToken: string,
  format: 'svg' | 'png' = 'svg',
): Promise<FigmaImagesResponse> {
  if (nodeIds.length === 0) {
    return { images: {} };
  }

  const ids = nodeIds.join(',');
  const res = await fetch(`${FIGMA_API_BASE}/images/${fileKey}?ids=${ids}&format=${format}`, {
    headers: { 'X-Figma-Token': accessToken },
  });

  if (!res.ok) {
    const errorBody = await res.text().catch(() => '');
    throw new Error(`Failed to fetch Figma images: ${res.status}${errorBody ? ` - ${errorBody}` : ''}`);
  }

  return res.json();
}

/**
 * Extract a Figma file key from a figma.com URL.
 *
 * Supports both /file/ and /design/ URL formats:
 * - https://www.figma.com/file/ABC123/My-Design
 * - https://www.figma.com/design/ABC123/My-Design
 * - https://www.figma.com/file/ABC123/My-Design?node-id=...
 */
export function extractFileKey(url: string): string | null {
  const match = url.match(/figma\.com\/(?:file|design)\/([a-zA-Z0-9]+)/);
  return match ? match[1] : null;
}

/**
 * Recursively traverse the Figma document tree and collect all FRAME nodes.
 */
export function extractFrames(document: FigmaDocumentNode): FigmaFrame[] {
  const frames: FigmaFrame[] = [];

  function traverse(node: FigmaDocumentNode) {
    if (node.type === 'FRAME' || node.type === 'COMPONENT' || node.type === 'COMPONENT_SET') {
      frames.push({ id: node.id, name: node.name });
    }

    if (node.children) {
      for (const child of node.children) {
        traverse(child);
      }
    }
  }

  traverse(document);

  return frames;
}

/**
 * Sanitize a frame name for use as a file name.
 * Replaces special characters with underscores.
 */
export function sanitizeFrameName(name: string): string {
  return (
    name
      .replace(/[^a-zA-Z0-9\s_-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .toLowerCase() || 'frame'
  );
}

/**
 * Fetch the actual SVG content from an image URL returned by the Figma API.
 * Figma image URLs (s3-alpha-sig.figma.com) typically support CORS.
 */
export async function downloadImageContent(url: string): Promise<string> {
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`Failed to download image: ${res.status}`);
  }

  return res.text();
}
