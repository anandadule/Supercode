import { json, type ActionFunctionArgs } from '@remix-run/cloudflare';

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const body = (await request.json()) as {
      prompt?: string;
      size?: string;
      style?: string;
      apiKey?: string;
      editingImage?: string;
    };

    const { prompt, size, style, apiKey, editingImage } = body;

    if (!prompt) {
      return json({ error: 'Prompt is required' }, { status: 400 });
    }

    // Try DALL-E 3 if an OpenAI API key is provided
    if (apiKey) {
      try {
        const response = await fetch('https://api.openai.com/v1/images/generations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: 'dall-e-3',
            prompt: editingImage ? `${prompt}. Apply these edits to the provided image.` : prompt,
            n: 1,
            size: size || '1024x1024',
            ...(style && style !== 'none' ? { style } : {}),
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          let errorMessage = 'OpenAI API error';

          try {
            const errorData = JSON.parse(errorText);
            errorMessage = errorData.error?.message || errorMessage;
          } catch {
            errorMessage = errorText || errorMessage;
          }

          throw new Error(errorMessage);
        }

        const data = (await response.json()) as { data: { url: string }[] };

        return json({ url: data.data[0].url });
      } catch (error) {
        console.error('DALL-E API error:', error);

        // Fall through to placeholder
      }
    }

    // Generate a placeholder SVG when DALL-E is unavailable
    const dataUrl = generatePlaceholderDataUrl(prompt, size || '1024x1024');

    return json({ url: dataUrl });
  } catch (error) {
    console.error('Image generation error:', error);
    return json({ error: error instanceof Error ? error.message : 'Failed to generate image' }, { status: 500 });
  }
}

function generatePlaceholderDataUrl(prompt: string, size: string): string {
  const [width, height] = size.split('x').map(Number);
  const escapedPrompt = escapeXml(prompt.slice(0, 60));

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#6366f1;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#a855f7;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="shimmer" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:rgba(255,255,255,0)" />
      <stop offset="50%" style="stop-color:rgba(255,255,255,0.15)" />
      <stop offset="100%" style="stop-color:rgba(255,255,255,0)" />
    </linearGradient>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#bg)" rx="8"/>
  <rect width="${width}" height="${height}" fill="url(#shimmer)" rx="8"/>
  <g transform="translate(${width / 2}, ${height * 0.38})">
    <circle cx="0" cy="0" r="32" fill="rgba(255,255,255,0.2)" />
    <path d="M-16-8 L16-8 L0 16 Z" fill="rgba(255,255,255,0.4)" />
  </g>
  <text x="50%" y="${height * 0.52}" text-anchor="middle" fill="white" font-size="24" font-family="system-ui, sans-serif" font-weight="bold">
    Generated Image
  </text>
  <text x="50%" y="${height * 0.58}" text-anchor="middle" fill="rgba(255,255,255,0.8)" font-size="14" font-family="system-ui, sans-serif">
    ${escapedPrompt}
  </text>
  <text x="50%" y="${height * 0.64}" text-anchor="middle" fill="rgba(255,255,255,0.5)" font-size="11" font-family="system-ui, sans-serif">
    Placeholder - configure an OpenAI API key for DALL-E 3
  </text>
</svg>`;

  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
