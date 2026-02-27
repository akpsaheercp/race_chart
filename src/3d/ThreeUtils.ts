/**
 * ThreeUtils.ts
 * Shared 3D utilities for RaceGraph Studio.
 */

import * as THREE from 'three';

export class ThreeUtils {
  /**
   * Creates a high-quality text sprite for labels.
   * Supports multiple lines if text contains \n
   */
  static createTextSprite(text: string, color: string, fontSize: number = 32, fontFamily: string = 'Inter, sans-serif'): any {
    const lines = text.split('\n');
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d')!;
    const font = `bold ${fontSize}px ${fontFamily}`;
    context.font = font;
    
    let maxWidth = 0;
    lines.forEach(line => {
      const metrics = context.measureText(line);
      if (metrics.width > maxWidth) maxWidth = metrics.width;
    });
    
    const width = maxWidth + 40;
    const height = (fontSize * lines.length) + 20 + (lines.length > 1 ? (lines.length - 1) * 10 : 0);
    
    canvas.width = width;
    canvas.height = height;
    
    // Redraw with correct canvas size
    context.font = font;
    context.fillStyle = color;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    
    lines.forEach((line, i) => {
      const y = (height / 2) - ((lines.length - 1) * (fontSize + 10) / 2) + (i * (fontSize + 10));
      context.fillText(line, width / 2, y);
    });
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    
    const material = new THREE.SpriteMaterial({ 
      map: texture,
      transparent: true,
      depthTest: false
    });
    
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(width / 10, height / 10, 1);
    
    return sprite;
  }

  /**
   * Formats a number for display.
   */
  static formatValue(val: number): string {
    if (val >= 1000000000) return (val / 1000000000).toFixed(1) + 'B';
    if (val >= 1000000) return (val / 1000000).toFixed(1) + 'M';
    if (val >= 1000) return (val / 1000).toFixed(1) + 'K';
    return val.toFixed(0);
  }

  /**
   * Converts a hex color string to a THREE.Color.
   */
  static hexToThreeColor(hex: string): any {
    return new THREE.Color(hex);
  }

  /**
   * Creates a rounded box geometry (simulated for r128).
   */
  static createRoundedBox(width: number, height: number, depth: number, radius: number, smoothness: number = 2): any {
    // r128 doesn't have RoundedBoxGeometry in core.
    // We'll use a standard BoxGeometry for now, or a custom shape if needed.
    // For simplicity and performance on mobile, standard Box is safer.
    return new THREE.BoxGeometry(width, height, depth);
  }

  /**
   * Disposes of an object and its children.
   */
  static disposeObject(obj: any) {
    if (obj.geometry) obj.geometry.dispose();
    if (obj.material) {
      if (Array.isArray(obj.material)) {
        obj.material.forEach((m: any) => m.dispose());
      } else {
        obj.material.dispose();
      }
    }
    if (obj.children) {
      obj.children.forEach((child: any) => this.disposeObject(child));
    }
  }
}
