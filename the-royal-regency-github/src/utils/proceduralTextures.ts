import * as THREE from 'three';
import { BallroomPlaqueData } from '../types/palace';

function configureRepeatTexture(
  canvas: HTMLCanvasElement,
  repeatX = 1,
  repeatY = 1
): THREE.CanvasTexture {
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeatX, repeatY);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  texture.needsUpdate = true;
  return texture;
}

/**
 * Generates veined European palace marble with subtle champagne-gold mineral veins.
 */
export function createMarbleTexture(
  baseColor = '#f5efe6',
  veinColor = '#d8cbb8',
  goldVein = '#d4af37',
  repeat = 4
): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, size, size);

  // Soft cloudy marble patches
  for (let i = 0; i < 42; i++) {
    const x = ((i * 97) % size);
    const y = ((i * 151) % size);
    const r = 60 + (i % 5) * 32;
    const grad = ctx.createRadialGradient(x, y, 4, x, y, r);
    grad.addColorStop(0, i % 2 === 0 ? 'rgba(210, 195, 180, 0.14)' : 'rgba(255, 250, 245, 0.22)');
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
  }

  // Subtle marble veins
  const drawVeins = (count: number, stroke: string, width: number, alpha: number) => {
    ctx.save();
    ctx.strokeStyle = stroke;
    ctx.lineWidth = width;
    ctx.globalAlpha = alpha;
    for (let i = 0; i < count; i++) {
      ctx.beginPath();
      let x = ((i * 137) % size);
      let y = 0;
      ctx.moveTo(x, y);
      for (let step = 0; step < 18; step++) {
        x += Math.sin(step * 0.9 + i * 1.7) * 26 + Math.cos(i * 2.1) * 8;
        y += size / 16;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    ctx.restore();
  };

  drawVeins(10, veinColor, 2.2, 0.35);
  drawVeins(6, veinColor, 1.0, 0.48);
  drawVeins(4, goldVein, 0.85, 0.22);

  // Subtle tile grout lines for classical marble flagstones
  ctx.strokeStyle = 'rgba(180, 160, 130, 0.22)';
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, size - 2, size - 2);
  ctx.beginPath();
  ctx.moveTo(size / 2, 0);
  ctx.lineTo(size / 2, size);
  ctx.moveTo(0, size / 2);
  ctx.lineTo(size, size / 2);
  ctx.stroke();

  return configureRepeatTexture(canvas, repeat, repeat);
}

/**
 * Generates royal baroque damask wall paneling texture.
 */
export function createDamaskWallpaperTexture(
  baseColor = '#f2e6dc',
  accentColor = '#d4af37',
  repeatX = 6,
  repeatY = 3
): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, size, size);

  // Vertical silk damask stripes
  ctx.fillStyle = 'rgba(255, 255, 255, 0.16)';
  for (let x = 0; x < size; x += 32) {
    ctx.fillRect(x, 0, 10, size);
  }

  // Ornate diamond filigree medallions
  ctx.save();
  ctx.strokeStyle = accentColor;
  ctx.globalAlpha = 0.26;
  ctx.lineWidth = 1.6;
  const centers = [
    [size / 2, size / 2],
    [0, 0],
    [size, 0],
    [0, size],
    [size, size],
  ];
  for (const [cx, cy] of centers) {
    ctx.beginPath();
    ctx.moveTo(cx, cy - 42);
    ctx.quadraticCurveTo(cx + 28, cy - 16, cx + 42, cy);
    ctx.quadraticCurveTo(cx + 28, cy + 16, cx, cy + 42);
    ctx.quadraticCurveTo(cx - 28, cy + 16, cx - 42, cy);
    ctx.quadraticCurveTo(cx - 28, cy - 16, cx, cy - 42);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx, cy, 12, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();

  return configureRepeatTexture(canvas, repeatX, repeatY);
}

/**
 * Generates plush velvet texture for royal drapes and carpets.
 */
export function createVelvetTexture(color = '#6b1d34', repeatX = 2, repeatY = 2): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = color;
  ctx.fillRect(0, 0, size, size);

  const grad = ctx.createLinearGradient(0, 0, size, 0);
  grad.addColorStop(0, 'rgba(0,0,0,0.28)');
  grad.addColorStop(0.25, 'rgba(255,220,230,0.12)');
  grad.addColorStop(0.5, 'rgba(0,0,0,0.22)');
  grad.addColorStop(0.75, 'rgba(255,220,230,0.14)');
  grad.addColorStop(1, 'rgba(0,0,0,0.28)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  // Fine woven velvet grain
  ctx.fillStyle = 'rgba(255,255,255,0.03)';
  for (let y = 0; y < size; y += 3) {
    ctx.fillRect(0, y, size, 1);
  }

  return configureRepeatTexture(canvas, repeatX, repeatY);
}

/**
 * Generates carved palace door wood + gold trim texture.
 */
export function createRoyalDoorTexture(woodColor = '#4a1b26', goldColor = '#d4af37'): THREE.CanvasTexture {
  const w = 512;
  const h = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = woodColor;
  ctx.fillRect(0, 0, w, h);

  // Subtle vertical wood grain
  ctx.fillStyle = 'rgba(0,0,0,0.1)';
  for (let x = 0; x < w; x += 6) {
    ctx.fillRect(x, 0, 2, h);
  }

  // Ornate gilded molding panels
  const drawPanel = (x: number, y: number, pw: number, ph: number) => {
    ctx.strokeStyle = goldColor;
    ctx.lineWidth = 8;
    ctx.strokeRect(x, y, pw, ph);
    ctx.strokeStyle = 'rgba(255, 240, 200, 0.5)';
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 14, y + 14, pw - 28, ph - 28);

    // Center diamond crest
    const cx = x + pw / 2;
    const cy = y + ph / 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy - 36);
    ctx.lineTo(cx + 26, cy);
    ctx.lineTo(cx, cy + 36);
    ctx.lineTo(cx - 26, cy);
    ctx.closePath();
    ctx.strokeStyle = goldColor;
    ctx.lineWidth = 3;
    ctx.stroke();
  };

  drawPanel(48, 64, w - 96, 380);
  drawPanel(48, 520, w - 96, 420);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

/**
 * Generates soft translucent rose petal sprite texture.
 */
export function createRosePetalTexture(color = '#f3a8bc'): THREE.CanvasTexture {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, size, size);
  ctx.save();
  ctx.translate(size / 2, size / 2);

  const grad = ctx.createRadialGradient(-8, -10, 6, 0, 0, 54);
  grad.addColorStop(0, '#fff2f5');
  grad.addColorStop(0.45, color);
  grad.addColorStop(1, 'rgba(180, 60, 95, 0.85)');

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(0, 44);
  ctx.bezierCurveTo(-48, 22, -52, -32, -14, -44);
  ctx.bezierCurveTo(-2, -48, 2, -34, 0, -30);
  ctx.bezierCurveTo(-2, -34, 2, -48, 14, -44);
  ctx.bezierCurveTo(52, -32, 48, 22, 0, 44);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

/**
 * Generates an elegant limestone garden pathway texture.
 */
export function createGardenPathTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#e7dcc8';
  ctx.fillRect(0, 0, size, size);

  ctx.strokeStyle = 'rgba(155, 136, 110, 0.35)';
  ctx.lineWidth = 3;
  const rows = 4;
  const rh = size / rows;
  for (let r = 0; r < rows; r++) {
    const y = r * rh;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(size, y);
    ctx.stroke();

    const offset = r % 2 === 0 ? 0 : 48;
    for (let x = offset; x < size; x += 96) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y + rh);
      ctx.stroke();
    }
  }

  return configureRepeatTexture(canvas, 3, 12);
}

/**
 * Wraps long text neatly onto a 2D canvas.
 */
function drawWrappedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  startY: number,
  maxWidth: number,
  lineHeight: number,
  maxLines = 8
): number {
  const words = text.trim().split(/\s+/);
  let line = '';
  let y = startY;
  let linesDrawn = 0;

  for (let i = 0; i < words.length; i++) {
    const testLine = line ? `${line} ${words[i]}` : words[i];
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && line) {
      ctx.fillText(line, x, y);
      line = words[i];
      y += lineHeight;
      linesDrawn += 1;
      if (linesDrawn >= maxLines - 1) {
        break;
      }
    } else {
      line = testLine;
    }
  }
  if (line) {
    ctx.fillText(line, x, y);
    y += lineHeight;
  }
  return y;
}

/**
 * Renders the live-editable 3D gilded Royal Ballroom Dedication Plaque texture.
 */
export function createPlaqueCanvasTexture(
  plaque: BallroomPlaqueData,
  accentColor = '#d4af37',
  burgundyColor = '#4a1124'
): THREE.CanvasTexture {
  const w = 1024;
  const h = 1280;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  // Deep royal velvet/obsidian enamel background
  const bgGrad = ctx.createLinearGradient(0, 0, w, h);
  bgGrad.addColorStop(0, '#2a0b18');
  bgGrad.addColorStop(0.5, burgundyColor);
  bgGrad.addColorStop(1, '#1a0710');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, w, h);

  // Subtle radial golden sheen in center
  const glow = ctx.createRadialGradient(w / 2, h * 0.42, 40, w / 2, h * 0.42, 560);
  glow.addColorStop(0, 'rgba(243, 217, 164, 0.16)');
  glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);

  // Double ornate golden borders
  ctx.strokeStyle = accentColor;
  ctx.lineWidth = 14;
  ctx.strokeRect(36, 36, w - 72, h - 72);

  ctx.strokeStyle = '#f8e3b0';
  ctx.lineWidth = 3;
  ctx.strokeRect(62, 62, w - 124, h - 124);

  // Corner flourishes
  const corners = [
    [62, 62, 1, 1],
    [w - 62, 62, -1, 1],
    [62, h - 62, 1, -1],
    [w - 62, h - 62, -1, -1],
  ];
  ctx.strokeStyle = accentColor;
  ctx.lineWidth = 4;
  for (const [cx, cy, dx, dy] of corners) {
    ctx.beginPath();
    ctx.arc(cx + dx * 28, cy + dy * 28, 22, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Stylized crown motif at top
  ctx.save();
  ctx.translate(w / 2, 152);
  ctx.fillStyle = accentColor;
  ctx.strokeStyle = '#fff1c9';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-64, 24);
  ctx.lineTo(-76, -24);
  ctx.lineTo(-32, 0);
  ctx.lineTo(0, -44);
  ctx.lineTo(32, 0);
  ctx.lineTo(76, -24);
  ctx.lineTo(64, 24);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  ctx.textAlign = 'center';

  // Main title
  ctx.fillStyle = '#f6df9e';
  ctx.font = '600 40px "Cinzel", Georgia, serif';
  ctx.fillText((plaque.mainTitle || 'THE ROYAL DEDICATION').toUpperCase(), w / 2, 255);

  // Divider line
  ctx.strokeStyle = accentColor;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(w / 2 - 190, 286);
  ctx.lineTo(w / 2 + 190, 286);
  ctx.stroke();

  // Dedication subtitle
  ctx.fillStyle = '#f4c2c2';
  ctx.font = 'italic 34px "Cormorant Garamond", Georgia, serif';
  ctx.fillText(plaque.dedication || 'Eternally Dedicated To', w / 2, 355);

  // Recipient name (hero script / display)
  ctx.fillStyle = '#fff8e6';
  ctx.font = '600 84px "Playfair Display", Georgia, serif';
  ctx.fillText(plaque.recipientName || 'My Dearest', w / 2, 468);

  // Small diamond ornament
  ctx.fillStyle = accentColor;
  ctx.beginPath();
  ctx.moveTo(w / 2, 515);
  ctx.lineTo(w / 2 + 16, 531);
  ctx.lineTo(w / 2, 547);
  ctx.lineTo(w / 2 - 16, 531);
  ctx.closePath();
  ctx.fill();

  // Romantic message body (scales cleanly so longer dedications never clip)
  ctx.fillStyle = '#faf0e4';
  const msgText = plaque.romanticMessage || '';
  const isLongMsg = msgText.length > 220;
  ctx.font = isLongMsg
    ? '400 32px "Cormorant Garamond", Georgia, serif'
    : '400 38px "Cormorant Garamond", Georgia, serif';
  const afterMessageY = drawWrappedText(
    ctx,
    msgText,
    w / 2,
    isLongMsg ? 600 : 622,
    w - 190,
    isLongMsg ? 45 : 54,
    10
  );

  // Special date
  const dateY = Math.max(afterMessageY + 34, 1010);
  ctx.fillStyle = '#f3d9a4';
  ctx.font = '600 34px "Cinzel", Georgia, serif';
  ctx.fillText(plaque.specialDate || 'Forever & Always', w / 2, dateY);

  // Additional personal text
  ctx.fillStyle = 'rgba(244, 194, 194, 0.88)';
  ctx.font = 'italic 28px "Cormorant Garamond", Georgia, serif';
  drawWrappedText(ctx, plaque.additionalText || '', w / 2, dateY + 62, w - 230, 38, 3);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  texture.needsUpdate = true;
  return texture;
}

/**
 * Generates an artistic royal monogram placeholder portrait when a gallery frame
 * has not yet had a personal photograph uploaded.
 */
export function createPlaceholderPortraitTexture(
  frameNumber: number,
  caption: string,
  accentColor = '#d4af37',
  secondaryColor = '#f4c2c2'
): THREE.CanvasTexture {
  const w = 640;
  const h = 800;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createLinearGradient(0, 0, w, h);
  grad.addColorStop(0, '#241029');
  grad.addColorStop(0.5, '#3b152a');
  grad.addColorStop(1, '#1a0a1e');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Decorative inner border
  ctx.strokeStyle = accentColor;
  ctx.lineWidth = 4;
  ctx.strokeRect(34, 34, w - 68, h - 68);

  ctx.strokeStyle = 'rgba(244, 194, 194, 0.35)';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(50, 50, w - 100, h - 100);

  // Ornate center crest ring
  ctx.beginPath();
  ctx.arc(w / 2, h * 0.42, 118, 0, Math.PI * 2);
  ctx.strokeStyle = accentColor;
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(w / 2, h * 0.42, 102, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(244, 194, 194, 0.45)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.fillStyle = '#f6df9e';
  ctx.font = '600 54px "Cinzel", Georgia, serif';
  ctx.fillText(`No. ${frameNumber}`, w / 2, h * 0.42 + 18);

  ctx.fillStyle = secondaryColor;
  ctx.font = 'italic 30px "Cormorant Garamond", Georgia, serif';
  ctx.fillText('Awaiting Your Photograph', w / 2, h * 0.65);

  ctx.fillStyle = '#faf6f0';
  ctx.font = '500 28px "Playfair Display", Georgia, serif';
  drawWrappedText(ctx, caption || 'Upload a Cherished Memory', w / 2, h * 0.74, w - 140, 36, 2);

  ctx.fillStyle = 'rgba(243, 217, 164, 0.72)';
  ctx.font = '500 18px "Cinzel", Georgia, serif';
  ctx.fillText('CLICK FRAME TO UPLOAD PHOTO', w / 2, h - 78);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}
