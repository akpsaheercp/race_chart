import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { RaceProps } from './types';
import { formatNumber } from '../../../../shared/utils/formatters';
import { getInterpolatedFrame } from '../../../../core/dataProcessor';
import { Easing } from '../../../../core/easing';

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
        .attr('fill', d => config.barStyle === 'dots' ? `url(#globalDotPattern-${config.id})` : (config.colors[d.name] || '#ccc'))
        .attr('stroke', d => config.barStyle === 'dots' ? (config.colors[d.name] || '#ccc') : (config.theme === 'dark' ? '#000' : '#fff'))
        .attr('stroke-width', 2)
        .attr('r', d => rScale(d.value))
        .attr('opacity', 0.8)
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

        // Animation Constants
        const stiffness = config.stiffness || 0.1;
        const damping = config.damping || 0.8;
        const animationType = config.animationType || 'linear';

        // Physics Update
        if (animationType === 'linear') {
             state.x = targetX;
             state.y = targetY;
             state.r = targetR;
             state.value = d.value;
             state.vx = 0;
             state.vy = 0;
             state.vr = 0;
             state.vv = 0;
        } else {
             let k = stiffness;
             let b = damping;
             
             if (animationType === 'elastic') {
                 k = 0.2;
                 b = 0.5;
             } else if (animationType === 'bounce') {
                 k = 0.4;
                 b = 0.6;
             } else if (animationType === 'back') {
                 k = 0.3;
                 b = 0.6;
             }
             
             if (config.staggerDelay) {
                 // k = Math.max(0.01, k - i * 0.005); // i is not available in this scope if not passed
             }

             // Position
             const forceX = (targetX - state.x) * k;
             state.vx = (state.vx + forceX) * b;
             state.x += state.vx;
             
             const forceY = (targetY - state.y) * k;
             state.vy = (state.vy + forceY) * b;
             state.y += state.vy;
             
             const forceR = (targetR - state.r) * k;
             state.vr = (state.vr + forceR) * b;
             state.r += state.vr;
             
             const forceVal = (d.value - state.value) * k;
             state.vv = (state.vv + forceVal) * b;
             state.value += state.vv;
        }

        const group = d3.select(this);
        
        group.attr('transform', `translate(${state.x}, ${state.y})`);
        
        // Update color from settings if available
        const entitySetting = config.entitySettings?.[d.name];
        const bubbleColor = entitySetting?.color || config.colors[d.name] || '#ccc';

        if (config.barStyle === 'dots') {
           group.select('.bubble-circle')
             .attr('fill', 'none')
             .attr('stroke', 'none');

           // Dot Logic
           const DOT_SIZE = config.dotSize || 6;
           const DOT_GAP = config.dotGap || 2;
           const GRID_SIZE = DOT_SIZE + DOT_GAP;
           const DOT_RADIUS = DOT_SIZE / 2;
           
           // Generate dots within the circle
           const r = state.r;
           const diameter = r * 2;
           const cols = Math.floor(diameter / GRID_SIZE);
           const rows = Math.floor(diameter / GRID_SIZE);
           
           let dotData: { id: string, cx: number, cy: number, color: string, opacity: number, r: number }[] = [];
           
           // Center the grid
           const startX = -(cols * GRID_SIZE) / 2 + DOT_RADIUS;
           const startY = -(rows * GRID_SIZE) / 2 + DOT_RADIUS;
           
           const velocityFactor = Math.abs(state.vr) * 2; // Use velocity for effects
           
           for (let row = 0; row < rows; row++) {
               for (let col = 0; col < cols; col++) {
                   const cx = startX + col * GRID_SIZE;
                   const cy = startY + row * GRID_SIZE;
                   
                   // Check if point is inside circle
                   if (Math.sqrt(cx * cx + cy * cy) <= r - DOT_RADIUS) {
                       let rMod = DOT_RADIUS;
                       let opMod = 1;
                       
                       // Effects
                       if (config.dotEffect === 'pulse') {
                           rMod = DOT_RADIUS + Math.min(2, velocityFactor * 0.5);
                       } else if (config.dotEffect === 'sparkle') {
                           if (Math.random() < 0.05) opMod = 0.5 + Math.random() * 0.5;
                       }
                       
                       dotData.push({
                           id: `dot-${d.name}-${row}-${col}`,
                           cx: cx,
                           cy: cy,
                           color: bubbleColor,
                           opacity: opMod,
                           r: rMod
                       });
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
               .attr('r', d => d.r)
               .attr('fill', d => d.color)
               .attr('opacity', 0)
               // Start from a random angle outside
               .attr('cx', d => d.cx + (Math.random() - 0.5) * 100) 
               .attr('cy', d => d.cy + (Math.random() - 0.5) * 100)
               .transition()
               .duration(400)
               .ease(d3.easeBackOut)
               .attr('cx', d => d.cx)
               .attr('cy', d => d.cy)
               .attr('opacity', d => d.opacity);
               
           dots.attr('r', d => d.r)
               .attr('opacity', d => d.opacity)
               .attr('cx', d => d.cx) // Update position for existing dots (if grid shifts)
               .attr('cy', d => d.cy);

           // Trail Effect
           if (config.dotEffect === 'trail') {
               dots.exit()
                   .transition()
                   .duration(800)
                   .attr('opacity', 0)
                   .attr('r', 0)
                   .attr('cx', d => d.cx * 1.2) // Expand out
                   .attr('cy', d => d.cy * 1.2)
                   .remove();
           } else {
               dots.exit().remove();
           }
           
        } else {
           group.select('.dots-group').remove();
           group.select('.bubble-circle')
             .attr('r', state.r)
             .attr('fill', bubbleColor)
             .attr('stroke', config.theme === 'dark' ? '#000' : '#fff');
        }

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
