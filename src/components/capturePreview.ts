/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Renders the Studio's stage SVG to a small JPEG for cards and summaries. The picture is only a
// preview: the design itself is stored as structured selections.

const cache = new Map<string, string>();

const toDataUrl = async (href: string) => {
  if (href.startsWith('data:')) return href;
  const hit = cache.get(href);
  if (hit) return hit;
  const blob = await (await fetch(href)).blob();
  const url = await new Promise<string>((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.onerror = rej;
    r.readAsDataURL(blob);
  });
  cache.set(href, url);
  return url;
};

export async function capturePreview(
  svg: SVGSVGElement,
  outW = 240,
  cropRect?: { x: number; y: number; w: number; h: number },
): Promise<string> {
  const w = Number(svg.getAttribute('width')) || svg.clientWidth;
  const h = Number(svg.getAttribute('height')) || svg.clientHeight;
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clone.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
  clone.setAttribute('viewBox', `0 0 ${w} ${h}`);
  clone.removeAttribute('class');

  // an SVG drawn as an image can't load external files, so embed every painted asset
  const images = Array.from(clone.querySelectorAll('image'));
  await Promise.all(
    images.map(async (img) => {
      const href = img.getAttribute('href') || img.getAttribute('xlink:href');
      if (href) img.setAttribute('href', await toDataUrl(new URL(href, window.location.href).href));
    }),
  );

  const src = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(clone)], { type: 'image/svg+xml' }));
  try {
    const img = await new Promise<HTMLImageElement>((res, rej) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = rej;
      i.src = src;
    });
    // crop to the figure (head to hem) and keep the stage's portrait framing
    const crop = cropRect || { x: 20, y: 20, w: w - 40, h: Math.min(h, 790) - 20 };
    const canvas = document.createElement('canvas');
    canvas.width = outW;
    canvas.height = Math.round((outW * crop.h) / crop.w);
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, crop.x, crop.y, crop.w, crop.h, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.82);
  } finally {
    URL.revokeObjectURL(src);
  }
}
