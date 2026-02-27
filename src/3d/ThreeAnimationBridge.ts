/**
 * ThreeAnimationBridge.ts
 * Connects existing animation controls to 3D charts.
 */

import { ThreeSetup } from './ThreeSetup';
import { ChartConfig } from '../types';

export interface ThreeChart {
  update(currentTimeIndex: number): void;
  dispose(): void;
}

export class ThreeAnimationBridge {
  private setup: ThreeSetup;
  private currentChart: ThreeChart | null = null;

  constructor(setup: ThreeSetup) {
    this.setup = setup;
    this.init();
  }

  private init() {
    window.addEventListener('time-update', this.handleTimeUpdate as any);
  }

  private handleTimeUpdate = (e: CustomEvent) => {
    if (this.currentChart) {
      this.currentChart.update(e.detail);
    }
  };

  public setChart(chart: ThreeChart) {
    if (this.currentChart) {
      this.currentChart.dispose();
    }
    this.currentChart = chart;
    
    // Give a moment for the initial update to position objects before fitting
    setTimeout(() => {
      if (this.setup) {
        this.setup.fitCameraToScene(1.8);
      }
    }, 100);
  }

  public dispose() {
    window.removeEventListener('time-update', this.handleTimeUpdate as any);
    if (this.currentChart) {
      this.currentChart.dispose();
    }
  }
}
