import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { RaceProps } from './types';
import { formatNumber } from '../../../../shared/utils/formatters';
import { getInterpolatedFrame } from '../../../../core/dataProcessor';

export default function TreemapRace({ svgRef, config, isPlaying, currentTimeIndex, dimensions, dateGroups }: RaceProps) {
  const gRef = useRef<d3.Selection<SVGGElement, unknown, null, undefined> | null>(null);
  const rectStatesRef = useRef(new Map<string, { x0: number, y0: number, x1: number, y1: number, value: number, vx0: number, vy0: number, vx1: number, vy1: number, vv: number }>());

  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    
    svg.selectAll('.race-layer').remove();

    const margin = { top: 80, right: 20, bottom: 20, left: 20 };
    
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

    const margin = { top: 80, right: 20, bottom: 20, left: 20 };
    const innerWidth = dimensions.width - margin.left - margin.right;
    const innerHeight = dimensions.height - margin.top - margin.bottom;

    const renderFrame = (index: number) => {
      const currentData = getInterpolatedFrame(dateGroups, index);
      const displayData = currentData
        .sort((a, b) => d3.descending(a.value, b.value))
        .slice(0, config.maxBars);

      const g = gRef.current!;

      // Create hierarchy for treemap
      const root = d3.hierarchy({ name: 'root', children: displayData })
        .sum((d: any) => d.value)
        .sort((a, b) => (b.value || 0) - (a.value || 0));

      d3.treemap()
        .size([innerWidth, innerHeight])
        .padding(2)
        .round(false)(root);

      const rectStates = rectStatesRef.current;

      const nodes = g.selectAll<SVGGElement, any>('.treemap-node')
        .data(root.leaves(), (d: any) => d.data.name);
      
      const nodesEnter = nodes.enter()
        .append('g')
        .attr('class', 'treemap-node')
        .attr('transform', (d: any) => {
           const targetX0 = d.x0;
           const targetY0 = d.y0;
           const targetX1 = d.x1;
           const targetY1 = d.y1;
           const cx = targetX0 + (targetX1 - targetX0) / 2;
           const cy = targetY0 + (targetY1 - targetY0) / 2;
           rectStates.set(d.data.name, { x0: cx, y0: cy, x1: cx, y1: cy, value: 0, vx0: 0, vy0: 0, vx1: 0, vy1: 0, vv: 0 });
           return `translate(${cx}, ${cy})`;
        });

      nodesEnter.append('rect')
        .attr('class', 'treemap-rect')
        .attr('fill', (d: any) => config.colors[d.data.name] || '#ccc')
        .attr('stroke', config.theme === 'dark' ? '#000' : '#fff')
        .attr('stroke-width', 1)
        .attr('width', (d: any) => d.x1 - d.x0)
        .attr('height', (d: any) => d.y1 - d.y0)
        .attr('rx', 4);

      nodesEnter.append('text')
        .attr('class', 'label')
        .attr('fill', '#fff')
        .attr('font-family', config.fontFamily)
        .attr('font-weight', '700')
        .attr('font-size', '14px')
        .attr('dx', 4)
        .attr('dy', 16)
        .text((d: any) => d.data.name);

      nodesEnter.append('text')
        .attr('class', 'value')
        .attr('fill', 'rgba(255,255,255,0.8)')
        .attr('font-family', config.fontFamily)
        .attr('font-weight', '600')
        .attr('font-size', '12px')
        .attr('dx', 4)
        .attr('dy', 32)
        .text((d: any) => formatNumber(d.data.value));

      const nodesUpdate = nodes.merge(nodesEnter);

      const stiffness = config.stiffness || 0.15;
      const damping = config.damping || 0.8;

      nodesUpdate.each(function(d: any, i) {
        const targetX0 = d.x0;
        const targetY0 = d.y0;
        const targetX1 = d.x1;
        const targetY1 = d.y1;
        
        let state = rectStates.get(d.data.name);
        if (!state) {
          state = { x0: targetX0, y0: targetY0, x1: targetX1, y1: targetY1, value: d.data.value, vx0: 0, vy0: 0, vx1: 0, vy1: 0, vv: 0 };
          rectStates.set(d.data.name, state);
        }
        
        state.vx0 = (state.vx0 + (targetX0 - state.x0) * stiffness) * damping;
        state.x0 += state.vx0;
        
        state.vy0 = (state.vy0 + (targetY0 - state.y0) * stiffness) * damping;
        state.y0 += state.vy0;
        
        state.vx1 = (state.vx1 + (targetX1 - state.x1) * stiffness) * damping;
        state.x1 += state.vx1;
        
        state.vy1 = (state.vy1 + (targetY1 - state.y1) * stiffness) * damping;
        state.y1 += state.vy1;
        
        state.vv = (state.vv + (d.data.value - state.value) * stiffness) * damping;
        state.value += state.vv;

        const group = d3.select(this);
        
        group.attr('transform', `translate(${state.x0}, ${state.y0})`);
        
        const w = Math.max(0, state.x1 - state.x0);
        const h = Math.max(0, state.y1 - state.y0);
        
        const rect = group.select('.treemap-rect')
          .attr('width', w)
          .attr('height', h);
          
        // Golden glow for rank 1
        if (i === 0) {
            rect.attr('stroke', '#FFD700').attr('stroke-width', 3);
        } else {
            rect.attr('stroke', config.theme === 'dark' ? '#000' : '#fff').attr('stroke-width', 1);
        }

        const showText = w > 50 && h > 40;

        group.select('.label')
          .attr('opacity', showText ? 1 : 0);

        const vVal = state.vv;
        let arrow = '';
        let arrowColor = '';
        if (Math.abs(vVal) > 0.1) {
            arrow = vVal > 0 ? ' ▲' : ' ▼';
            arrowColor = vVal > 0 ? '#10b981' : '#ef4444';
        }

        group.select('.value')
          .attr('opacity', showText ? 1 : 0)
          .html(`${formatNumber(state.value)}<tspan fill="${arrowColor}" font-size="0.8em">${arrow}</tspan>`);
      });

      nodes.exit().remove();
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
