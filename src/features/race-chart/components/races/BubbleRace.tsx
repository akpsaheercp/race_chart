import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { RaceProps } from './types';
import { formatNumber } from '../../../../shared/utils/formatters';
import { getInterpolatedFrame } from '../../../../core/dataProcessor';

export default function BubbleRace({ svgRef, config, isPlaying, currentTimeIndex, dimensions, dateGroups }: RaceProps) {
  const gRef = useRef<d3.Selection<SVGGElement, unknown, null, undefined> | null>(null);
  const bubbleStatesRef = useRef(new Map<string, { x: number, y: number, r: number, value: number, vx: number, vy: number, vr: number, vv: number }>());

  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    
    svg.selectAll('.race-layer').remove();

    const margin = { top: 80, right: 100, bottom: 40, left: 140 };
    
    const layer = svg.insert('g', '.overlay-layer')
      .attr('class', 'race-layer')
      .attr('transform', `translate(${margin.left},${margin.top})`);
      
    gRef.current = layer;

    return () => {
      layer.remove();
    };
  }, [config.fontFamily, dimensions]);

  useEffect(() => {
    if (!gRef.current || dateGroups.length === 0) return;

    const margin = { top: 80, right: 100, bottom: 40, left: 140 };
    const innerWidth = dimensions.width - margin.left - margin.right;
    const innerHeight = dimensions.height - margin.top - margin.bottom;

    const renderFrame = (index: number) => {
      const currentData = getInterpolatedFrame(dateGroups, index);
      const displayData = currentData
        .sort((a, b) => d3.descending(a.value, b.value))
        .slice(0, config.maxBars);

      const g = gRef.current!;

      const maxVal = d3.max(displayData, d => d.value) || 1;
      const rScale = d3.scaleSqrt().domain([0, maxVal]).range([10, Math.min(innerWidth, innerHeight) / 4]);

      // Simple force simulation for bubbles
      const simulation = d3.forceSimulation(displayData as any)
        .force('x', d3.forceX(innerWidth / 2).strength(0.05))
        .force('y', d3.forceY(innerHeight / 2).strength(0.05))
        .force('collide', d3.forceCollide((d: any) => rScale(d.value) + 2).iterations(2))
        .stop();

      // Run simulation for a few ticks to settle
      for (let i = 0; i < 10; ++i) simulation.tick();

      const bubbleStates = bubbleStatesRef.current;

      const bubbles = g.selectAll<SVGGElement, any>('.bubble-group').data(displayData, d => d.name);
      
      const bubblesEnter = bubbles.enter()
        .append('g')
        .attr('class', 'bubble-group')
        .attr('style', 'will-change: transform;')
        .attr('transform', (d: any) => {
           const targetX = d.x || innerWidth / 2;
           const targetY = d.y || innerHeight / 2;
           const targetR = rScale(d.value);
           bubbleStates.set(d.name, { x: targetX, y: targetY, r: targetR, value: d.value, vx: 0, vy: 0, vr: 0, vv: 0 });
           return `translate(${targetX}, ${targetY})`;
        });

      bubblesEnter.append('circle')
        .attr('class', 'bubble-circle')
        .attr('fill', d => config.colors[d.name] || '#ccc')
        .attr('r', d => rScale(d.value))
        .attr('opacity', 0.8)
        .attr('stroke', config.theme === 'dark' ? '#000' : '#fff')
        .attr('stroke-width', 2)
        .attr('style', 'filter: drop-shadow(0 4px 6px rgba(0,0,0,0.1));');

      bubblesEnter.append('text')
        .attr('class', 'label')
        .attr('text-anchor', 'middle')
        .attr('fill', config.theme === 'dark' ? '#ffffff' : '#09090b')
        .attr('font-family', config.fontFamily)
        .attr('font-weight', '700')
        .attr('font-size', '14px')
        .attr('dy', '-0.5em')
        .text(d => d.name);

      bubblesEnter.append('text')
        .attr('class', 'value')
        .attr('text-anchor', 'middle')
        .attr('fill', config.theme === 'dark' ? '#a1a1aa' : '#71717a')
        .attr('font-family', config.fontFamily)
        .attr('font-weight', '600')
        .attr('font-size', '12px')
        .attr('dy', '1em')
        .text(d => formatNumber(d.value));

      const bubblesUpdate = bubbles.merge(bubblesEnter);

      bubblesUpdate.each(function(d: any) {
        const targetX = d.x || innerWidth / 2;
        const targetY = d.y || innerHeight / 2;
        const targetR = rScale(d.value);
        
        let state = bubbleStates.get(d.name);
        if (!state) {
          state = { x: targetX, y: targetY, r: targetR, value: d.value, vx: 0, vy: 0, vr: 0, vv: 0 };
          bubbleStates.set(d.name, state);
        }

        const stiffness = 0.15;
        const damping = 0.8;
        
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
        
        group.select('.bubble-circle')
          .attr('r', state.r);

        group.select('.label')
          .attr('fill', config.theme === 'dark' ? '#ffffff' : '#000000');

        group.select('.value')
          .text(formatNumber(state.value));
      });

      bubbles.exit().remove();
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
