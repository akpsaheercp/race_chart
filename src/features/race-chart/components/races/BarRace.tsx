import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { RaceProps } from './types';
import { formatNumber } from '../../../../shared/utils/formatters';
import { getInterpolatedFrame } from '../../../../core/dataProcessor';

export default function BarRace({ svgRef, config, isPlaying, currentTimeIndex, dimensions, dateGroups }: RaceProps) {
  const gRef = useRef<d3.Selection<SVGGElement, unknown, null, undefined> | null>(null);
  const axisGRef = useRef<d3.Selection<SVGGElement, unknown, null, undefined> | null>(null);
  const barStatesRef = useRef(new Map<string, { pos: number, size: number, value: number, vPos: number, vSize: number, vv: number }>());

  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    
    // Clean up previous race type elements
    svg.selectAll('.race-layer').remove();

    const margin = { top: 80, right: 100, bottom: 80, left: 140 };
    
    const layer = svg.insert('g', '.overlay-layer')
      .attr('class', 'race-layer')
      .attr('transform', `translate(${margin.left},${margin.top})`);
      
    gRef.current = layer;
    axisGRef.current = layer.append('g').attr('class', 'axis');

    return () => {
      layer.remove();
    };
  }, [config.fontFamily]);

  useEffect(() => {
    if (!gRef.current || !axisGRef.current || dateGroups.length === 0) return;

    const margin = { top: 80, right: 100, bottom: 80, left: 140 };
    const innerWidth = dimensions.width - margin.left - margin.right;
    const innerHeight = dimensions.height - margin.top - margin.bottom;

    const isVertical = config.orientation === 'vertical';

    const renderFrame = (index: number) => {
      const currentData = getInterpolatedFrame(dateGroups, index);
      const displayData = currentData
        .sort((a, b) => d3.descending(a.value, b.value))
        .slice(0, config.maxBars);

      const g = gRef.current!;

      axisGRef.current!.style('display', null);
      
      const maxVal = d3.max(displayData, d => d.value) as number || 1;
      const names = displayData.map(d => d.name);

      let scaleValue: d3.ScaleLinear<number, number>;
      let scaleBand: d3.ScaleBand<string>;

      if (isVertical) {
        scaleValue = d3.scaleLinear().range([innerHeight, 0]).domain([0, maxVal]);
        scaleBand = d3.scaleBand().range([0, innerWidth]).padding(0.1).domain(names);

        axisGRef.current!.attr('transform', `translate(0, 0)`)
          .call(d3.axisLeft(scaleValue).ticks(innerHeight / 100).tickSize(-innerWidth))
          .call(g => g.select('.domain').remove())
          .call(g => g.selectAll('.tick line').attr('stroke', config.theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)').attr('stroke-dasharray', '4,4'))
          .call(g => g.selectAll('.tick text').attr('fill', config.theme === 'dark' ? '#a1a1aa' : '#71717a').attr('font-family', config.fontFamily).attr('font-weight', '500').attr('dx', '-0.5em'));
      } else {
        scaleValue = d3.scaleLinear().range([0, innerWidth]).domain([0, maxVal]);
        scaleBand = d3.scaleBand().range([0, innerHeight]).padding(0.1).domain(names);

        axisGRef.current!.attr('transform', `translate(0, 0)`)
          .call(d3.axisTop(scaleValue).ticks(innerWidth / 100).tickSize(-innerHeight))
          .call(g => g.select('.domain').remove())
          .call(g => g.selectAll('.tick line').attr('stroke', config.theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)').attr('stroke-dasharray', '4,4'))
          .call(g => g.selectAll('.tick text').attr('fill', config.theme === 'dark' ? '#a1a1aa' : '#71717a').attr('font-family', config.fontFamily).attr('font-weight', '500').attr('dy', '-0.5em'));
      }

      const barStates = barStatesRef.current;

      const bars = g.selectAll<SVGGElement, any>('.bar-group').data(displayData, d => d.name);
      
      const barsEnter = bars.enter()
        .append('g')
        .attr('class', 'bar-group')
        .attr('style', 'will-change: transform;')
        .attr('transform', d => {
           const targetPos = scaleBand(d.name) || 0;
           const targetSize = isVertical ? innerHeight - scaleValue(d.value) : scaleValue(d.value);
           barStates.set(d.name, { pos: targetPos, size: targetSize, value: d.value, vPos: 0, vSize: 0, vv: 0 });
           return isVertical ? `translate(${targetPos}, 0)` : `translate(0, ${targetPos})`;
        });

      barsEnter.append('rect')
        .attr('class', 'bar-rect')
        .attr('rx', 6)
        .attr('fill', d => config.colors[d.name] || '#ccc')
        .attr('style', 'filter: drop-shadow(0 4px 6px rgba(0,0,0,0.1));');

      barsEnter.append('text')
        .attr('class', 'label')
        .attr('fill', config.theme === 'dark' ? '#ffffff' : '#09090b')
        .attr('font-family', config.fontFamily)
        .attr('font-weight', '700')
        .attr('letter-spacing', '-0.01em');

      barsEnter.append('text')
        .attr('class', 'value')
        .attr('fill', config.theme === 'dark' ? '#ffffff' : '#09090b')
        .attr('font-family', config.fontFamily)
        .attr('font-weight', '800')
        .attr('letter-spacing', '-0.02em')
        .text(d => formatNumber(d.value));

      const barsUpdate = bars.merge(barsEnter);

      barsUpdate.each(function(d) {
        const targetPos = scaleBand(d.name) || 0;
        const targetSize = isVertical ? innerHeight - scaleValue(d.value) : scaleValue(d.value);
        
        let state = barStates.get(d.name);
        if (!state) {
          state = { pos: targetPos, size: targetSize, value: d.value, vPos: 0, vSize: 0, vv: 0 };
          barStates.set(d.name, state);
        }

        const stiffness = 0.15;
        const damping = 0.8;
        
        state.vPos = (state.vPos + (targetPos - state.pos) * stiffness) * damping;
        state.pos += state.vPos;
        
        state.vSize = (state.vSize + (targetSize - state.size) * stiffness) * damping;
        state.size += state.vSize;
        
        state.vv = (state.vv + (d.value - state.value) * stiffness) * damping;
        state.value += state.vv;

        const group = d3.select(this);
        
        group.attr('transform', isVertical ? `translate(${state.pos}, 0)` : `translate(0, ${state.pos})`);
        
        const isOvertaking = Math.abs(targetPos - state.pos) > 2;
        
        if (isOvertaking) {
          this.parentNode?.appendChild(this);
        }

        const rect = group.select('.bar-rect')
          .attr('filter', isOvertaking ? 'url(#motionBlur)' : null)
          .attr('stroke', isOvertaking ? (config.theme === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)') : 'none')
          .attr('stroke-width', isOvertaking ? 2 : 0);

        const label = group.select('.label')
          .attr('fill', config.theme === 'dark' ? '#ffffff' : '#000000');

        const valueText = group.select('.value')
          .attr('fill', config.theme === 'dark' ? '#ffffff' : '#000000')
          .text(formatNumber(state.value));

        if (isVertical) {
          rect
            .attr('width', scaleBand.bandwidth())
            .attr('height', state.size)
            .attr('y', innerHeight - state.size);

          label
            .attr('text-anchor', 'middle')
            .attr('x', scaleBand.bandwidth() / 2)
            .attr('y', innerHeight + 20)
            .attr('dy', '0.35em')
            .text(d.name);

          valueText
            .attr('text-anchor', 'middle')
            .attr('x', scaleBand.bandwidth() / 2)
            .attr('y', innerHeight - state.size - 10)
            .attr('dy', '0');
        } else {
          rect
            .attr('width', state.size)
            .attr('height', scaleBand.bandwidth())
            .attr('y', 0);

          label
            .attr('text-anchor', 'end')
            .attr('x', -16)
            .attr('y', scaleBand.bandwidth() / 2)
            .attr('dy', '0.35em')
            .text(d.name);

          valueText
            .attr('text-anchor', 'start')
            .attr('x', state.size + 16)
            .attr('y', scaleBand.bandwidth() / 2)
            .attr('dy', '0.35em');
        }
      });

      bars.exit().remove();
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
