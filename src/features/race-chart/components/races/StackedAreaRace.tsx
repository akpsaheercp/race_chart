import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { RaceProps } from './types';
import { formatNumber } from '../../../../shared/utils/formatters';
import { getInterpolatedFrame } from '../../../../core/dataProcessor';

export default function StackedAreaRace({ svgRef, config, isPlaying, currentTimeIndex, dimensions, dateGroups }: RaceProps) {
  const gRef = useRef<d3.Selection<SVGGElement, unknown, null, undefined> | null>(null);

  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    
    svg.selectAll('.race-layer').remove();

    const margin = { top: 80, right: 100, bottom: 40, left: 60 };
    
    const layer = svg.insert('g', '.overlay-layer')
      .attr('class', 'race-layer')
      .attr('transform', `translate(${margin.left},${margin.top})`)
      .style('opacity', 0);
      
    layer.transition().duration(300).style('opacity', 1);
      
    gRef.current = layer;

    return () => {
      layer.transition().duration(300).style('opacity', 0).remove();
    };
  }, [config.fontFamily, dimensions]);

  useEffect(() => {
    if (!gRef.current || dateGroups.length === 0) return;

    const margin = { top: 80, right: 100, bottom: 40, left: 60 };
    const innerWidth = dimensions.width - margin.left - margin.right;
    const innerHeight = dimensions.height - margin.top - margin.bottom;

    const renderFrame = (index: number) => {
      const currentData = getInterpolatedFrame(dateGroups, index);
      const displayData = currentData
        .sort((a, b) => d3.descending(a.value, b.value))
        .slice(0, config.maxBars);

      const g = gRef.current!;

      const xScale = d3.scaleLinear()
        .domain([0, dateGroups.length - 1])
        .range([0, innerWidth]);

      const maxTotal = d3.max(dateGroups, group => d3.sum(group.values, d => d.value)) || 1;
      const yScale = d3.scaleLinear()
        .domain([0, maxTotal])
        .range([innerHeight, 0]);

      // Stack data
      const stack = d3.stack()
        .keys(displayData.map(d => d.name))
        .value((d: any, key) => d.find((v: any) => v.name === key)?.value || 0);

      // We need history for area chart
      const historyData = dateGroups.slice(0, Math.floor(index) + 1).map(g => g.values);
      if (index % 1 !== 0) {
          historyData.push(currentData);
      }
      
      const stackedData = stack(historyData as any);

      const areaGenerator = d3.area<any>()
        .x((d, i) => xScale(i))
        .y0(d => yScale(d[0]))
        .y1(d => yScale(d[1]))
        .curve(d3.curveMonotoneX);

      const areas = g.selectAll<SVGGElement, any>('.area-path')
        .data(stackedData, (d: any) => d.key);
      
      const areasEnter = areas.enter()
        .append('path')
        .attr('class', 'area-path')
        .attr('fill', (d: any) => config.colors[d.key] || '#ccc')
        .attr('opacity', 0.7);

      const areasUpdate = areas.merge(areasEnter);

      areasUpdate.attr('d', areaGenerator);

      areas.exit().remove();
    };

    const handleTimeUpdate = (e: Event) => {
      const index = (e as CustomEvent).detail;
      renderFrame(index);
    };

    window.addEventListener('time-update', handleTimeUpdate);
    renderFrame(currentTimeIndex);

    return () => {
      window.removeEventListener('time-update', handleTimeUpdate);
    };
  }, [dimensions, dateGroups, config]);

  return null;
}
