import React, { useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';
import { RaceProps } from './types';
import { formatNumber } from '../../../../shared/utils/formatters';
import { getInterpolatedFrame } from '../../../../core/dataProcessor';
import { DataPoint } from '../../../../types';

export default function StackedBarRace({ svgRef, config, isPlaying, currentTimeIndex, dimensions, dateGroups }: RaceProps) {
  const gRef = useRef<d3.Selection<SVGGElement, unknown, null, undefined> | null>(null);
  const axisGRef = useRef<d3.Selection<SVGGElement, unknown, null, undefined> | null>(null);
  const barStatesRef = useRef(new Map<string, { pos: number, size1: number, size2: number, value1: number, value2: number, vPos: number, vSize1: number, vSize2: number, vv1: number, vv2: number }>());

  const secondaryDateGroups = useMemo(() => {
    if (!config.secondaryData || config.secondaryData.length === 0) return [];
    const groups = d3.group(config.secondaryData, d => d.date);
    const dates = Array.from(groups.keys()).sort((a, b) => {
      const valA = groups.get(a)?.[0]?.timestamp || 0;
      const valB = groups.get(b)?.[0]?.timestamp || 0;
      return valA - valB;
    });
    return dates.map(date => {
      const values = (groups.get(date) || []) as DataPoint[];
      return {
        date,
        values
      };
    });
  }, [config.secondaryData]);

  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    
    // Clean up previous race type elements
    svg.selectAll('.race-layer').remove();

    const isSmallScreen = dimensions.width < 600;
    const margin = isSmallScreen 
      ? { top: 60, right: 20, bottom: 40, left: 90 } 
      : { top: 80, right: 100, bottom: 80, left: 140 };
    
    const layer = svg.insert('g', '.overlay-layer')
      .attr('class', 'race-layer')
      .attr('transform', `translate(${margin.left},${margin.top})`);
      
    gRef.current = layer;
    axisGRef.current = layer.append('g').attr('class', 'axis');

    return () => {
      layer.remove();
    };
  }, [config.fontFamily, dimensions.width]);

  useEffect(() => {
    if (!gRef.current || !axisGRef.current || dateGroups.length === 0) return;

    const isSmallScreen = dimensions.width < 600;
    const margin = isSmallScreen 
      ? { top: 60, right: 20, bottom: 40, left: 90 } 
      : { top: 80, right: 100, bottom: 80, left: 140 };

    const innerWidth = dimensions.width - margin.left - margin.right;
    const innerHeight = dimensions.height - margin.top - margin.bottom;

    const isVertical = config.orientation === 'vertical';

    const renderFrame = (index: number) => {
      const currentData1 = getInterpolatedFrame(dateGroups, index);
      const currentData2 = secondaryDateGroups.length > 0 ? getInterpolatedFrame(secondaryDateGroups, index) : [];

      const combinedDataMap = new Map<string, { name: string, value1: number, value2: number, total: number }>();
      
      currentData1.forEach(d => {
        combinedDataMap.set(d.name, { name: d.name, value1: d.value, value2: 0, total: d.value });
      });

      currentData2.forEach(d => {
        if (combinedDataMap.has(d.name)) {
          const item = combinedDataMap.get(d.name)!;
          item.value2 = d.value;
          item.total = item.value1 + item.value2;
        } else {
          combinedDataMap.set(d.name, { name: d.name, value1: 0, value2: d.value, total: d.value });
        }
      });

      const combinedData = Array.from(combinedDataMap.values())
        .sort((a, b) => d3.descending(a.total, b.total))
        .slice(0, config.maxBars);

      const g = gRef.current!;

      axisGRef.current!.style('display', null);
      
      const maxVal = d3.max(combinedData, d => d.total) as number || 1;
      const names = combinedData.map(d => d.name);

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

      const bars = g.selectAll<SVGGElement, any>('.bar-group').data(combinedData, d => d.name);
      
      const barsEnter = bars.enter()
        .append('g')
        .attr('class', 'bar-group')
        .attr('style', 'will-change: transform;')
        .attr('transform', d => {
           const targetPos = scaleBand(d.name) || 0;
           const targetSize1 = isVertical ? innerHeight - scaleValue(d.value1) : scaleValue(d.value1);
           const targetSize2 = isVertical ? innerHeight - scaleValue(d.value2) : scaleValue(d.value2);
           barStates.set(d.name, { pos: targetPos, size1: targetSize1, size2: targetSize2, value1: d.value1, value2: d.value2, vPos: 0, vSize1: 0, vSize2: 0, vv1: 0, vv2: 0 });
           return isVertical ? `translate(${targetPos}, 0)` : `translate(0, ${targetPos})`;
        });

      barsEnter.append('rect')
        .attr('class', 'bar-rect-1')
        .attr('rx', 6)
        .attr('fill', d => config.colors[d.name] || '#ccc')
        .attr('style', 'filter: drop-shadow(0 4px 6px rgba(0,0,0,0.1));');

      barsEnter.append('rect')
        .attr('class', 'bar-rect-2')
        .attr('rx', 6)
        .attr('fill', d => d3.color(config.colors[d.name] || '#ccc')?.darker(0.8).toString() || '#999')
        .attr('style', 'filter: drop-shadow(0 4px 6px rgba(0,0,0,0.1));');

      barsEnter.append('text')
        .attr('class', 'label')
        .attr('fill', config.theme === 'dark' ? '#ffffff' : '#09090b')
        .attr('font-family', config.fontFamily)
        .attr('font-weight', '700')
        .attr('font-size', isSmallScreen ? '10px' : '14px')
        .attr('letter-spacing', '-0.01em');

      barsEnter.append('text')
        .attr('class', 'value')
        .attr('fill', config.theme === 'dark' ? '#ffffff' : '#09090b')
        .attr('font-family', config.fontFamily)
        .attr('font-weight', '800')
        .attr('font-size', isSmallScreen ? '10px' : '14px')
        .attr('letter-spacing', '-0.02em')
        .text(d => formatNumber(d.total));

      const barsUpdate = bars.merge(barsEnter);

      barsUpdate.each(function(d) {
        const targetPos = scaleBand(d.name) || 0;
        const targetSize1 = isVertical ? innerHeight - scaleValue(d.value1) : scaleValue(d.value1);
        const targetSize2 = isVertical ? innerHeight - scaleValue(d.value2) : scaleValue(d.value2);
        
        let state = barStates.get(d.name);
        if (!state) {
          state = { pos: targetPos, size1: targetSize1, size2: targetSize2, value1: d.value1, value2: d.value2, vPos: 0, vSize1: 0, vSize2: 0, vv1: 0, vv2: 0 };
          barStates.set(d.name, state);
        }

        const stiffness = 0.15;
        const damping = 0.8;
        
        state.vPos = (state.vPos + (targetPos - state.pos) * stiffness) * damping;
        state.pos += state.vPos;
        
        state.vSize1 = (state.vSize1 + (targetSize1 - state.size1) * stiffness) * damping;
        state.size1 += state.vSize1;

        state.vSize2 = (state.vSize2 + (targetSize2 - state.size2) * stiffness) * damping;
        state.size2 += state.vSize2;
        
        state.vv1 = (state.vv1 + (d.value1 - state.value1) * stiffness) * damping;
        state.value1 += state.vv1;

        state.vv2 = (state.vv2 + (d.value2 - state.value2) * stiffness) * damping;
        state.value2 += state.vv2;

        const group = d3.select(this);
        
        group.attr('transform', isVertical ? `translate(${state.pos}, 0)` : `translate(0, ${state.pos})`);
        
        const isOvertaking = Math.abs(targetPos - state.pos) > 2;
        
        if (isOvertaking) {
          this.parentNode?.appendChild(this);
        }

        const rect1 = group.select('.bar-rect-1')
          .attr('filter', isOvertaking ? 'url(#motionBlur)' : null)
          .attr('stroke', isOvertaking ? (config.theme === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)') : 'none')
          .attr('stroke-width', isOvertaking ? 2 : 0);

        const rect2 = group.select('.bar-rect-2')
          .attr('filter', isOvertaking ? 'url(#motionBlur)' : null)
          .attr('stroke', isOvertaking ? (config.theme === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)') : 'none')
          .attr('stroke-width', isOvertaking ? 2 : 0);

        const label = group.select('.label')
          .attr('fill', config.theme === 'dark' ? '#ffffff' : '#000000');

        const valueText = group.select('.value')
          .attr('fill', config.theme === 'dark' ? '#ffffff' : '#000000')
          .text(formatNumber(state.value1 + state.value2));

        if (isVertical) {
          rect1
            .attr('width', scaleBand.bandwidth())
            .attr('height', state.size1)
            .attr('y', innerHeight - state.size1);

          rect2
            .attr('width', scaleBand.bandwidth())
            .attr('height', state.size2)
            .attr('y', innerHeight - state.size1 - state.size2);

          label
            .attr('text-anchor', 'middle')
            .attr('x', scaleBand.bandwidth() / 2)
            .attr('y', innerHeight + 20)
            .attr('dy', '0.35em')
            .text(d.name);

          valueText
            .attr('text-anchor', 'middle')
            .attr('x', scaleBand.bandwidth() / 2)
            .attr('y', innerHeight - state.size1 - state.size2 - 10)
            .attr('dy', '0');
        } else {
          rect1
            .attr('width', state.size1)
            .attr('height', scaleBand.bandwidth())
            .attr('y', 0);

          rect2
            .attr('width', state.size2)
            .attr('height', scaleBand.bandwidth())
            .attr('x', state.size1)
            .attr('y', 0);

          label
            .attr('text-anchor', 'end')
            .attr('x', isSmallScreen ? -8 : -16)
            .attr('y', scaleBand.bandwidth() / 2)
            .attr('dy', '0.35em')
            .text(d.name);

          valueText
            .attr('text-anchor', 'start')
            .attr('x', state.size1 + state.size2 + (isSmallScreen ? 8 : 16))
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
  }, [dimensions, dateGroups, secondaryDateGroups, config]);

  return null;
}
