import React from 'react';
import { ChartConfig, DataPoint } from '../../../../types';

export interface RaceProps {
  svgRef: React.RefObject<SVGSVGElement>;
  config: ChartConfig;
  isPlaying: boolean;
  currentTimeIndex: number;
  dimensions: { width: number; height: number };
  dateGroups: { date: string; values: DataPoint[] }[];
}
