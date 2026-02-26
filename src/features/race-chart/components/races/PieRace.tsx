import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { RaceProps } from './types';
import { formatNumber } from '../../../../shared/utils/formatters';
import { getInterpolatedFrame } from '../../../../core/dataProcessor';

export default function PieRace({ svgRef, config, isPlaying, currentTimeIndex, dimensions, dateGroups }: RaceProps) {
  const gRef = useRef<d3.Selection<SVGGElement, unknown, null, undefined> | null>(null);
  const pieStatesRef = useRef(new Map<string, { startAngle: number, endAngle: number, value: number, vStart: number, vEnd: number, vv: number }>());

  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    
    svg.selectAll('.race-layer').remove();

    const margin = { top: 80, right: 100, bottom: 40, left: 140 };
    const innerWidth = dimensions.width - margin.left - margin.right;
    const innerHeight = dimensions.height - margin.top - margin.bottom;
    
    const layer = svg.insert('g', '.overlay-layer')
      .attr('class', 'race-layer')
      .attr('transform', `translate(${margin.left + innerWidth / 2},${margin.top + innerHeight / 2})`);
      
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
    const radius = Math.min(innerWidth, innerHeight) / 2;

    const renderFrame = (index: number) => {
      const currentData = getInterpolatedFrame(dateGroups, index);
      const displayData = currentData
        .sort((a, b) => d3.descending(a.value, b.value))
        .slice(0, config.maxBars);

      const g = gRef.current!;

      const pie = d3.pie<any>().value(d => d.value).sort(null);
      const arc = d3.arc<any>().innerRadius(radius * 0.5).outerRadius(radius);
      const outerArc = d3.arc<any>().innerRadius(radius * 1.1).outerRadius(radius * 1.1);

      const pieData = pie(displayData);
      const pieStates = pieStatesRef.current;

      const slices = g.selectAll<SVGGElement, any>('.pie-group').data(pieData, d => d.data.name);
      
      const slicesEnter = slices.enter()
        .append('g')
        .attr('class', 'pie-group')
        .attr('style', 'will-change: transform;');

      slicesEnter.append('path')
        .attr('class', 'pie-path')
        .attr('fill', d => config.colors[d.data.name] || '#ccc')
        .attr('stroke', config.theme === 'dark' ? '#000' : '#fff')
        .attr('stroke-width', 2)
        .attr('style', 'filter: drop-shadow(0 4px 6px rgba(0,0,0,0.1));');

      slicesEnter.append('polyline')
        .attr('class', 'pie-line')
        .attr('stroke', config.theme === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)')
        .attr('stroke-width', 1)
        .attr('fill', 'none');

      slicesEnter.append('text')
        .attr('class', 'label')
        .attr('fill', config.theme === 'dark' ? '#ffffff' : '#09090b')
        .attr('font-family', config.fontFamily)
        .attr('font-weight', '700')
        .attr('font-size', '14px')
        .attr('dy', '0.35em');

      const slicesUpdate = slices.merge(slicesEnter);

      slicesUpdate.each(function(d: any) {
        const targetStart = d.startAngle;
        const targetEnd = d.endAngle;
        
        let state = pieStates.get(d.data.name);
        if (!state) {
          state = { startAngle: targetStart, endAngle: targetEnd, value: d.data.value, vStart: 0, vEnd: 0, vv: 0 };
          pieStates.set(d.data.name, state);
        }

        const stiffness = 0.15;
        const damping = 0.8;
        
        state.vStart = (state.vStart + (targetStart - state.startAngle) * stiffness) * damping;
        state.startAngle += state.vStart;
        
        state.vEnd = (state.vEnd + (targetEnd - state.endAngle) * stiffness) * damping;
        state.endAngle += state.vEnd;
        
        state.vv = (state.vv + (d.data.value - state.value) * stiffness) * damping;
        state.value += state.vv;

        const group = d3.select(this);
        
        const currentArcData = { ...d, startAngle: state.startAngle, endAngle: state.endAngle };
        
        group.select('.pie-path')
          .attr('d', arc(currentArcData) as string);

        const midAngle = state.startAngle + (state.endAngle - state.startAngle) / 2;
        const pos = outerArc.centroid(currentArcData);
        pos[0] = radius * 1.15 * (midAngle < Math.PI ? 1 : -1);

        group.select('.pie-line')
          .attr('points', `${arc.centroid(currentArcData)},${outerArc.centroid(currentArcData)},${pos}`);

        group.select('.label')
          .attr('transform', `translate(${pos})`)
          .style('text-anchor', midAngle < Math.PI ? 'start' : 'end')
          .text(`${d.data.name} (${formatNumber(state.value)})`);
      });

      slices.exit().remove();
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
