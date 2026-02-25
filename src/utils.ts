import Papa from 'papaparse';
import { DataPoint } from './types';
import * as d3 from 'd3';

export const parseCSV = (csvText: string): DataPoint[] => {
  const parsed = Papa.parse(csvText, { header: true, skipEmptyLines: true });
  const data: DataPoint[] = [];

  if (parsed.data.length === 0) return data;

  // Assume first column is date/time, rest are categories
  const columns = Object.keys(parsed.data[0] as object);
  const dateCol = columns[0];

  parsed.data.forEach((row: any) => {
    const date = row[dateCol];
    for (let i = 1; i < columns.length; i++) {
      const name = columns[i];
      const value = parseFloat(row[name]);
      if (!isNaN(value)) {
        data.push({ date, name, value });
      }
    }
  });

  return data;
};

export const generateColors = (names: string[]): Record<string, string> => {
  const scale = d3.scaleOrdinal(d3.schemeTableau10).domain(names);
  const colors: Record<string, string> = {};
  names.forEach(name => {
    colors[name] = scale(name);
  });
  return colors;
};

export const formatNumber = d3.format(',.1f');

// Cinematic Easing: Cubic Bezier Ease-In-Out
export const easeInOutCubic = (t: number): number => {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};

export const getInterpolatedFrame = (dateGroups: any[], progress: number): DataPoint[] => {
  const floorIndex = Math.floor(progress);
  const ceilIndex = Math.min(floorIndex + 1, dateGroups.length - 1);
  
  // Linear interpolation for continuous value growth across year boundaries
  const t = progress - floorIndex;

  if (floorIndex === ceilIndex) return dateGroups[floorIndex].values;

  const startValues = dateGroups[floorIndex].values as DataPoint[];
  const endValues = dateGroups[ceilIndex].values as DataPoint[];

  const interpolated: DataPoint[] = [];
  const names = new Set([...startValues.map(v => v.name), ...endValues.map(v => v.name)]);

  names.forEach(name => {
    const start = startValues.find(v => v.name === name);
    const end = endValues.find(v => v.name === name);
    
    if (start && end) {
      interpolated.push({
        ...start,
        value: start.value + (end.value - start.value) * t
      });
    } else if (start) {
      // Fade out
      interpolated.push({ ...start, value: start.value * (1 - t) });
    } else if (end) {
      // Fade in
      interpolated.push({ ...end, value: end.value * t });
    }
  });

  return interpolated;
};
