export async function embedFontsInSvg(svgString: string): Promise<string> {
  // A robust implementation would fetch all document.fonts and embed them as base64.
  // For this implementation, we will assume standard fonts or that the user has them installed.
  // To keep bundle size small and avoid complex CORS issues with external fonts, 
  // we return the SVG string as is. 
  return svgString;
}

export async function renderSvgToCanvas(
  svgElement: SVGSVGElement, 
  canvas: HTMLCanvasElement, 
  width: number, 
  height: number, 
  theme: string,
  threeCanvas?: HTMLCanvasElement | null
): Promise<void> {
  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) return;

  // Serialize SVG
  const svgData = new XMLSerializer().serializeToString(svgElement);
  
  // Create Blob URL
  const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);
  
  // Load into Image
  const img = new Image();
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error('Failed to load SVG into Image'));
    img.src = url;
  });

  // Draw to canvas
  ctx.fillStyle = theme === 'dark' ? '#0b0b12' : '#f8f9fa';
  ctx.fillRect(0, 0, width, height);

  // If threeCanvas is provided, draw it first
  if (threeCanvas) {
    ctx.drawImage(threeCanvas, 0, 0, width, height);
  }

  ctx.drawImage(img, 0, 0, width, height);
  
  // Cleanup
  URL.revokeObjectURL(url);
}
