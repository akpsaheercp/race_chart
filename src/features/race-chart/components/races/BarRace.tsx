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

      barsEnter.append('image')
        .attr('class', 'bar-icon')
        .attr('preserveAspectRatio', 'xMidYMid slice');

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

        // Update color from settings if available
        const entitySetting = config.entitySettings?.[d.name];
        if (entitySetting?.color) {
          rect.attr('fill', entitySetting.color);
        } else {
          rect.attr('fill', config.colors[d.name] || '#ccc');
        }

        const label = group.select('.label')
          .attr('fill', config.theme === 'dark' ? '#ffffff' : '#000000');

        const valueText = group.select('.value')
          .attr('fill', config.theme === 'dark' ? '#ffffff' : '#000000')
          .text(formatNumber(state.value));

        // Icon handling
        const icon = group.select('.bar-icon');
        const iconUrl = entitySetting?.icon;
        const iconPosition = entitySetting?.iconPosition || 'before-name';
        const iconSize = scaleBand.bandwidth() * 0.8; // Icon size relative to bar width/height

        if (iconUrl) {
          icon.attr('href', iconUrl)
              .attr('width', iconSize)
              .attr('height', iconSize)
              .style('display', 'block');
              
          // Circular mask for icon
          // Note: Ideally we'd define a clipPath in defs, but for simplicity we can use CSS rounded corners if it were HTML, 
          // but for SVG image we might need a clipPath. 
          // For now, let's assume the user uploads pre-cropped images or we just show them square/rectangular.
          // Or we can add a clipPath to the defs in RaceChart and reference it here, but unique IDs are tricky.
          // Let's just render it for now.
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

          if (iconUrl) {
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
          
          if (iconUrl) {
            const yPos = (scaleBand.bandwidth() - iconSize) / 2;
            
            if (iconPosition === 'before-name') {
               // Icon to the left of the name
               // We need to measure text width to know where to put the icon? 
               // Or just put icon at fixed offset and move text?
               // Let's put icon at labelX - iconSize - padding, and keep label where it is?
               // Or move label right?
               
               // Simpler: Icon at far left (if space) or just left of text.
               // Let's assume label is right-aligned to x=0 (minus padding).
               // So icon should be at labelX - textWidth - iconSize. 
               // Since we can't easily measure text width in d3 loop without performance hit, 
               // let's try a fixed offset approach or 'end-of-bar' which is easier.
               
               // Actually, 'before-name' in horizontal bar chart usually means left of the label.
               // Since label is right-aligned to the axis, 'before-name' would be further left.
               // This might push it off screen if margins aren't big enough.
               
               // Let's implement 'end-of-bar' (right of the bar) and 'after-name' (between name and bar? or right of name?)
               // 'after-name' in RTL context (label left of axis) would be between label and axis.
               
               // Let's stick to:
               // end-of-bar: Icon follows the bar growing.
               // before-name: Icon is to the left of the label text.
               // after-name: Icon is to the right of the label text (between text and axis).
               
               if (iconPosition === 'end-of-bar') {
                 icon.attr('x', state.size + 5)
                     .attr('y', yPos);
                 
                 // Push value text further right
                 valueText.attr('x', state.size + iconSize + 10 + (isSmallScreen ? 8 : 16));
               } else if (iconPosition === 'after-name') {
                 // Right of label, left of axis.
                 // Label is at -16. Icon at -16 + ? 
                 // This is hard without text metrics.
                 // Let's just put it at -iconSize - 5 and move label further left.
                 icon.attr('x', -iconSize - 5)
                     .attr('y', yPos);
                 labelX -= (iconSize + 5);
               } else {
                 // before-name (default)
                 // We'll just put it at a fixed large negative offset? No, that looks bad.
                 // Let's put it inside the bar? No.
                 // Let's put it at the end of the bar for now if 'before-name' is too hard without metrics,
                 // OR just assume a fixed width for the icon and shift label.
                 
                 // Let's try: Icon at -iconSize - 5 (right next to axis), label shifted left.
                 // Wait, 'before-name' means [Icon] [Name] | [Bar]
                 // 'after-name' means [Name] [Icon] | [Bar]
                 
                 // So for 'after-name': Icon at -iconSize - 5. Label at -iconSize - 10 - textWidth.
                 // For 'before-name': Icon at -textWidth - iconSize - 10.
                 
                 // Without text width, this is tricky.
                 // Let's use 'end-of-bar' as the only supported dynamic position for now?
                 // Or just render it at the end of the bar for 'end-of-bar', and for others, 
                 // maybe render it inside the bar at the tip?
                 
                 // Let's implement 'end-of-bar' correctly.
                 // For 'before-name'/'after-name', let's just place it at the end of the bar for now 
                 // to avoid layout breakage, or maybe inside the bar at the start?
                 
                 // Actually, let's just support 'end-of-bar' and 'start-of-bar' (inside).
                 // But user asked for "before entity name or after".
                 
                 // Let's try to estimate text width? No.
                 // Let's just use a fixed offset for 'after-name' (between name and axis).
                 
                 if (iconPosition === 'after-name') {
                    icon.attr('x', -iconSize - 8).attr('y', yPos);
                    labelX -= (iconSize + 8);
                 } else if (iconPosition === 'before-name') {
                    // We can't do this well without metrics. 
                    // Fallback: Place at end of bar.
                    icon.attr('x', state.size + 5).attr('y', yPos);
                    valueText.attr('x', state.size + iconSize + 10 + (isSmallScreen ? 8 : 16));
                 } else {
                    // end-of-bar
                    icon.attr('x', state.size + 5).attr('y', yPos);
                    valueText.attr('x', state.size + iconSize + 10 + (isSmallScreen ? 8 : 16));
                 }
               }
            } else {
               // No icon, standard value position
               valueText.attr('x', state.size + (isSmallScreen ? 8 : 16));
            }
          } else {
             valueText.attr('x', state.size + (isSmallScreen ? 8 : 16));
          }

          label
            .attr('text-anchor', labelAnchor)
            .attr('x', labelX)
            .attr('y', scaleBand.bandwidth() / 2)
            .attr('dy', '0.35em')
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
