import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { RaceProps } from './types';
import { formatNumber } from '../../../../shared/utils/formatters';
import { getInterpolatedFrame } from '../../../../core/dataProcessor';
import { Easing } from '../../../../core/easing';

export default function BarRace({ svgRef, config, isPlaying, currentTimeIndex, dimensions, dateGroups }: RaceProps) {
  const gRef = useRef<d3.Selection<SVGGElement, unknown, null, undefined> | null>(null);
  const axisGRef = useRef<d3.Selection<SVGGElement, unknown, null, undefined> | null>(null);
  const barStatesRef = useRef(new Map<string, { pos: number, size: number, value: number, vPos: number, vSize: number, vv: number }>());

  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    
    // Clean up previous race type elements
    svg.selectAll('.race-layer').remove();

    const isSmallScreen = dimensions.width < 600;
    const margin = isSmallScreen 
      ? { top: 60, right: 20, bottom: 40, left: config.showLabels ? 90 : 20 } 
      : { top: 80, right: 100, bottom: 80, left: config.showLabels ? 140 : 20 };
    
    const layer = svg.insert('g', '.overlay-layer')
      .attr('class', 'race-layer')
      .attr('transform', `translate(${margin.left},${margin.top})`)
      .style('opacity', 0);
      
    layer.transition().duration(300).style('opacity', 1);
      
    gRef.current = layer;
    axisGRef.current = layer.append('g').attr('class', 'axis');

    return () => {
      layer.transition().duration(300).style('opacity', 0).remove();
    };
  }, [config.fontFamily, dimensions.width]);

  useEffect(() => {
    if (!gRef.current || !axisGRef.current || dateGroups.length === 0) return;

    const isSmallScreen = dimensions.width < 600;
    const margin = isSmallScreen 
      ? { top: 60, right: 20, bottom: 40, left: config.showLabels ? 90 : 20 } 
      : { top: 80, right: 100, bottom: 80, left: config.showLabels ? 140 : 20 };

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

        const axisPos = config.xAxisPosition === 'bottom' ? innerWidth : 0;
        const axisFunc = config.xAxisPosition === 'bottom' ? d3.axisRight : d3.axisLeft;

        axisGRef.current!.attr('transform', `translate(${axisPos}, 0)`)
          .call(axisFunc(scaleValue).ticks(innerHeight / 100).tickSize(config.xAxisPosition === 'bottom' ? -innerWidth : -innerWidth)) // tickSize negative to span across
          .call(g => g.select('.domain').remove())
          .call(g => g.selectAll('.tick line').attr('stroke', config.theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)').attr('stroke-dasharray', '4,4'))
          .call(g => g.selectAll('.tick text').attr('fill', config.theme === 'dark' ? '#a1a1aa' : '#71717a').attr('font-family', config.fontFamily).attr('font-weight', '500').attr('dx', config.xAxisPosition === 'bottom' ? '0.5em' : '-0.5em'));
      } else {
        scaleValue = d3.scaleLinear().range([0, innerWidth]).domain([0, maxVal]);
        scaleBand = d3.scaleBand().range([0, innerHeight]).padding(0.1).domain(names);

        const axisPos = config.xAxisPosition === 'bottom' ? innerHeight : 0;
        const axisFunc = config.xAxisPosition === 'bottom' ? d3.axisBottom : d3.axisTop;

        axisGRef.current!.attr('transform', `translate(0, ${axisPos})`)
          .call(axisFunc(scaleValue).ticks(innerWidth / 100).tickSize(config.xAxisPosition === 'bottom' ? -innerHeight : -innerHeight))
          .call(g => g.select('.domain').remove())
          .call(g => g.selectAll('.tick line').attr('stroke', config.theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)').attr('stroke-dasharray', '4,4'))
          .call(g => g.selectAll('.tick text').attr('fill', config.theme === 'dark' ? '#a1a1aa' : '#71717a').attr('font-family', config.fontFamily).attr('font-weight', '500').attr('dy', config.xAxisPosition === 'bottom' ? '0.71em' : '-0.5em'));
      }

      const barStates = barStatesRef.current;

      const bars = g.selectAll<SVGGElement, any>('.bar-group').data(displayData, d => d.name);
      
      const barsEnter = bars.enter()
        .append('g')
        .attr('class', 'bar-group')
        .attr('style', 'will-change: transform;')
        .attr('transform', d => {
           const targetPos = scaleBand(d.name) || 0;
           barStates.set(d.name, { pos: targetPos, size: 0, value: 0, vPos: 0, vSize: 0, vv: 0 });
           return isVertical ? `translate(${targetPos}, 0)` : `translate(0, ${targetPos})`;
        });

      barsEnter.append('rect')
        .attr('class', 'bar-rect')
        .attr('rx', 6)
        .attr('fill', d => config.colors[d.name] || '#ccc')
        .attr('style', 'filter: drop-shadow(0 4px 6px rgba(0,0,0,0.1));');

      barsEnter.append('image')
        .attr('class', 'bar-icon')
        .attr('preserveAspectRatio', 'xMidYMid slice');

      barsEnter.append('text')
        .attr('class', 'label')
        .attr('fill', config.labelColor || (config.theme === 'dark' ? '#ffffff' : '#09090b'))
        .attr('font-family', config.fontFamily)
        .attr('font-weight', '700')
        .attr('font-size', isSmallScreen ? '10px' : '14px')
        .attr('letter-spacing', '-0.01em');

      barsEnter.append('text')
        .attr('class', 'value')
        .attr('fill', config.valueColor || (config.theme === 'dark' ? '#ffffff' : '#09090b'))
        .attr('font-family', config.fontFamily)
        .attr('font-weight', '800')
        .attr('font-size', isSmallScreen ? '10px' : '14px')
        .attr('letter-spacing', '-0.02em')
        .text(d => formatNumber(d.value));

      const barsUpdate = bars.merge(barsEnter);
      
      // Animation Constants
      const stiffness = config.stiffness || 0.1;
      const damping = config.damping || 0.8;
      const animationType = config.animationType || 'linear';

      barsUpdate.each(function(d, i) {
        // Staggered Cascade Delay
        let effectiveValue = d.value;
        if (config.staggerDelay) {
            // Delay based on rank (i)
            // We can't easily delay the *value* update without history or a separate time index per bar.
            // Instead, we can modify the stiffness/damping slightly per rank to create a "wave" effect.
            // Or we can just lag the target value update?
            // Let's try modifying stiffness. Lower rank = lower stiffness (slower).
            // No, usually top rank moves first? Or last?
            // "Cascade" usually means top to bottom.
            // Let's reduce stiffness for lower ranks.
            // stiffness = baseStiffness * (1 - i * 0.02)
        }
        
        const targetPos = scaleBand(d.name) || 0;
        const targetSize = isVertical ? innerHeight - scaleValue(d.value) : scaleValue(d.value);
        
        let state = barStates.get(d.name);
        if (!state) {
          state = { pos: targetPos, size: targetSize, value: d.value, vPos: 0, vSize: 0, vv: 0 };
          barStates.set(d.name, state);
        }

        // Physics Update
        if (animationType === 'linear') {
             state.pos = targetPos;
             state.size = targetSize;
             state.value = d.value;
             state.vPos = 0;
             state.vSize = 0;
             state.vv = 0;
        } else {
             // Spring / Elastic Physics
             let k = stiffness;
             let b = damping;
             
             if (animationType === 'elastic') {
                 k = 0.2;
                 b = 0.5; // Low damping for oscillation
             } else if (animationType === 'bounce') {
                 k = 0.4;
                 b = 0.6;
             } else if (animationType === 'back') {
                 // Simulate overshoot by temporarily boosting target?
                 // Or just under-damped spring.
                 k = 0.3;
                 b = 0.6;
             }
             
             if (config.staggerDelay) {
                 // Reduce stiffness for lower ranks to create cascade
                 k = Math.max(0.01, k - i * 0.005);
             }

             // Position
             const forcePos = (targetPos - state.pos) * k;
             state.vPos = (state.vPos + forcePos) * b;
             state.pos += state.vPos;
             
             // Size
             const forceSize = (targetSize - state.size) * k;
             state.vSize = (state.vSize + forceSize) * b;
             state.size += state.vSize;
             
             // Value Text
             const forceVal = (d.value - state.value) * k;
             state.vv = (state.vv + forceVal) * b;
             state.value += state.vv;
        }

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

        // Update color from settings if available
        const entitySetting = config.entitySettings?.[d.name];
        const barColor = entitySetting?.color || config.colors[d.name] || '#ccc';
        
        if (config.barStyle === 'dots') {
           rect.attr('fill', 'none').attr('stroke', 'none');
           
           // Dot Logic
           const DOT_SIZE = config.dotSize || 6;
           const DOT_GAP = config.dotGap || 2;
           const GRID_SIZE = DOT_SIZE + DOT_GAP;
           const DOT_RADIUS = DOT_SIZE / 2;
           
           let dotData: { id: string, cx: number, cy: number, color: string, opacity: number, r: number }[] = [];
           
           // Calculate grid dimensions
           let width, height, startX, startY, cols, rows;
           
           if (isVertical) {
              width = scaleBand.bandwidth();
              height = state.size;
              cols = Math.floor(width / GRID_SIZE);
              rows = Math.floor(height / GRID_SIZE);
              startX = (width - (cols * GRID_SIZE)) / 2 + DOT_RADIUS;
              // Y starts from bottom
           } else {
              height = scaleBand.bandwidth();
              width = state.size;
              rows = Math.floor(height / GRID_SIZE);
              cols = Math.floor(width / GRID_SIZE);
              startY = (height - (rows * GRID_SIZE)) / 2 + DOT_RADIUS;
           }
           
           // Generate Dots
           const velocityFactor = Math.abs(state.vSize) * 2; // Use velocity for effects
           
           if (isVertical) {
              for (let r = 0; r < rows; r++) {
                  for (let c = 0; c < cols; c++) {
                      const cy = innerHeight - (r * GRID_SIZE + DOT_RADIUS);
                      const cx = startX + c * GRID_SIZE;
                      
                      let rMod = DOT_RADIUS;
                      let opMod = 1;
                      
                      // Effects
                      if (config.dotEffect === 'pulse') {
                          rMod = DOT_RADIUS + Math.min(2, velocityFactor * 0.5);
                      } else if (config.dotEffect === 'sparkle') {
                          if (Math.random() < 0.05) opMod = 0.5 + Math.random() * 0.5;
                      }
                      
                      dotData.push({
                          id: `dot-${d.name}-${r}-${c}`,
                          cx, cy, color: barColor, opacity: opMod, r: rMod
                      });
                  }
              }
           } else {
              for (let c = 0; c < cols; c++) {
                  for (let r = 0; r < rows; r++) {
                      const cx = c * GRID_SIZE + DOT_RADIUS;
                      const cy = startY + r * GRID_SIZE;
                      
                      let rMod = DOT_RADIUS;
                      let opMod = 1;
                      
                      // Effects
                      if (config.dotEffect === 'pulse') {
                          // Pulse size based on velocity and position (wave)
                          const wave = Math.sin(c * 0.5 + currentTimeIndex * 0.1);
                          rMod = DOT_RADIUS + Math.min(2, velocityFactor * 0.5) + (velocityFactor > 0.1 ? wave : 0);
                      } else if (config.dotEffect === 'sparkle') {
                          if (Math.random() < 0.05) opMod = 0.2 + Math.random() * 0.8;
                      }
                      
                      dotData.push({
                          id: `dot-${d.name}-${c}-${r}`,
                          cx, cy, color: barColor, opacity: opMod, r: rMod
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
               .attr('cx', d => isVertical ? d.cx : d.cx + 50)
               .attr('cy', d => isVertical ? d.cy - 50 : d.cy)
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

           // Trail Effect (Simple implementation: keep exit selection longer?)
           if (config.dotEffect === 'trail') {
               dots.exit()
                   .transition()
                   .duration(800)
                   .attr('opacity', 0)
                   .attr('r', 0)
                   .attr('cx', (d: any) => isVertical ? d.cx : d.cx - 20) // Drift back
                   .remove();
           } else {
               dots.exit()
                   .transition()
                   .duration(200)
                   .attr('opacity', 0)
                   .remove();
           }
           
           // Overtake Particles
           if (config.showParticles && isOvertaking) {
               // Spawn random particles around the head
               // This requires a separate particle system or just transient SVG elements
               // For performance, maybe limit this.
               // Let's add a few random dots that fly out
               const particleCount = 2;
               for(let p=0; p<particleCount; p++) {
                   const angle = Math.random() * Math.PI * 2;
                   const dist = 10 + Math.random() * 20;
                   const px = (isVertical ? startX + width!/2 : state.size) + Math.cos(angle) * 10;
                   const py = (isVertical ? innerHeight - state.size : startY! + height!/2) + Math.sin(angle) * 10;
                   
                   dotsGroup.append('circle')
                       .attr('class', 'particle')
                       .attr('r', 2)
                       .attr('fill', barColor)
                       .attr('cx', px)
                       .attr('cy', py)
                       .attr('opacity', 1)
                       .transition()
                       .duration(500)
                       .attr('cx', px + Math.cos(angle) * dist)
                       .attr('cy', py + Math.sin(angle) * dist)
                       .attr('opacity', 0)
                       .remove();
               }
           }
               
        } else {
           // Solid Mode
           group.select('.dots-group').remove();
           rect.attr('fill', barColor);
           
           // Ripple Effect for Solid Bars
           if (config.showRipple && Math.abs(state.vSize) > 0.5) {
               // Add a ripple overlay?
               // Or just pulse opacity/brightness?
               // Let's skip complex ripple for now to maintain 60fps
           }
        }

        const label = group.select('.label')
          .attr('fill', config.labelColor || (config.theme === 'dark' ? '#ffffff' : '#000000'));

        const vVal = state.vv;
        let arrow = '';
        let arrowColor = '';
        if (Math.abs(vVal) > 0.1) {
            arrow = vVal > 0 ? ' ▲' : ' ▼';
            arrowColor = vVal > 0 ? '#10b981' : '#ef4444';
        }

        const valueText = group.select('.value')
          .attr('fill', config.valueColor || (config.theme === 'dark' ? '#ffffff' : '#000000'))
          .html(`${formatNumber(state.value)}<tspan fill="${arrowColor}" font-size="0.8em">${arrow}</tspan>`);

        // Icon handling
        const icon = group.select('.bar-icon');
        const iconUrl = entitySetting?.icon;
        const iconPosition = entitySetting?.iconPosition || 'before-name';
        const iconSize = scaleBand.bandwidth() * 0.8; // Icon size relative to bar width/height

        if (iconUrl && config.showIcons) {
          icon.attr('href', iconUrl)
              .attr('width', iconSize)
              .attr('height', iconSize)
              .style('display', 'block');
        } else {
          icon.style('display', 'none');
        }

        if (isVertical) {
          rect
            .attr('width', scaleBand.bandwidth())
            .attr('height', state.size)
            .attr('y', innerHeight - state.size);

          // Vertical layout logic for icons/labels is complex due to space. 
          // Simplified: Icon always above label if present.
          
          const labelY = innerHeight + 20;
          let labelYOffset = 0;

          if (iconUrl && config.showIcons) {
             // Position icon based on setting, defaulting to before-name (above name in vertical)
             if (iconPosition === 'end-of-bar') {
                icon.attr('x', (scaleBand.bandwidth() - iconSize) / 2)
                    .attr('y', innerHeight - state.size - iconSize - 5);
             } else {
                // before-name or after-name (effectively above/below in vertical, but let's stick to near label)
                icon.attr('x', (scaleBand.bandwidth() - iconSize) / 2)
                    .attr('y', labelY + 15);
                labelYOffset = -iconSize - 5; // Move label up? No, move icon down.
             }
          }

          label
            .attr('text-anchor', 'middle')
            .attr('x', scaleBand.bandwidth() / 2)
            .attr('y', labelY)
            .attr('dy', '0.35em')
            .style('display', config.showLabels ? 'block' : 'none')
            .text(d.name);

          valueText
            .attr('text-anchor', 'middle')
            .attr('x', scaleBand.bandwidth() / 2)
            .attr('y', innerHeight - state.size - 10)
            .attr('dy', '0');
            
        } else {
          // Horizontal Layout
          rect
            .attr('width', state.size)
            .attr('height', scaleBand.bandwidth())
            .attr('y', 0);

          let labelX = isSmallScreen ? -8 : -16;
          let labelAnchor = 'end';
          
          if (iconUrl && config.showIcons) {
            const yPos = (scaleBand.bandwidth() - iconSize) / 2;
            
            if (iconPosition === 'end-of-bar') {
              icon.attr('x', state.size + 5)
                  .attr('y', yPos);
              valueText.attr('x', state.size + iconSize + 10 + (isSmallScreen ? 8 : 16));
            } else if (iconPosition === 'after-name') {
              icon.attr('x', -iconSize - 5)
                  .attr('y', yPos);
              labelX -= (iconSize + 5);
              valueText.attr('x', state.size + (isSmallScreen ? 8 : 16));
            } else {
              // before-name (default)
              icon.attr('x', labelX - iconSize - 5)
                  .attr('y', yPos);
              labelX -= (iconSize + 5);
              valueText.attr('x', state.size + (isSmallScreen ? 8 : 16));
            }
          } else {
             valueText.attr('x', state.size + (isSmallScreen ? 8 : 16));
          }

          // If labels are hidden, we can use the full width (adjust axis/margin elsewhere, but here we just hide text)
          // To truly use max width, we need to update margins in useEffect based on showLabels.
          // For now, just hiding the text.
          
          label
            .attr('text-anchor', labelAnchor)
            .attr('x', labelX)
            .attr('y', scaleBand.bandwidth() / 2)
            .attr('dy', '0.35em')
            .style('display', config.showLabels ? 'block' : 'none')
            .text(d.name);

          valueText
            .attr('text-anchor', 'start')
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
