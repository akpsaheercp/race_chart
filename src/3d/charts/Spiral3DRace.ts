/**
 * Spiral3DRace.ts
 * 3D Spiral Race chart implementation.
 */

import * as THREE from 'three';
import { ThreeUtils } from '../ThreeUtils';
import { ChartConfig, DataPoint } from '../../types';
import { ThreeChart } from '../ThreeAnimationBridge';

export class Spiral3DRace implements ThreeChart {
  private scene: any;
  private config: ChartConfig;
  private nodes: Map<string, any> = new Map();
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
    uniqueNames.forEach((name, index) => {
      const color = this.config.colors[name] || '#888888';
      
      const geometry = new THREE.IcosahedronGeometry(4, 1);
      const material = new THREE.MeshStandardMaterial({ 
        color: ThreeUtils.hexToThreeColor(color),
        wireframe: true
      });
      const node = new THREE.Mesh(geometry, material);
      this.group.add(node);
      this.nodes.set(name, node);

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

    const sortedNames = Array.from(this.nodes.keys()).sort((a, b) => {
      const valA = d3.interpolate(dataMap.get(a) || 0, nextDataMap.get(a) || 0)(t);
      const valB = d3.interpolate(dataMap.get(b) || 0, nextDataMap.get(b) || 0)(t);
      return valB - valA;
    });

    const maxVal = Math.max(...currentData.map(d => d.value), ...nextData.map(d => d.value), 1);

    sortedNames.forEach((name, rank) => {
      const node = this.nodes.get(name);
      const vLabel = this.valueLabels.get(name);
      const nLabel = this.nameLabels.get(name);
      if (!node || !vLabel || !nLabel) return;

      const val = d3.interpolate(dataMap.get(name) || 0, nextDataMap.get(name) || 0)(t);
      const spiralFactor = (val / maxVal);
      
      const angle = rank * 0.5 + currentTimeIndex * 0.1;
      const radius = rank * 5 + 10;
      const targetX = Math.cos(angle) * radius;
      const targetZ = Math.sin(angle) * radius;
      const targetY = rank * 5;
      
      node.position.x += (targetX - node.position.x) * 0.1;
      node.position.z += (targetZ - node.position.z) * 0.1;
      node.position.y += (targetY - node.position.y) * 0.1;
      
      node.rotation.y += 0.05;

      vLabel.position.x = node.position.x;
      vLabel.position.z = node.position.z;
      vLabel.position.y = node.position.y + 10;

      const formattedVal = ThreeUtils.formatValue(val);
      if (vLabel.userData.lastVal !== formattedVal) {
        const vColor = this.config.theme === 'dark' ? '#ffffff' : '#111111';
        const newSprite = ThreeUtils.createTextSprite(formattedVal, vColor, 28);
        vLabel.material.map.dispose();
        vLabel.material.map = newSprite.material.map;
        vLabel.scale.copy(newSprite.scale);
        vLabel.userData.lastVal = formattedVal;
      }

      nLabel.position.x = node.position.x;
      nLabel.position.z = node.position.z;
      nLabel.position.y = node.position.y - 8;
      
      const isVisible = rank < this.config.maxBars;
      node.visible = isVisible;
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
