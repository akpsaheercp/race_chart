import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { RaceProps } from './types';
import { formatNumber } from '../../../../shared/utils/formatters';
import { getInterpolatedFrame } from '../../../../core/dataProcessor';

export default function LineRace({ svgRef, config, isPlaying, currentTimeIndex, dimensions, dateGroups }: RaceProps) {
  const gRef = useRef<d3.Selection<SVGGElement, unknown, null, undefined> | null>(null);
  const xAxisGRef = useRef<d3.Selection<SVGGElement, unknown, null, undefined> | null>(null);
  const yAxisGRef = useRef<d3.Selection<SVGGElement, unknown, null, undefined> | null>(null);
  const lineStatesRef = useRef(new Map<string, { path: [number, number][], value: number, vv: number }>());

  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    
    svg.selectAll('.race-layer').remove();

    const margin = { top: 80, right: 140, bottom: 60, left: 80 };
    
    const layer = svg.insert('g', '.overlay-layer')
      .attr('class', 'race-layer')
      .attr('transform', `translate(${margin.left},${margin.top})`);
      
    gRef.current = layer;
    xAxisGRef.current = layer.append('g').attr('class', 'x-axis');
    yAxisGRef.current = layer.append('g').attr('class', 'y-axis');

    return () => {
      layer.remove();
    };
  }, [config.fontFamily, dimensions]);

  useEffect(() => {
    if (!gRef.current || !xAxisGRef.current || !yAxisGRef.current || dateGroups.length === 0) return;

    const margin = { top: 80, right: 140, bottom: 60, left: 80 };
    const innerWidth = dimensions.width - margin.left - margin.right;
    const innerHeight = dimensions.height - margin.top - margin.bottom;

    const isVertical = config.orientation === 'vertical';

    const renderFrame = (index: number) => {
      const currentData = getInterpolatedFrame(dateGroups, index);
      const displayData = currentData
        .sort((a, b) => d3.descending(a.value, b.value))
        .slice(0, config.maxBars);

      const g = gRef.current!;

      const historyLength = 20;
      const startIndex = Math.max(0, index - historyLength);
      
      const timePoints: number[] = [];
      const startInt = Math.ceil(startIndex);
      const endInt = Math.floor(index);
      
      if (startIndex < startInt) timePoints.push(startIndex);
      for (let i = startInt; i <= endInt; i++) timePoints.push(i);
      if (index > endInt && timePoints[timePoints.length - 1] !== index) timePoints.push(index);

      const pathsData = displayData.map(d => {
        const path: [number, number][] = [];
        timePoints.forEach(t => {
          if (t === index) {
            path.push([t, d.value]);
          } else {
            const frameData = getInterpolatedFrame(dateGroups, t);
            const entityData = frameData.find(fd => fd.name === d.name);
            if (entityData) {
              path.push([t, entityData.value]);
            }
          }
        });
        return { name: d.name, path, currentValue: d.value };
      });

      let maxVal = 1;
      pathsData.forEach(pd => {
        pd.path.forEach(pt => {
          if (pt[1] > maxVal) maxVal = pt[1];
        });
      });
      maxVal = maxVal * 1.05; // Add 5% padding to top

      let scaleTime: d3.ScaleLinear<number, number>;
      let scaleValue: d3.ScaleLinear<number, number>;

      if (isVertical) {
        scaleTime = d3.scaleLinear().range([0, innerHeight]).domain([Math.max(historyLength, index), startIndex]);
        scaleValue = d3.scaleLinear().range([0, innerWidth]).domain([0, maxVal]);

        xAxisGRef.current!.attr('transform', `translate(0, ${innerHeight})`)
          .call(d3.axisBottom(scaleValue).ticks(5).tickSize(-innerHeight))
          .call(g => g.select('.domain').remove())
          .call(g => g.selectAll('.tick line').attr('stroke', config.theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)').attr('stroke-dasharray', '4,4'))
          .call(g => g.selectAll('.tick text').attr('fill', config.theme === 'dark' ? '#a1a1aa' : '#71717a').attr('font-family', config.fontFamily).attr('font-weight', '500').attr('dy', '1em'));

        yAxisGRef.current!.attr('transform', `translate(0, 0)`)
          .call(d3.axisLeft(scaleTime).ticks(5).tickFormat(() => ''))
          .call(g => g.select('.domain').attr('stroke', config.theme === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'))
          .call(g => g.selectAll('.tick line').attr('stroke', config.theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'));

      } else {
        scaleTime = d3.scaleLinear().range([0, innerWidth]).domain([startIndex, Math.max(historyLength, index)]);
        scaleValue = d3.scaleLinear().range([innerHeight, 0]).domain([0, maxVal]);

        xAxisGRef.current!.attr('transform', `translate(0, ${innerHeight})`)
          .call(d3.axisBottom(scaleTime).ticks(5).tickFormat(() => ''))
          .call(g => g.select('.domain').attr('stroke', config.theme === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'))
          .call(g => g.selectAll('.tick line').attr('stroke', config.theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'));

        yAxisGRef.current!.attr('transform', `translate(0, 0)`)
          .call(d3.axisLeft(scaleValue).ticks(5).tickSize(-innerWidth))
          .call(g => g.select('.domain').remove())
          .call(g => g.selectAll('.tick line').attr('stroke', config.theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)').attr('stroke-dasharray', '4,4'))
          .call(g => g.selectAll('.tick text').attr('fill', config.theme === 'dark' ? '#a1a1aa' : '#71717a').attr('font-family', config.fontFamily).attr('font-weight', '500').attr('dx', '-0.5em'));
      }

      const lineStates = lineStatesRef.current;

      const lineGenerator = d3.line<[number, number]>()
        .x(d => isVertical ? scaleValue(d[1]) : scaleTime(d[0]))
        .y(d => isVertical ? scaleTime(d[0]) : scaleValue(d[1]))
        .curve(d3.curveLinear);

      if (isVertical) {
        lineGenerator.curve(d3.curveLinear);
      }

      const lines = g.selectAll<SVGGElement, any>('.line-group').data(pathsData, d => d.name);
      
      const linesEnter = lines.enter()
        .append('g')
        .attr('class', 'line-group');

      linesEnter.append('path')
        .attr('class', 'line-path')
        .attr('fill', 'none')
        .attr('stroke', d => config.colors[d.name] || '#ccc')
        .attr('stroke-width', 4)
        .attr('stroke-linecap', 'round')
        .attr('stroke-linejoin', 'round')
        .attr('style', 'filter: drop-shadow(0 4px 6px rgba(0,0,0,0.1));');

      linesEnter.append('circle')
        .attr('class', 'line-head')
        .attr('r', 6)
        .attr('fill', d => config.colors[d.name] || '#ccc')
        .attr('stroke', config.theme === 'dark' ? '#000' : '#fff')
        .attr('stroke-width', 2);

      linesEnter.append('text')
        .attr('class', 'label')
        .attr('fill', config.theme === 'dark' ? '#ffffff' : '#09090b')
        .attr('font-family', config.fontFamily)
        .attr('font-weight', '700')
        .attr('font-size', '14px');

      linesEnter.append('text')
        .attr('class', 'value')
        .attr('fill', config.theme === 'dark' ? '#a1a1aa' : '#71717a')
        .attr('font-family', config.fontFamily)
        .attr('font-weight', '600')
        .attr('font-size', '12px');

      const linesUpdate = lines.merge(linesEnter);

      linesUpdate.each(function(d) {
        let state = lineStates.get(d.name);
        if (!state) {
          state = { path: d.path, value: d.currentValue, vv: 0 };
          lineStates.set(d.name, state);
        }

        const stiffness = 0.15;
        const damping = 0.8;
        
        state.vv = (state.vv + (d.currentValue - state.value) * stiffness) * damping;
        state.value += state.vv;

        const group = d3.select(this);
        
        group.select('.line-path')
          .attr('d', lineGenerator(d.path) || '');

        const lastPoint = d.path[d.path.length - 1];
        if (lastPoint) {
          const cx = isVertical ? scaleValue(lastPoint[1]) : scaleTime(lastPoint[0]);
          const cy = isVertical ? scaleTime(lastPoint[0]) : scaleValue(lastPoint[1]);

          group.select('.line-head')
            .attr('cx', cx)
            .attr('cy', cy);

          const label = group.select('.label')
            .attr('fill', config.theme === 'dark' ? '#ffffff' : '#000000')
            .text(d.name);

          const valueText = group.select('.value')
            .text(formatNumber(state.value));

          if (isVertical) {
            label
              .attr('x', cx)
              .attr('y', cy - 20)
              .attr('text-anchor', 'middle')
              .attr('dx', 0)
              .attr('dy', 0);

            valueText
              .attr('x', cx)
              .attr('y', cy - 5)
              .attr('text-anchor', 'middle')
              .attr('dx', 0)
              .attr('dy', 0);
          } else {
            label
              .attr('x', cx)
              .attr('y', cy)
              .attr('text-anchor', 'start')
              .attr('dx', 12)
              .attr('dy', '0.35em');

            valueText
              .attr('x', cx)
              .attr('y', cy)
              .attr('text-anchor', 'start')
              .attr('dx', 12)
              .attr('dy', '1.5em');
          }
        }
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
