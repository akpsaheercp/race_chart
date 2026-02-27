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
      .attr('transform', `translate(${margin.left + innerWidth / 2},${margin.top + innerHeight / 2})`)
      .style('opacity', 0);
      
    layer.transition().duration(300).style('opacity', 1);
      
    gRef.current = layer;

    return () => {
      layer.transition().duration(300).style('opacity', 0).remove();
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

      const pie = d3.pie<any>().value(d => d.value).sort(null); // Keep original order to prevent swapping
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
        .attr('fill', d => config.barStyle === 'dots' ? `url(#globalDotPattern-${config.id})` : (config.colors[d.data.name] || '#ccc'))
        .attr('stroke', d => config.barStyle === 'dots' ? (config.colors[d.data.name] || '#ccc') : (config.theme === 'dark' ? '#000' : '#fff'))
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
          state = { startAngle: targetStart, endAngle: targetStart, value: 0, vStart: 0, vEnd: 0, vv: 0 };
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
        
        // Update color from settings if available
        const entitySetting = config.entitySettings?.[d.data.name];
        const sliceColor = entitySetting?.color || config.colors[d.data.name] || '#ccc';

        if (config.barStyle === 'dots') {
           group.select('.pie-path')
             .attr('fill', 'none')
             .attr('stroke', 'none');

           // Dot Logic
           const DOT_SIZE = 6;
           const DOT_GAP = 2;
           const GRID_SIZE = DOT_SIZE + DOT_GAP;
           const DOT_RADIUS = DOT_SIZE / 2;
           
           const r = radius;
           const diameter = r * 2;
           const cols = Math.floor(diameter / GRID_SIZE);
           const rows = Math.floor(diameter / GRID_SIZE);
           
           let dotData: { id: string, cx: number, cy: number, color: string }[] = [];
           
           const startX = -(cols * GRID_SIZE) / 2 + DOT_RADIUS;
           const startY = -(rows * GRID_SIZE) / 2 + DOT_RADIUS;
           
           // Current angles
           const startAngle = state.startAngle;
           const endAngle = state.endAngle;
           
           for (let row = 0; row < rows; row++) {
               for (let col = 0; col < cols; col++) {
                   const cx = startX + col * GRID_SIZE;
                   const cy = startY + row * GRID_SIZE;
                   
                   // Polar coordinates
                   const dist = Math.sqrt(cx * cx + cy * cy);
                   let angle = Math.atan2(cy, cx);
                   if (angle < 0) angle += 2 * Math.PI; // Normalize to 0-2PI
                   
                   // Check radius
                   if (dist >= radius * 0.5 && dist <= radius - DOT_RADIUS) {
                       // Check angle
                       // Need to handle angle wrapping if necessary, but d3 arcs usually are 0-2PI
                       // d3 arc: 0 at 12 o'clock? No, 0 at 12 o'clock is standard for d3.arc() but atan2 is from 3 o'clock.
                       // d3.arc: 0 is -y (12 o'clock), PI/2 is x (3 o'clock).
                       // Math.atan2: 0 is x (3 o'clock), PI/2 is y (6 o'clock).
                       // Let's adjust atan2 angle to match d3.arc
                       // d3 angle = atan2(x, -y) ?
                       // Let's just use d3.polygonContains or geometric check.
                       // Simpler: convert d3 angle to standard polar angle.
                       // d3: 0 is up (0, -1). 
                       // standard: 0 is right (1, 0).
                       // d3 = standard + PI/2 ? No.
                       // Let's use the centroid helper or just simple check.
                       
                       // Correct conversion:
                       // d3 angle 0 = -PI/2 standard.
                       // d3 angle PI/2 = 0 standard.
                       // standard = d3 - PI/2.
                       
                       let standardAngle = angle + Math.PI / 2;
                       if (standardAngle >= 2 * Math.PI) standardAngle -= 2 * Math.PI;
                       
                       // Wait, d3.arc angles are in radians, 0 at 12 o'clock, clockwise.
                       // atan2 is counter-clockwise from 3 o'clock.
                       // Let's convert (cx, cy) to d3 angle space.
                       // x = r * sin(a), y = -r * cos(a)
                       // a = atan2(x, -y)
                       
                       let d3Angle = Math.atan2(cx, -cy);
                       if (d3Angle < 0) d3Angle += 2 * Math.PI;
                       
                       // Check if d3Angle is between startAngle and endAngle
                       // Handle wrapping? d3.pie usually returns 0 to 2PI.
                       
                       if (d3Angle >= startAngle && d3Angle <= endAngle) {
                           dotData.push({
                               id: `dot-${d.data.name}-${row}-${col}`,
                               cx: cx,
                               cy: cy,
                               color: sliceColor
                           });
                       }
                   }
               }
           }
           
           let dotsGroup = group.select<SVGGElement>('.dots-group');
           if (dotsGroup.empty()) {
               dotsGroup = group.append('g').attr('class', 'dots-group');
           }
           
           const dots = dotsGroup.selectAll<SVGCircleElement, any>('.dot')
               .data(dotData, (d: any) => d.id);
               
           dots.enter()
               .append('circle')
               .attr('class', 'dot')
               .attr('r', DOT_RADIUS)
               .attr('fill', d => d.color)
               .attr('opacity', 0)
               .attr('cx', d => d.cx * 1.5) // Start further out
               .attr('cy', d => d.cy * 1.5)
               .transition()
               .duration(400)
               .ease(d3.easeBackOut)
               .attr('cx', d => d.cx)
               .attr('cy', d => d.cy)
               .attr('opacity', 1);
               
           dots.exit().remove();

        } else {
           group.select('.dots-group').remove();
           group.select('.pie-path')
             .attr('d', arc(currentArcData) as string)
             .attr('fill', sliceColor)
             .attr('stroke', config.theme === 'dark' ? '#000' : '#fff');
        }

        const midAngle = state.startAngle + (state.endAngle - state.startAngle) / 2;
        const pos = outerArc.centroid(currentArcData);
        pos[0] = radius * 1.15 * (midAngle < Math.PI ? 1 : -1);

        group.select('.pie-line')
          .attr('points', `${arc.centroid(currentArcData)},${outerArc.centroid(currentArcData)},${pos}`);

        const vVal = state.vv;
        let arrow = '';
        let arrowColor = '';
        if (Math.abs(vVal) > 0.1) {
            arrow = vVal > 0 ? ' ▲' : ' ▼';
            arrowColor = vVal > 0 ? '#10b981' : '#ef4444';
        }

        group.select('.label')
          .attr('transform', `translate(${pos})`)
          .style('text-anchor', midAngle < Math.PI ? 'start' : 'end')
          .html(`${d.data.name} (${formatNumber(state.value)})<tspan fill="${arrowColor}" font-size="0.8em">${arrow}</tspan>`);
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
