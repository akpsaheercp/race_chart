import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { RaceProps } from './types';
import { formatNumber } from '../../../../shared/utils/formatters';
import { getInterpolatedFrame } from '../../../../core/dataProcessor';

export default function SpiralRace({ svgRef, config, isPlaying, currentTimeIndex, dimensions, dateGroups }: RaceProps) {
  const gRef = useRef<d3.Selection<SVGGElement, unknown, null, undefined> | null>(null);
  const spiralStatesRef = useRef(new Map<string, { x: number, y: number, r: number, value: number, vx: number, vy: number, vr: number, vv: number }>());

  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    
    svg.selectAll('.race-layer').remove();

    const margin = { top: 80, right: 20, bottom: 20, left: 20 };
    
    const layer = svg.insert('g', '.overlay-layer')
      .attr('class', 'race-layer')
      .attr('transform', `translate(${dimensions.width / 2},${dimensions.height / 2})`)
      .style('opacity', 0);
      
    layer.transition().duration(300).style('opacity', 1);
      
    gRef.current = layer;

    return () => {
      layer.transition().duration(300).style('opacity', 0).remove();
    };
  }, [config.fontFamily, dimensions]);

  useEffect(() => {
    if (!gRef.current || dateGroups.length === 0) return;

    const margin = { top: 80, right: 20, bottom: 20, left: 20 };
    const innerWidth = dimensions.width - margin.left - margin.right;
    const innerHeight = dimensions.height - margin.top - margin.bottom;
    const radius = Math.min(innerWidth, innerHeight) / 2;

    const renderFrame = (index: number) => {
      const currentData = getInterpolatedFrame(dateGroups, index);
      const displayData = currentData
        .sort((a, b) => d3.descending(a.value, b.value))
        .slice(0, config.maxBars);

      const g = gRef.current!;

      const maxVal = d3.max(displayData, d => d.value) || 1;
      const rScale = d3.scaleLinear().domain([0, maxVal]).range([5, 40]);

      const segments = g.selectAll<SVGGElement, any>('.spiral-segment')
        .data(displayData, (d: any) => d.name);
      
      const segmentsEnter = segments.enter()
        .append('g')
        .attr('class', 'spiral-segment');

      segmentsEnter.append('circle')
        .attr('class', 'segment-circle')
        .attr('fill', (d: any) => config.colors[d.name] || '#ccc')
        .attr('stroke', config.theme === 'dark' ? '#000' : '#fff')
        .attr('stroke-width', 1)
        .attr('r', (d: any) => rScale(d.value));

      segmentsEnter.append('text')
        .attr('class', 'label')
        .attr('fill', config.theme === 'dark' ? '#fff' : '#000')
        .attr('font-family', config.fontFamily)
        .attr('font-weight', '600')
        .attr('font-size', '12px')
        .attr('dx', (d: any) => rScale(d.value) + 4)
        .attr('dy', '0.35em')
        .text((d: any) => d.name);

      const segmentsUpdate = segments.merge(segmentsEnter);

      const angleScale = d3.scaleLinear()
        .domain([0, config.maxBars])
        .range([0, 2 * Math.PI * 3]); // 3 spirals

      const radiusScale = d3.scaleLinear()
        .domain([0, config.maxBars])
        .range([0, radius * 0.9]);

      const spiralStates = spiralStatesRef.current;
      const stiffness = config.stiffness || 0.15;
      const damping = config.damping || 0.8;

      segmentsUpdate.each(function(d: any, i) {
        const angle = angleScale(i);
        const r = radiusScale(i);
        const targetX = Math.cos(angle) * r;
        const targetY = Math.sin(angle) * r;
        const targetR = rScale(d.value);

        let state = spiralStates.get(d.name);
        if (!state) {
          state = { x: targetX, y: targetY, r: 0, value: 0, vx: 0, vy: 0, vr: 0, vv: 0 };
          spiralStates.set(d.name, state);
        }

        state.vx = (state.vx + (targetX - state.x) * stiffness) * damping;
        state.x += state.vx;

        state.vy = (state.vy + (targetY - state.y) * stiffness) * damping;
        state.y += state.vy;

        state.vr = (state.vr + (targetR - state.r) * stiffness) * damping;
        state.r += state.vr;

        state.vv = (state.vv + (d.value - state.value) * stiffness) * damping;
        state.value += state.vv;

        const group = d3.select(this);
        
        group.attr('transform', `translate(${state.x}, ${state.y})`);
        
        group.select('.segment-circle')
          .attr('r', state.r);
          
        const vVal = state.vv;
        let arrow = '';
        let arrowColor = '';
        if (Math.abs(vVal) > 0.1) {
            arrow = vVal > 0 ? ' ▲' : ' ▼';
            arrowColor = vVal > 0 ? '#10b981' : '#ef4444';
        }

        group.select('.label')
          .attr('dx', state.r + 4)
          .html(`${d.name} (${formatNumber(state.value)})<tspan fill="${arrowColor}" font-size="0.8em">${arrow}</tspan>`);
      });

      segments.exit().remove();
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
