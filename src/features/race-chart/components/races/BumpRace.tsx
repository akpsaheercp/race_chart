import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { RaceProps } from './types';
import { formatNumber } from '../../../../shared/utils/formatters';
import { getInterpolatedFrame } from '../../../../core/dataProcessor';

export default function BumpRace({ svgRef, config, isPlaying, currentTimeIndex, dimensions, dateGroups }: RaceProps) {
  const gRef = useRef<d3.Selection<SVGGElement, unknown, null, undefined> | null>(null);
  const lineStatesRef = useRef(new Map<string, { points: [number, number][], value: number, vv: number }>());

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

      const yScale = d3.scaleLinear()
        .domain([1, config.maxBars])
        .range([0, innerHeight]);

      const lineStates = lineStatesRef.current;

      const lines = g.selectAll<SVGGElement, any>('.bump-line')
        .data(displayData, (d: any) => d.name);
      
      const linesEnter = lines.enter()
        .append('g')
        .attr('class', 'bump-line');

      const lineGenerator = d3.line<[number, number]>()
        .x(d => d[0])
        .y(d => d[1])
        .curve(d3.curveMonotoneX);

      linesEnter.append('path')
        .attr('class', 'line-path')
        .attr('fill', 'none')
        .attr('stroke', (d: any) => config.colors[d.name] || '#ccc')
        .attr('stroke-width', 2);

      linesEnter.append('circle')
        .attr('class', 'line-dot')
        .attr('r', 4)
        .attr('fill', (d: any) => config.colors[d.name] || '#ccc');

      linesEnter.append('text')
        .attr('class', 'label')
        .attr('fill', config.theme === 'dark' ? '#fff' : '#000')
        .attr('font-family', config.fontFamily)
        .attr('font-weight', '600')
        .attr('font-size', '12px')
        .attr('dx', 8)
        .attr('dy', '0.35em');

      const linesUpdate = lines.merge(linesEnter);

      const stiffness = config.stiffness || 0.15;
      const damping = config.damping || 0.8;

      linesUpdate.each(function(d: any, i) {
        const targetX = xScale(index);
        const targetY = yScale(i + 1);
        
        let state = lineStates.get(d.name);
        if (!state) {
          state = { points: [[targetX, targetY]], value: 0, vv: 0 };
          lineStates.set(d.name, state);
        }
        
        // Add current point to history
        state.points.push([targetX, targetY]);
        
        // Limit history to current index
        const currentPoints = state.points.filter(p => p[0] <= targetX);
        
        state.vv = (state.vv + (d.value - state.value) * stiffness) * damping;
        state.value += state.vv;

        const group = d3.select(this);
        
        group.select('.line-path')
          .attr('d', lineGenerator(currentPoints));
          
        group.select('.line-dot')
          .attr('cx', targetX)
          .attr('cy', targetY);

        const vVal = state.vv;
        let arrow = '';
        let arrowColor = '';
        if (Math.abs(vVal) > 0.1) {
            arrow = vVal > 0 ? ' ▲' : ' ▼';
            arrowColor = vVal > 0 ? '#10b981' : '#ef4444';
        }

        group.select('.label')
          .attr('x', targetX)
          .attr('y', targetY)
          .html(`${d.name} (${formatNumber(state.value)})<tspan fill="${arrowColor}" font-size="0.8em">${arrow}</tspan>`);
      });

      lines.exit().remove();
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
