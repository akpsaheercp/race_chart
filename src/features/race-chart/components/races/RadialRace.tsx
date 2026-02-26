import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { RaceProps } from './types';
import { formatNumber } from '../../../../shared/utils/formatters';
import { getInterpolatedFrame } from '../../../../core/dataProcessor';

export default function RadialRace({ svgRef, config, isPlaying, currentTimeIndex, dimensions, dateGroups }: RaceProps) {
  const gRef = useRef<d3.Selection<SVGGElement, unknown, null, undefined> | null>(null);
  const arcStatesRef = useRef(new Map<string, { startAngle: number, endAngle: number, innerRadius: number, outerRadius: number, value: number, vStart: number, vEnd: number, vInner: number, vOuter: number, vv: number }>());

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
      const innerRadius = radius * 0.3;
      const outerRadiusScale = d3.scaleLinear().domain([0, maxVal]).range([innerRadius, radius * 0.9]);

      const arcStates = arcStatesRef.current;

      const arcs = g.selectAll<SVGGElement, any>('.radial-arc')
        .data(displayData, (d: any) => d.name);
      
      const arcsEnter = arcs.enter()
        .append('g')
        .attr('class', 'radial-arc');

      const arcGenerator = d3.arc()
        .innerRadius((d: any) => d.innerRadius)
        .outerRadius((d: any) => d.outerRadius)
        .startAngle((d: any) => d.startAngle)
        .endAngle((d: any) => d.endAngle)
        .padAngle(0.02)
        .cornerRadius(4);

      arcsEnter.append('path')
        .attr('class', 'arc-path')
        .attr('fill', (d: any) => config.colors[d.name] || '#ccc')
        .attr('stroke', config.theme === 'dark' ? '#000' : '#fff')
        .attr('stroke-width', 1);

      arcsEnter.append('text')
        .attr('class', 'label')
        .attr('fill', config.theme === 'dark' ? '#fff' : '#000')
        .attr('font-family', config.fontFamily)
        .attr('font-weight', '600')
        .attr('font-size', '12px')
        .attr('text-anchor', 'middle')
        .attr('dy', '0.35em');

      const arcsUpdate = arcs.merge(arcsEnter);

      const stiffness = config.stiffness || 0.15;
      const damping = config.damping || 0.8;
      
      const angleScale = d3.scaleBand()
        .domain(displayData.map(d => d.name))
        .range([0, 2 * Math.PI]);

      arcsUpdate.each(function(d: any, i) {
        const targetStartAngle = angleScale(d.name) || 0;
        const targetEndAngle = targetStartAngle + angleScale.bandwidth();
        const targetOuterRadius = outerRadiusScale(d.value);
        
        let state = arcStates.get(d.name);
        if (!state) {
          state = { startAngle: targetStartAngle, endAngle: targetEndAngle, innerRadius: innerRadius, outerRadius: innerRadius, value: 0, vStart: 0, vEnd: 0, vInner: 0, vOuter: 0, vv: 0 };
          arcStates.set(d.name, state);
        }
        
        state.vStart = (state.vStart + (targetStartAngle - state.startAngle) * stiffness) * damping;
        state.startAngle += state.vStart;
        
        state.vEnd = (state.vEnd + (targetEndAngle - state.endAngle) * stiffness) * damping;
        state.endAngle += state.vEnd;
        
        state.vOuter = (state.vOuter + (targetOuterRadius - state.outerRadius) * stiffness) * damping;
        state.outerRadius += state.vOuter;
        
        state.vv = (state.vv + (d.value - state.value) * stiffness) * damping;
        state.value += state.vv;

        const group = d3.select(this);
        
        group.select('.arc-path')
          .attr('d', arcGenerator(state as any));
          
        const midAngle = (state.startAngle + state.endAngle) / 2;
        const labelRadius = state.outerRadius + 20;
        
        const labelX = Math.sin(midAngle) * labelRadius;
        const labelY = -Math.cos(midAngle) * labelRadius;
        
        let rotation = (midAngle * 180 / Math.PI) - 90;
        if (rotation > 90 || rotation < -90) {
            rotation += 180;
        }

        const vVal = state.vv;
        let arrow = '';
        let arrowColor = '';
        if (Math.abs(vVal) > 0.1) {
            arrow = vVal > 0 ? ' ▲' : ' ▼';
            arrowColor = vVal > 0 ? '#10b981' : '#ef4444';
        }

        group.select('.label')
          .attr('transform', `translate(${labelX}, ${labelY}) rotate(${rotation})`)
          .html(`${d.name} (${formatNumber(state.value)})<tspan fill="${arrowColor}" font-size="0.8em">${arrow}</tspan>`);
      });

      arcs.exit().remove();
      
      // Center text
      let centerGroup = g.select('.center-group');
      if (centerGroup.empty()) {
          centerGroup = g.append('g').attr('class', 'center-group');
          centerGroup.append('text')
            .attr('class', 'center-rank')
            .attr('text-anchor', 'middle')
            .attr('font-family', config.fontFamily)
            .attr('font-weight', '800')
            .attr('font-size', '24px')
            .attr('fill', config.theme === 'dark' ? '#fff' : '#000')
            .attr('dy', '-0.5em');
            
          centerGroup.append('text')
            .attr('class', 'center-value')
            .attr('text-anchor', 'middle')
            .attr('font-family', config.fontFamily)
            .attr('font-weight', '600')
            .attr('font-size', '16px')
            .attr('fill', config.theme === 'dark' ? '#aaa' : '#666')
            .attr('dy', '1em');
      }
      
      if (displayData.length > 0) {
          centerGroup.select('.center-rank').text(displayData[0].name);
          centerGroup.select('.center-value').text(formatNumber(displayData[0].value));
      }
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
