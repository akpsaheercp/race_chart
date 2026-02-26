import Papa from 'papaparse';
import { DataPoint, ChartConfig } from '../types';
import * as d3 from 'd3';

export const parseCSV = (csvText: string): { data: DataPoint[], config: Partial<ChartConfig> } => {
  const config: Partial<ChartConfig> = {};
  
  // Extract metadata lines starting with #
  const lines = csvText.split('\n');
  const dataLines = [];
  for (const line of lines) {
    if (line.trim().startsWith('#')) {
      const match = line.match(/^#([^,=]+)[,=](.+)$/);
      if (match) {
        const key = match[1].trim() as keyof ChartConfig;
        const value = match[2].trim();
        if (key === 'duration' || key === 'maxBars' || key === 'fps') {
          (config as any)[key] = parseInt(value, 10);
        } else if (key === 'interpolation') {
          (config as any)[key] = value.toLowerCase() === 'true';
        } else {
          (config as any)[key] = value;
        }
      }
    } else {
      dataLines.push(line);
    }
  }
  
  const cleanCsvText = dataLines.join('\n');
  const parsed = Papa.parse(cleanCsvText, { header: true, skipEmptyLines: true });
  const data: DataPoint[] = [];

  if (parsed.data.length === 0) return { data, config };

  const columns = Object.keys(parsed.data[0] as object);
  const dateCol = columns[0];

  if (!dateCol) throw new Error("No columns found in CSV");

  const parsedRows = parsed.data.map((row: any, index: number) => {
    const dateStr = row[dateCol];
    if (!dateStr) throw new Error(`Missing date at row ${index + 1}`);
    
    let dateObj = new Date(dateStr);
    
    // Try to parse DD/MM/YY, DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD
    const parts = dateStr.split(/[-/]/);
    if (parts.length === 3) {
      let [p1, p2, p3] = parts;
      
      // If p3 is year (2 or 4 digits)
      if (p3.length === 2 || p3.length === 4) {
        let y = p3;
        if (y.length === 2) y = (parseInt(y) < 50 ? '20' : '19') + y;
        
        // Assume DD/MM/YYYY by default
        let d = p1, m = p2;
        if (parseInt(p2) > 12) {
          // MM/DD/YYYY
          m = p1;
          d = p2;
        }
        
        const parsedDate = new Date(`${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}T00:00:00`);
        if (!isNaN(parsedDate.getTime())) {
          dateObj = parsedDate;
        }
      } else if (p1.length === 4) {
        // YYYY-MM-DD
        const parsedDate = new Date(`${p1}-${p2.padStart(2, '0')}-${p3.padStart(2, '0')}T00:00:00`);
        if (!isNaN(parsedDate.getTime())) {
          dateObj = parsedDate;
        }
      }
    }
    
    if (isNaN(dateObj.getTime())) {
      throw new Error(`Invalid date format at row ${index + 1}: ${dateStr}. Please use DD/MM/YYYY or YYYY-MM-DD.`);
    }

    return { row, dateObj, dateStr };
  });

  // Sort chronologically
  parsedRows.sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());

  parsedRows.forEach(({ row, dateStr, dateObj }) => {
    for (let i = 1; i < columns.length; i++) {
      const name = columns[i];
      const valueStr = row[name];
      const cleanValue = typeof valueStr === 'string' ? valueStr.replace(/,/g, '') : valueStr;
      const value = parseFloat(cleanValue);
      if (!isNaN(value)) {
        data.push({ date: dateStr, name, value, timestamp: dateObj.getTime() });
      }
    }
  });

  return { data, config };
};

export const generateColors = (names: string[]): Record<string, string> => {
  const scale = d3.scaleOrdinal(d3.schemeTableau10).domain(names);
  const colors: Record<string, string> = {};
  names.forEach(name => {
    colors[name] = scale(name);
  });
  return colors;
};

export const getInterpolatedFrame = (dateGroups: any[], progress: number): DataPoint[] => {
  const floorIndex = Math.floor(progress);
  const ceilIndex = Math.min(floorIndex + 1, dateGroups.length - 1);
  
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
      interpolated.push({ ...start, value: start.value * (1 - t) });
    } else if (end) {
      interpolated.push({ ...end, value: end.value * t });
    }
  });

  return interpolated;
};
