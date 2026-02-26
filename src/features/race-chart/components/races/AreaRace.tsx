import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { RaceProps } from './types';
import { formatNumber } from '../../../../shared/utils/formatters';
import { getInterpolatedFrame } from '../../../../core/dataProcessor';

export default function AreaRace({ svgRef, config, isPlaying, currentTimeIndex, dimensions, dateGroups }: RaceProps) {
  const gRef = useRef<d3.Selection<SVGGElement, unknown, null, undefined> | null>(null);
  const xAxisGRef = useRef<d3.Selection<SVGGElement, unknown, null, undefined> | null>(null);
  const yAxisGRef = useRef<d3.Selection<SVGGElement, unknown, null, undefined> | null>(null);
  const areaStatesRef = useRef(new Map<string, { path: [number, number, number][], value: number, vv: number }>());

  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    
    svg.selectAll('.race-layer').remove();

    const margin = { top: 80, right: 140, bottom: 60, left: 80 };
    
    const layer = svg.insert('g', '.overlay-layer')
      .attr('class', 'race-layer')
      .attr('transform', `translate(${margin.left},${margin.top})`)
      .style('opacity', 0);
      
    layer.transition().duration(300).style('opacity', 1);
      
    // Add Dot Pattern Mask Definition
    const defs = layer.append('defs');
    const maskId = `dotMask-area-${config.id}`;
    const patternId = `dotPattern-area-${config.id}`;
    
    const pattern = defs.append('pattern')
      .attr('id', patternId)
      .attr('patternUnits', 'userSpaceOnUse')
      .attr('width', 8)
      .attr('height', 8);
      
    pattern.append('rect')
      .attr('width', 8)
      .attr('height', 8)
      .attr('fill', 'black'); // Mask background (hidden)
      
    pattern.append('circle')
      .attr('cx', 4)
      .attr('cy', 4)
      .attr('r', 2.5)
      .attr('fill', 'white'); // Mask foreground (visible)
      
    const mask = defs.append('mask')
      .attr('id', maskId);
      
    mask.append('rect')
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('fill', `url(#${patternId})`);
      
    gRef.current = layer;
    xAxisGRef.current = layer.append('g').attr('class', 'x-axis');
    yAxisGRef.current = layer.append('g').attr('class', 'y-axis');

    return () => {
      layer.transition().duration(300).style('opacity', 0).remove();
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
        const path: [number, number, number][] = []; // [x, y0, y1]
        return { name: d.name, path, currentValue: d.value };
      });

      timePoints.forEach(t => {
        const frameData = t === index ? currentData : getInterpolatedFrame(dateGroups, t);
        let y0 = 0;
        pathsData.forEach(pd => {
          const entityData = frameData.find(fd => fd.name === pd.name);
          const val = entityData ? entityData.value : 0;
          pd.path.push([t, y0, y0 + val]);
          y0 += val;
        });
      });

      let maxVal = 1;
      pathsData.forEach(pd => {
        pd.path.forEach(pt => {
          if (pt[2] > maxVal) maxVal = pt[2];
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

      const areaStates = areaStatesRef.current;

      const areaGenerator = d3.area<[number, number, number]>()
        .x(d => isVertical ? scaleValue(d[1]) : scaleTime(d[0]))
        .y0(d => isVertical ? scaleTime(d[0]) : scaleValue(d[1]))
        .y1(d => isVertical ? scaleTime(d[0]) : scaleValue(d[2]))
        .curve(d3.curveLinear);

      if (isVertical) {
        areaGenerator
          .x0(d => scaleValue(d[1]))
          .x1(d => scaleValue(d[2]))
          .y(d => scaleTime(d[0]))
          .curve(d3.curveLinear);
      }

      const areas = g.selectAll<SVGGElement, any>('.area-group').data(pathsData, d => d.name);
      
      const areasEnter = areas.enter()
        .append('g')
        .attr('class', 'area-group');

      areasEnter.append('path')
        .attr('class', 'area-path')
        .attr('fill', d => config.barStyle === 'dots' ? `url(#globalDotPattern-${config.id})` : (config.colors[d.name] || '#ccc'))
        .attr('stroke', d => config.barStyle === 'dots' ? (config.colors[d.name] || '#ccc') : (config.theme === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'))
        .attr('stroke-width', config.barStyle === 'dots' ? 2 : 1)
        .attr('opacity', 0.8)
        .attr('style', 'filter: drop-shadow(0 4px 6px rgba(0,0,0,0.1));');

      areasEnter.append('text')
        .attr('class', 'label')
        .attr('fill', config.theme === 'dark' ? '#ffffff' : '#09090b')
        .attr('font-family', config.fontFamily)
        .attr('font-weight', '700')
        .attr('font-size', '14px');

      areasEnter.append('text')
        .attr('class', 'value')
        .attr('fill', config.theme === 'dark' ? '#a1a1aa' : '#71717a')
        .attr('font-family', config.fontFamily)
        .attr('font-weight', '600')
        .attr('font-size', '12px');

      const areasUpdate = areas.merge(areasEnter);

      areasUpdate.each(function(d) {
        let state = areaStates.get(d.name);
        if (!state) {
          state = { path: d.path, value: 0, vv: 0 };
          areaStates.set(d.name, state);
        }

        const stiffness = 0.15;
        const damping = 0.8;
        
        state.vv = (state.vv + (d.currentValue - state.value) * stiffness) * damping;
        state.value += state.vv;

        const group = d3.select(this);
        
        group.select('.area-path')
          .attr('d', areaGenerator(d.path) || '')
          .attr('fill', (config.colors[d.name] || '#ccc'))
          .attr('mask', config.barStyle === 'dots' ? `url(#dotMask-area-${config.id})` : null)
          .attr('stroke', config.barStyle === 'dots' ? (config.colors[d.name] || '#ccc') : (config.theme === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'))
          .attr('stroke-width', config.barStyle === 'dots' ? 2 : 1);

        const lastPoint = d.path[d.path.length - 1];
        if (lastPoint) {
          const cx = isVertical ? scaleValue(lastPoint[1] + (lastPoint[2] - lastPoint[1]) / 2) : scaleTime(lastPoint[0]);
          const cy = isVertical ? scaleTime(lastPoint[0]) : scaleValue(lastPoint[1] + (lastPoint[2] - lastPoint[1]) / 2);

          const label = group.select('.label')
            .attr('fill', config.theme === 'dark' ? '#ffffff' : '#000000')
            .text(d.name);

          const vVal = state.vv;
          let arrow = '';
          let arrowColor = '';
          if (Math.abs(vVal) > 0.1) {
              arrow = vVal > 0 ? ' ▲' : ' ▼';
              arrowColor = vVal > 0 ? '#10b981' : '#ef4444';
          }

          const valueText = group.select('.value')
            .html(`${formatNumber(state.value)}<tspan fill="${arrowColor}" font-size="0.8em">${arrow}</tspan>`);

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

      areas.exit().remove();
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
