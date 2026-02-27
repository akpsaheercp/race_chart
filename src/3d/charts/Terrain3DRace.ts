/**
 * Terrain3DRace.ts
 * 3D Terrain Race chart implementation.
 */

import * as THREE from 'three';
import { ThreeUtils } from '../ThreeUtils';
import { ChartConfig, DataPoint } from '../../types';
import { ThreeChart } from '../ThreeAnimationBridge';

export class Terrain3DRace implements ThreeChart {
  private scene: any;
  private config: ChartConfig;
  private points: Map<string, any> = new Map();
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
    const uniqueNames = Array.from(new Set(this.config.data.map(d => d.name)));
    
    // Create a grid of points
    uniqueNames.forEach((name, index) => {
      const color = this.config.colors[name] || '#888888';
      
      const geometry = new THREE.SphereGeometry(2, 16, 16);
      const material = new THREE.MeshStandardMaterial({ 
        color: ThreeUtils.hexToThreeColor(color),
        emissive: ThreeUtils.hexToThreeColor(color),
        emissiveIntensity: 0.5
      });
      const point = new THREE.Mesh(geometry, material);
      point.castShadow = true;
      this.group.add(point);
      this.points.set(name, point);

      const vColor = this.config.theme === 'dark' ? '#ffffff' : '#111111';
      const vLabel = ThreeUtils.createTextSprite('0', vColor, 28);
      this.group.add(vLabel);
      this.valueLabels.set(name, vLabel);

      const nLabel = ThreeUtils.createTextSprite(name, this.config.theme === 'dark' ? '#aaaaaa' : '#666666', 24);
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

    const sortedNames = Array.from(this.points.keys()).sort((a, b) => {
      const valA = d3.interpolate(dataMap.get(a) || 0, nextDataMap.get(a) || 0)(t);
      const valB = d3.interpolate(dataMap.get(b) || 0, nextDataMap.get(b) || 0)(t);
      return valB - valA;
    });

    const maxVal = Math.max(...currentData.map(d => d.value), ...nextData.map(d => d.value), 1);

    sortedNames.forEach((name, rank) => {
      const point = this.points.get(name);
      const vLabel = this.valueLabels.get(name);
      const nLabel = this.nameLabels.get(name);
      if (!point || !vLabel || !nLabel) return;

      const val = d3.interpolate(dataMap.get(name) || 0, nextDataMap.get(name) || 0)(t);
      const height = (val / maxVal) * 100;

      point.position.y = height;
      
      // Grid layout
      const size = Math.ceil(Math.sqrt(this.config.maxBars));
      const row = Math.floor(rank / size);
      const col = rank % size;
      const targetX = (col - size / 2) * 30;
      const targetZ = (row - size / 2) * 30;
      
      point.position.x += (targetX - point.position.x) * 0.1;
      point.position.z += (targetZ - point.position.z) * 0.1;

      vLabel.position.x = point.position.x;
      vLabel.position.z = point.position.z;
      vLabel.position.y = height + 10;

      const formattedVal = ThreeUtils.formatValue(val);
      if (vLabel.userData.lastVal !== formattedVal) {
        const vColor = this.config.theme === 'dark' ? '#ffffff' : '#111111';
        const newSprite = ThreeUtils.createTextSprite(formattedVal, vColor, 28);
        vLabel.material.map.dispose();
        vLabel.material.map = newSprite.material.map;
        vLabel.scale.copy(newSprite.scale);
        vLabel.userData.lastVal = formattedVal;
      }

      nLabel.position.x = point.position.x;
      nLabel.position.z = point.position.z;
      nLabel.position.y = height - 8;
      
      const isVisible = rank < this.config.maxBars;
      point.visible = isVisible;
      vLabel.visible = isVisible;
      nLabel.visible = isVisible;
    });
  }

  public dispose() {
    this.scene.remove(this.group);
    ThreeUtils.disposeObject(this.group);
  }
}

const d3 = (window as any).d3 || {
  interpolate: (a: number, b: number) => (t: number) => a + (b - a) * t
};
