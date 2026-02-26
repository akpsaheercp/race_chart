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
  xAxisPosition: 'top',
  dateBorderWidth: 0,
  showLabels: true,
  showIcons: true,
  barStyle: 'solid',
  animationType: 'linear',
  stiffness: 0.1,
  damping: 0.8,
  staggerDelay: false,
  showParticles: false,
  showRipple: false,
  dotEffect: 'none',
  dotSize: 6,
  dotGap: 2,
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
