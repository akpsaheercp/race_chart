import { ChartConfig } from '../types';

export const DEFAULT_CHART_CONFIG: Omit<ChartConfig, 'id'> = {
  title: 'New Production',
  subtitle: '',
  caption: '',
  type: 'bar',
  data: [],
  colors: {},
  maxBars: 10,
  duration: 500,
  theme: 'light',
  fontFamily: 'Inter, sans-serif',
  showAnnotations: false,
  annotations: {},
  interpolation: true,
  fps: 60,
  entitySettings: {},
  showLegend: false,
  legendPosition: 'bottom-right',
};

export function validateConfig(config: Partial<ChartConfig>): ChartConfig {
  return {
    ...DEFAULT_CHART_CONFIG,
    ...config,
    id: config.id || Date.now().toString(),
    maxBars: Math.max(3, Math.min(50, config.maxBars || 10)),
    duration: Math.max(100, config.duration || 500),
  } as ChartConfig;
}
