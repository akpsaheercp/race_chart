import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { RaceProps } from './types';
import { formatNumber } from '../../../../shared/utils/formatters';
import { getInterpolatedFrame } from '../../../../core/dataProcessor';

export default function NetworkRace({ svgRef, config, isPlaying, currentTimeIndex, dimensions, dateGroups }: RaceProps) {
  const gRef = useRef<d3.Selection<SVGGElement, unknown, null, undefined> | null>(null);
  const simulationRef = useRef<d3.Simulation<any, undefined> | null>(null);
  const networkStatesRef = useRef(new Map<string, { r: number, value: number, vr: number, vv: number }>());

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
      if (simulationRef.current) {
          simulationRef.current.stop();
      }
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

      const maxVal = d3.max(displayData, d => d.value) || 1;
      const rScale = d3.scaleSqrt().domain([0, maxVal]).range([5, 50]);

      if (!simulationRef.current) {
          simulationRef.current = d3.forceSimulation(displayData as any)
            .force('charge', d3.forceManyBody().strength((d: any) => -rScale(d.value) * 2))
            .force('center', d3.forceCenter(innerWidth / 2, innerHeight / 2))
            .force('collide', d3.forceCollide((d: any) => rScale(d.value) + 2).iterations(2))
            .on('tick', () => {
                g.selectAll('.network-node')
                 .attr('transform', (d: any) => `translate(${d.x}, ${d.y})`);
            });
      } else {
          simulationRef.current.nodes(displayData as any);
          simulationRef.current.force('collide', d3.forceCollide((d: any) => rScale(d.value) + 2).iterations(2));
          simulationRef.current.force('charge', d3.forceManyBody().strength((d: any) => -rScale(d.value) * 2));
          simulationRef.current.alpha(0.3).restart();
      }

      const nodes = g.selectAll<SVGGElement, any>('.network-node')
        .data(displayData, (d: any) => d.name);
      
      const nodesEnter = nodes.enter()
        .append('g')
        .attr('class', 'network-node');

      nodesEnter.append('circle')
        .attr('class', 'node-circle')
        .attr('fill', (d: any) => config.colors[d.name] || '#ccc')
        .attr('stroke', config.theme === 'dark' ? '#000' : '#fff')
        .attr('stroke-width', 1)
        .attr('r', (d: any) => rScale(d.value));

      nodesEnter.append('text')
        .attr('class', 'label')
        .attr('fill', config.theme === 'dark' ? '#fff' : '#000')
        .attr('font-family', config.fontFamily)
        .attr('font-weight', '600')
        .attr('font-size', '12px')
        .attr('text-anchor', 'middle')
        .attr('dy', '0.35em')
        .text((d: any) => d.name);

      const nodesUpdate = nodes.merge(nodesEnter);

      const networkStates = networkStatesRef.current;
      const stiffness = config.stiffness || 0.15;
      const damping = config.damping || 0.8;

      nodesUpdate.each(function(d: any) {
        const targetR = rScale(d.value);

        let state = networkStates.get(d.name);
        if (!state) {
          state = { r: 0, value: 0, vr: 0, vv: 0 };
          networkStates.set(d.name, state);
        }

        state.vr = (state.vr + (targetR - state.r) * stiffness) * damping;
        state.r += state.vr;

        state.vv = (state.vv + (d.value - state.value) * stiffness) * damping;
        state.value += state.vv;

        const group = d3.select(this);
        
        group.select('.node-circle')
          .attr('r', state.r);
          
        const vVal = state.vv;
        let arrow = '';
        let arrowColor = '';
        if (Math.abs(vVal) > 0.1) {
            arrow = vVal > 0 ? ' ▲' : ' ▼';
            arrowColor = vVal > 0 ? '#10b981' : '#ef4444';
        }

        group.select('.label')
          .html(`${d.name} (${formatNumber(state.value)})<tspan fill="${arrowColor}" font-size="0.8em">${arrow}</tspan>`);
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
