import fs from 'fs';
import path from 'path';
import { createCanvas } from 'canvas';

const ICONS_DIR = path.join(process.cwd(), 'public', 'icons');
const SPLASH_DIR = path.join(process.cwd(), 'public', 'splash');

// Ensure directories exist
if (!fs.existsSync(ICONS_DIR)) fs.mkdirSync(ICONS_DIR, { recursive: true });
if (!fs.existsSync(SPLASH_DIR)) fs.mkdirSync(SPLASH_DIR, { recursive: true });

function drawIcon(ctx: any, size: number, padding: number = 0) {
  const safeSize = size - padding * 2;
  const cx = size / 2;
  const cy = size / 2;

  // Background
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, '#0b0b12');
  gradient.addColorStop(1, '#1c1c2e');
  ctx.fillStyle = gradient;
  
  // Rounded rect
  const radius = size * 0.2;
  ctx.beginPath();
  ctx.moveTo(radius, 0);
  ctx.lineTo(size - radius, 0);
  ctx.quadraticCurveTo(size, 0, size, radius);
  ctx.lineTo(size, size - radius);
  ctx.quadraticCurveTo(size, size, size - radius, size);
  ctx.lineTo(radius, size);
  ctx.quadraticCurveTo(0, size, 0, size - radius);
  ctx.lineTo(0, radius);
  ctx.quadraticCurveTo(0, 0, radius, 0);
  ctx.closePath();
  ctx.fill();

  // Bars
  const barWidth = safeSize * 0.15;
  const gap = safeSize * 0.05;
  const startX = cx - (barWidth * 1.5 + gap);
  const startY = cy + safeSize * 0.2;

  // Bar 1 (tallest)
  ctx.fillStyle = '#7c6fff';
  ctx.fillRect(startX, startY - safeSize * 0.5, barWidth, safeSize * 0.5);

  // Bar 2 (medium)
  ctx.fillStyle = '#ff5f8a';
  ctx.fillRect(startX + barWidth + gap, startY - safeSize * 0.35, barWidth, safeSize * 0.35);

  // Bar 3 (short)
  ctx.fillStyle = '#38e8a0';
  ctx.fillRect(startX + (barWidth + gap) * 2, startY - safeSize * 0.2, barWidth, safeSize * 0.2);

  // Play Arrow
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  const arrowSize = safeSize * 0.15;
  const arrowX = cx + safeSize * 0.3;
  const arrowY = cy - safeSize * 0.1;
  ctx.moveTo(arrowX, arrowY - arrowSize);
  ctx.lineTo(arrowX + arrowSize * 1.5, arrowY);
  ctx.lineTo(arrowX, arrowY + arrowSize);
  ctx.closePath();
  ctx.fill();

  // Text "RG"
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${safeSize * 0.25}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('RG', cx, cy + safeSize * 0.35);
}

function generateIcon(filename: string, size: number, padding: number = 0) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  drawIcon(ctx, size, padding);
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(path.join(ICONS_DIR, filename), buffer);
  console.log(`Generated ${filename}`);
}

function generateSplash(filename: string, width: number, height: number) {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  
  // Background
  ctx.fillStyle = '#0b0b12';
  ctx.fillRect(0, 0, width, height);
  
  // Center icon
  const iconSize = Math.min(width, height) * 0.3;
  ctx.save();
  ctx.translate(width / 2 - iconSize / 2, height / 2 - iconSize / 2);
  drawIcon(ctx, iconSize);
  ctx.restore();
  
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(path.join(SPLASH_DIR, filename), buffer);
  console.log(`Generated ${filename}`);
}

// Generate PWA Icons
generateIcon('pwa-64.png', 64);
generateIcon('pwa-192.png', 192);
generateIcon('pwa-512.png', 512, 51); // 10% padding for maskable
generateIcon('apple-touch-icon.png', 180);
generateIcon('shortcut-bar.png', 96);
generateIcon('shortcut-new.png', 96);
generateIcon('favicon.png', 32);

// Copy favicon.png to favicon.ico
fs.copyFileSync(path.join(ICONS_DIR, 'favicon.png'), path.join(ICONS_DIR, 'favicon.ico'));

// Generate Splash Screens
generateSplash('apple-splash-2048-2732.png', 2048, 2732);
generateSplash('apple-splash-1170-2532.png', 1170, 2532);

// Generate SVG Favicon
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="102" fill="#0b0b12"/>
  <rect x="128" y="153" width="51" height="204" fill="#7c6fff"/>
  <rect x="204" y="204" width="51" height="153" fill="#ff5f8a"/>
  <rect x="281" y="256" width="51" height="102" fill="#38e8a0"/>
  <path d="M384 204L435 255L384 306Z" fill="#ffffff"/>
  <text x="256" y="435" font-family="sans-serif" font-weight="bold" font-size="102" fill="#ffffff" text-anchor="middle">RG</text>
</svg>`;
fs.writeFileSync(path.join(ICONS_DIR, 'favicon.svg'), svgContent);
console.log('Generated favicon.svg');
