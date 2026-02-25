import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { ChartConfig, DataPoint } from '../types';
import { formatNumber, getInterpolatedFrame } from '../utils';

interface RaceChartProps {
  config: ChartConfig;
  isPlaying: boolean;
  currentTimeIndex: number;
  onTimeIndexChange: (index: number) => void;
  speed: number;
}

export default function RaceChart({ config, isPlaying, currentTimeIndex, onTimeIndexChange, speed }: RaceChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 });
  
  // Persistent D3 selections
  const gRef = useRef<d3.Selection<SVGGElement, unknown, null, undefined> | null>(null);
  const xAxisGRef = useRef<d3.Selection<SVGGElement, unknown, null, undefined> | null>(null);
  const dateLabelRef = useRef<d3.Selection<SVGTextElement, unknown, null, undefined> | null>(null);
  const headerRef = useRef<d3.Selection<SVGGElement, unknown, null, undefined> | null>(null);

  // Group data by date
  const dateGroups = useMemo(() => {
    const filteredData = config.entityFilter 
      ? config.data.filter(d => d.entity === config.entityFilter)
      : config.data;

    const groups = d3.group(filteredData, d => d.date);
    const dates = Array.from(groups.keys()).sort();
    
    return dates.map(date => {
      const values = (groups.get(date) || []) as DataPoint[];
      return {
        date,
        values: values.sort((a, b) => d3.descending(a.value, b.value))
      };
    });
  }, [config.data, config.entityFilter]);

  useEffect(() => {
    const observer = new ResizeObserver(entries => {
      if (entries[0]) {
        const { width, height } = entries[0].contentRect;
        setDimensions({ width, height });
      }
    });
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    return () => observer.disconnect();
  }, []);

  // Initial SVG Setup
  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // Clear once on setup

    const defs = svg.append('defs');
    const filter = defs.append('filter')
      .attr('id', 'motionBlur')
      .attr('x', '-20%')
      .attr('y', '-20%')
      .attr('width', '140%')
      .attr('height', '140%');
    
    filter.append('feGaussianBlur')
      .attr('in', 'SourceGraphic')
      .attr('stdDeviation', '0 0'); // Controlled dynamically

    const margin = { top: 80, right: 100, bottom: 40, left: 140 };
    
    gRef.current = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    xAxisGRef.current = gRef.current.append('g').attr('class', 'x-axis');

    headerRef.current = svg.append('g').attr('transform', `translate(${margin.left}, 30)`);
    
    dateLabelRef.current = svg.append('text')
      .attr('font-size', '80px')
      .attr('font-weight', '900')
      .attr('text-anchor', 'end')
      .attr('font-family', config.fontFamily);

  }, [config.fontFamily]);

  // State for smooth overtaking
  const barStatesRef = useRef(new Map<string, { y: number, width: number, value: number }>());

  // Update loop
  useEffect(() => {
    if (!gRef.current || !xAxisGRef.current || !dateLabelRef.current || !headerRef.current || dateGroups.length === 0) return;

    const margin = { top: 80, right: 100, bottom: 40, left: 140 };
    const innerWidth = dimensions.width - margin.left - margin.right;
    const innerHeight = dimensions.height - margin.top - margin.bottom;

    const x = d3.scaleLinear().range([0, innerWidth]);
    const y = d3.scaleBand().range([0, innerHeight]).padding(0.1);

    const renderFrame = (index: number) => {
      // Update static elements
      d3.select('#motionBlur feGaussianBlur')
        .attr('stdDeviation', isPlaying ? '1.5 0' : '0 0');

      headerRef.current!.selectAll('*').remove();
      headerRef.current!.append('text')
        .attr('font-size', '32px')
        .attr('font-weight', '800')
        .attr('letter-spacing', '-0.02em')
        .attr('fill', config.theme === 'dark' ? '#ffffff' : '#09090b')
        .attr('font-family', config.fontFamily)
        .text(config.title);

      headerRef.current!.append('text')
        .attr('y', 28)
        .attr('font-size', '16px')
        .attr('font-weight', '500')
        .attr('fill', config.theme === 'dark' ? '#a1a1aa' : '#71717a')
        .attr('font-family', config.fontFamily)
        .text(config.subtitle);

      dateLabelRef.current!
        .attr('x', dimensions.width - 40)
        .attr('y', dimensions.height - 40)
        .attr('font-size', '96px')
        .attr('font-weight', '900')
        .attr('letter-spacing', '-0.05em')
        .attr('text-anchor', 'end')
        .attr('fill', config.theme === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.06)')
        .attr('font-family', config.fontFamily);

      const currentData = getInterpolatedFrame(dateGroups, index);
      const displayData = currentData
        .sort((a, b) => d3.descending(a.value, b.value))
        .slice(0, config.maxBars);

      const g = gRef.current!;

      if (config.type === 'stacked') {
        const total = d3.sum(displayData, d => d.value);
        let offset = 0;
        const stackedData = displayData.map(d => {
          const start = offset;
          const width = (d.value / total) * innerWidth;
          offset += width;
          return { ...d, start, width };
        });

        x.domain([0, total]);
        y.domain(['stacked']);

        xAxisGRef.current!.style('display', 'none');

        const lerpFactor = 0.15;
        const barStates = barStatesRef.current;

        const bars = g.selectAll<SVGGElement, any>('.bar-group').data(stackedData, d => d.name);
        
        const barsEnter = bars.enter()
          .append('g')
          .attr('class', 'bar-group')
          .attr('style', 'will-change: transform;')
          .attr('transform', d => {
             barStates.set(d.name, { y: 0, width: d.width, value: d.start });
             return `translate(${d.start}, 0)`;
          });

        barsEnter.append('rect')
          .attr('class', 'bar-rect')
          .attr('height', innerHeight)
          .attr('fill', d => config.colors[d.name] || '#ccc')
          .attr('width', d => d.width);

        barsEnter.append('text')
          .attr('class', 'label')
          .attr('y', innerHeight / 2)
          .attr('text-anchor', 'middle')
          .attr('fill', '#fff')
          .attr('font-size', '12px')
          .attr('font-weight', 'bold')
          .attr('x', d => d.width / 2)
          .text(d => d.width > 40 ? d.name : '');

        const barsUpdate = bars.merge(barsEnter);

        barsUpdate.each(function(d) {
          const targetStart = d.start;
          const targetWidth = d.width;
          
          let state = barStates.get(d.name);
          if (!state) {
            state = { y: 0, width: targetWidth, value: targetStart };
            barStates.set(d.name, state);
          }

          state.value += (targetStart - state.value) * lerpFactor;
          state.width += (targetWidth - state.width) * lerpFactor;

          const group = d3.select(this);
          group.attr('transform', `translate(${state.value}, 0)`);
          
          group.select('.bar-rect')
            .attr('width', state.width);

          group.select('.label')
            .attr('x', state.width / 2)
            .text(state.width > 40 ? d.name : '');
        });

        bars.exit().remove();

      } else {
        xAxisGRef.current!.style('display', null);
        x.domain([0, d3.max(displayData, d => d.value) as number || 1]);
        y.domain(displayData.map(d => d.name));

        xAxisGRef.current!.call(d3.axisTop(x).ticks(innerWidth / 100).tickSize(-innerHeight))
          .call(g => g.select('.domain').remove())
          .call(g => g.selectAll('.tick line').attr('stroke', config.theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)').attr('stroke-dasharray', '4,4'))
          .call(g => g.selectAll('.tick text').attr('fill', config.theme === 'dark' ? '#a1a1aa' : '#71717a').attr('font-family', config.fontFamily).attr('font-weight', '500').attr('dy', '-0.5em'));

        const lerpFactor = 0.15; // Smooth spring physics
        const barStates = barStatesRef.current;

        const bars = g.selectAll<SVGGElement, DataPoint>('.bar-group').data(displayData, d => d.name);
        
        const barsEnter = bars.enter()
          .append('g')
          .attr('class', 'bar-group')
          .attr('style', 'will-change: transform;')
          .attr('transform', d => {
             const targetY = y(d.name) || 0;
             barStates.set(d.name, { y: targetY, width: x(d.value), value: d.value });
             return `translate(0, ${targetY})`;
          });

        barsEnter.append('rect')
          .attr('class', 'bar-rect')
          .attr('rx', 6)
          .attr('height', y.bandwidth())
          .attr('fill', d => config.colors[d.name] || '#ccc')
          .attr('width', d => x(d.value))
          .attr('style', 'filter: drop-shadow(0 4px 6px rgba(0,0,0,0.1));');

        barsEnter.append('text')
          .attr('class', 'label')
          .attr('text-anchor', 'end')
          .attr('dx', -16)
          .attr('fill', config.theme === 'dark' ? '#ffffff' : '#09090b')
          .attr('font-family', config.fontFamily)
          .attr('font-weight', '700')
          .attr('letter-spacing', '-0.01em')
          .attr('y', y.bandwidth() / 2)
          .attr('dy', '0.35em')
          .text(d => d.name);

        barsEnter.append('text')
          .attr('class', 'value')
          .attr('dx', 16)
          .attr('fill', config.theme === 'dark' ? '#ffffff' : '#09090b')
          .attr('font-family', config.fontFamily)
          .attr('font-weight', '800')
          .attr('letter-spacing', '-0.02em')
          .attr('y', y.bandwidth() / 2)
          .attr('dy', '0.35em')
          .text(d => formatNumber(d.value));

        const barsUpdate = bars.merge(barsEnter);

        barsUpdate.each(function(d) {
          const targetY = y(d.name) || 0;
          const targetWidth = x(d.value);
          
          let state = barStates.get(d.name);
          if (!state) {
            state = { y: targetY, width: targetWidth, value: d.value };
            barStates.set(d.name, state);
          }

          // Lerp for smooth overtaking and width changes
          state.y += (targetY - state.y) * lerpFactor;
          state.width += (targetWidth - state.width) * lerpFactor;
          state.value = d.value;

          const group = d3.select(this);
          
          // Use transform for high performance
          group.attr('transform', `translate(0, ${state.y})`);
          
          const isOvertaking = Math.abs(targetY - state.y) > 2;
          
          // Z-index sorting: bring overtaking bars to front
          if (isOvertaking) {
            this.parentNode?.appendChild(this);
          }

          group.select('.bar-rect')
            .attr('width', state.width)
            .attr('filter', isOvertaking ? 'url(#motionBlur)' : null)
            .attr('stroke', isOvertaking ? (config.theme === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)') : 'none')
            .attr('stroke-width', isOvertaking ? 2 : 0);

          group.select('.value')
            .attr('x', state.width)
            .text(formatNumber(state.value));
        });

        bars.exit().remove();
      }

      const floorIndex = Math.floor(index);
      dateLabelRef.current!.text(dateGroups[floorIndex]?.date || '');
    };

    const handleTimeUpdate = (e: Event) => {
      const index = (e as CustomEvent).detail;
      renderFrame(index);
    };

    window.addEventListener('time-update', handleTimeUpdate);
    renderFrame(currentTimeIndex); // Initial render

    return () => {
      window.removeEventListener('time-update', handleTimeUpdate);
    };

  }, [dimensions, dateGroups, config]); // Removed isPlaying and currentTimeIndex

  return (
    <div ref={containerRef} className="w-full h-full min-h-[500px] bg-[#ffffff] dark:bg-[#020202] rounded-[2rem] overflow-hidden relative shadow-2xl border border-zinc-200 dark:border-white/5 transition-all duration-500 group">
      {/* Cinematic Grid Background */}
      <div className="absolute inset-0 pointer-events-none opacity-40 dark:opacity-20" style={{
        backgroundImage: `
          linear-gradient(to right, ${config.theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'} 1px, transparent 1px),
          linear-gradient(to bottom, ${config.theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'} 1px, transparent 1px),
          linear-gradient(to right, ${config.theme === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)'} 1px, transparent 1px),
          linear-gradient(to bottom, ${config.theme === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)'} 1px, transparent 1px)
        `,
        backgroundSize: '100px 100px, 100px 100px, 20px 20px, 20px 20px'
      }}></div>

      {/* Vignette Effect */}
      <div className="absolute inset-0 pointer-events-none bg-radial-[at_50%_50%] from-transparent via-transparent to-black/5 dark:to-black/40"></div>
      
      {/* 16:9 Aspect Ratio Enforcer for Preview */}
      <div className="absolute top-6 right-6 flex items-center gap-3 z-10">
        <div className="bg-white/80 dark:bg-black/60 backdrop-blur-xl text-zinc-900 dark:text-white/90 text-[10px] font-bold tracking-widest px-4 py-2 rounded-full border border-zinc-200/50 dark:border-white/10 flex items-center gap-2.5 shadow-2xl transition-all group-hover:scale-105">
          <div className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]' : 'bg-zinc-400'}`}></div>
          MASTER PREVIEW • 60 FPS
        </div>
      </div>

      {/* Bottom Status Bar */}
      <div className="absolute bottom-6 left-6 flex items-center gap-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="bg-black/40 backdrop-blur-md px-3 py-1 rounded-md border border-white/5 text-[9px] font-mono text-white/40 uppercase tracking-tighter">
          Bitrate: 12.4 Mbps
        </div>
        <div className="bg-black/40 backdrop-blur-md px-3 py-1 rounded-md border border-white/5 text-[9px] font-mono text-white/40 uppercase tracking-tighter">
          Codec: H.264
        </div>
      </div>
      
      <svg ref={svgRef} width="100%" height="100%" viewBox={`0 0 ${dimensions.width} ${dimensions.height}`} preserveAspectRatio="xMidYMid meet" className="block relative z-0" />
      {config.watermarkUrl && (
        <img 
          src={config.watermarkUrl} 
          alt="watermark" 
          className="absolute bottom-6 left-6 h-10 opacity-20 pointer-events-none grayscale" 
        />
      )}
      <div className="absolute top-6 right-6 px-3 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-full text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
        16:9 • 1080p Preview
      </div>
    </div>
  );
}
