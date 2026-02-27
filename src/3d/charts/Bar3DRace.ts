/**
 * Bar3DRace.ts
 * 3D Bar Race chart implementation.
 */

import * as THREE from 'three';
import { ThreeUtils } from '../ThreeUtils';
import { ChartConfig, DataPoint } from '../../types';
import { ThreeChart } from '../ThreeAnimationBridge';

export class Bar3DRace implements ThreeChart {
  private scene: any;
  private config: ChartConfig;
  private bars: Map<string, any> = new Map();
  private valueLabels: Map<string, any> = new Map();
  private nameLabels: Map<string, any> = new Map();
  private dateGroups: { date: string; values: DataPoint[] }[];
  private group: any;

  constructor(scene: any, config: ChartConfig, dateGroups: { date: string; values: DataPoint[] }[]) {
    this.scene = scene;
    this.config = config;
    this.dateGroups = dateGroups;
    this.group = new THREE.Group();
    this.scene.add(this.group);
    this.init();
  }

  private init() {
    // Create initial bars
    const uniqueNames = Array.from(new Set(this.config.data.map(d => d.name)));
    uniqueNames.forEach((name, index) => {
      const color = this.config.colors[name] || '#888888';
      
      // Bar
      const geometry = new THREE.BoxGeometry(10, 1, 10);
      const material = new THREE.MeshStandardMaterial({ 
        color: ThreeUtils.hexToThreeColor(color),
        roughness: 0.3,
        metalness: 0.2
      });
      const bar = new THREE.Mesh(geometry, material);
      bar.castShadow = true;
      bar.receiveShadow = true;
      bar.position.set(index * 15 - (uniqueNames.length * 7.5), 0, 0);
      this.group.add(bar);
      this.bars.set(name, bar);

      // Value Label (Top)
      const vColor = this.config.valueColor || (this.config.theme === 'dark' ? '#ffffff' : '#111111');
      const vLabel = ThreeUtils.createTextSprite('0', vColor, 28, this.config.fontFamily);
      vLabel.position.set(bar.position.x, 20, 0);
      vLabel.visible = this.config.showLabels;
      this.group.add(vLabel);
      this.valueLabels.set(name, vLabel);

      // Name Label (Bottom)
      const nColor = this.config.labelColor || (this.config.theme === 'dark' ? '#aaaaaa' : '#666666');
      const nLabel = ThreeUtils.createTextSprite(name, nColor, 24, this.config.fontFamily);
      nLabel.position.set(bar.position.x, -8, 0);
      nLabel.visible = this.config.showLabels;
      this.group.add(nLabel);
      this.nameLabels.set(name, nLabel);
    });
  }

  public update(currentTimeIndex: number) {
    const floorIndex = Math.floor(currentTimeIndex);
    const ceilIndex = Math.min(floorIndex + 1, this.dateGroups.length - 1);
    const t = currentTimeIndex - floorIndex;

    const currentData = this.dateGroups[floorIndex]?.values || [];
    const nextData = this.dateGroups[ceilIndex]?.values || [];

    const dataMap = new Map(currentData.map(d => [d.name, d.value]));
    const nextDataMap = new Map(nextData.map(d => [d.name, d.value]));

    // Sort by value to get ranks
    const sortedNames = Array.from(this.bars.keys()).sort((a, b) => {
      const valA = d3.interpolate(dataMap.get(a) || 0, nextDataMap.get(a) || 0)(t);
      const valB = d3.interpolate(dataMap.get(b) || 0, nextDataMap.get(b) || 0)(t);
      return valB - valA;
    });

    const maxVal = Math.max(...currentData.map(d => d.value), ...nextData.map(d => d.value), 1);

    sortedNames.forEach((name, rank) => {
      const bar = this.bars.get(name);
      const vLabel = this.valueLabels.get(name);
      const nLabel = this.nameLabels.get(name);
      if (!bar || !vLabel || !nLabel) return;

      const val = d3.interpolate(dataMap.get(name) || 0, nextDataMap.get(name) || 0)(t);
      const height = (val / maxVal) * 100 + 0.1;

      // Update bar
      bar.scale.y = height;
      bar.position.y = height / 2;
      
      // Interpolate position based on rank
      const targetX = rank * 15 - (this.config.maxBars * 7.5);
      bar.position.x += (targetX - bar.position.x) * 0.1;

      // Update labels
      vLabel.position.x = bar.position.x;
      vLabel.position.y = height + 8;
      
      // Update value text (re-creating texture is expensive, but necessary for dynamic values in sprites)
      // Optimization: Only update if value changed significantly or every few frames
      // For now, we'll just update it.
      const formattedVal = ThreeUtils.formatValue(val);
      if (vLabel.userData.lastVal !== formattedVal) {
        const vColor = this.config.valueColor || (this.config.theme === 'dark' ? '#ffffff' : '#111111');
        const newSprite = ThreeUtils.createTextSprite(formattedVal, vColor, 28, this.config.fontFamily);
        vLabel.material.map.dispose();
        vLabel.material.map = newSprite.material.map;
        vLabel.scale.copy(newSprite.scale);
        vLabel.userData.lastVal = formattedVal;
      }

      nLabel.position.x = bar.position.x;
      nLabel.position.y = -8;
      
      // Visibility based on maxBars and showLabels
      const isVisible = rank < this.config.maxBars;
      bar.visible = isVisible;
      vLabel.visible = isVisible && this.config.showLabels;
      nLabel.visible = isVisible && this.config.showLabels;
    });
  }

  public dispose() {
    this.scene.remove(this.group);
    ThreeUtils.disposeObject(this.group);
  }
}

// Mock d3 for interpolation if not available globally
const d3 = (window as any).d3 || {
  interpolate: (a: number, b: number) => (t: number) => a + (b - a) * t
};
