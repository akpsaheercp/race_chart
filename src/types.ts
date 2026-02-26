export interface DataPoint {
  date: string;
  name: string;
  value: number;
  category?: string;
  entity?: string; // For multi-entity datasets like USA vs China
  timestamp?: number;
}

export interface ChartConfig {
  id: string;
  title: string;
  subtitle: string;
  caption: string;
  type: 'bar' | 'column' | 'stacked' | 'line' | 'area' | 'bubble' | 'pie' | 'stacked-bar';
  orientation?: 'horizontal' | 'vertical';
  data: DataPoint[];
  secondaryData?: DataPoint[];
  colors: Record<string, string>;
  maxBars: number;
  duration: number;
  theme: 'light' | 'dark';
  logoUrl?: string;
  watermarkUrl?: string;
  fontFamily: string;
  showAnnotations: boolean;
  annotations: Record<string, string>;
  interpolation: boolean;
  fps: number;
  entityFilter?: string;
  entitySettings: Record<string, {
    color?: string;
    icon?: string;
    iconPosition?: 'before-name' | 'after-name' | 'end-of-bar';
  }>;
  showLegend: boolean;
  legendPosition: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

export interface AudioConfig {
  script: string;
  voiceoverUrl?: string;
  bgmUrl?: string;
  bgmVolume: number;
  loopBgm: boolean;
}

export interface YouTubeMetadata {
  title: string;
  description: string;
  tags: string[];
}
