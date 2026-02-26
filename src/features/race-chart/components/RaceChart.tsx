import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { ChartConfig, DataPoint } from '../../../types';
import BarRace from './races/BarRace';
import LineRace from './races/LineRace';
import BubbleRace from './races/BubbleRace';
import PieRace from './races/PieRace';
import AreaRace from './races/AreaRace';

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
  
  const dateLabelRef = useRef<d3.Selection<SVGTextElement, unknown, null, undefined> | null>(null);
  const headerRef = useRef<d3.Selection<SVGGElement, unknown, null, undefined> | null>(null);

  const dateGroups = useMemo(() => {
    const filteredData = config.entityFilter 
      ? config.data.filter(d => d.entity === config.entityFilter)
      : config.data;

    const groups = d3.group(filteredData, d => d.date);
    const dates = Array.from(groups.keys()).sort((a, b) => {
      const valA = groups.get(a)?.[0]?.timestamp || 0;
      const valB = groups.get(b)?.[0]?.timestamp || 0;
      return valA - valB;
    });
    
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

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('.static-layer').remove();

    const defs = svg.append('defs').attr('class', 'static-layer');
    const filter = defs.append('filter')
      .attr('id', 'motionBlur')
      .attr('x', '-20%')
      .attr('y', '-20%')
      .attr('width', '140%')
      .attr('height', '140%');
    
    filter.append('feGaussianBlur')
      .attr('in', 'SourceGraphic')
      .attr('stdDeviation', '0 0');

    const margin = { top: 80, right: 100, bottom: 40, left: 140 };
    
    const staticLayer = svg.append('g').attr('class', 'static-layer');
    headerRef.current = staticLayer.append('g').attr('transform', `translate(${margin.left}, 30)`);
    
    dateLabelRef.current = staticLayer.append('text')
      .attr('font-size', '80px')
      .attr('font-weight', '900')
      .attr('text-anchor', 'end')
      .attr('font-family', config.fontFamily);

    // Create an empty overlay layer for race components to insert before
    svg.append('g').attr('class', 'overlay-layer static-layer');

  }, [config.fontFamily]);

  useEffect(() => {
    if (!dateLabelRef.current || !headerRef.current || dateGroups.length === 0) return;

    const renderStaticFrame = (index: number) => {
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

      if (config.caption) {
        headerRef.current!.append('text')
          .attr('y', 48)
          .attr('font-size', '11px')
          .attr('font-weight', '600')
          .attr('fill', config.theme === 'dark' ? '#52525b' : '#a1a1aa')
          .attr('font-family', config.fontFamily)
          .attr('text-transform', 'uppercase')
          .attr('letter-spacing', '0.05em')
          .text(config.caption);
      }

      dateLabelRef.current!
        .attr('x', dimensions.width - 40)
        .attr('y', dimensions.height - 40)
        .attr('font-size', dimensions.width < 600 ? '48px' : '96px')
        .attr('font-weight', '900')
        .attr('letter-spacing', '-0.05em')
        .attr('text-anchor', 'end')
        .attr('fill', config.theme === 'dark' ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.12)')
        .attr('font-family', config.fontFamily);

      const floorIndex = Math.floor(index);
      dateLabelRef.current!.text(dateGroups[floorIndex]?.date || '');
    };

    const handleTimeUpdate = (e: Event) => {
      const index = (e as CustomEvent).detail;
      renderStaticFrame(index);
    };

    window.addEventListener('time-update', handleTimeUpdate);
    renderStaticFrame(currentTimeIndex);

    return () => {
      window.removeEventListener('time-update', handleTimeUpdate);
    };
  }, [dimensions, dateGroups, config, isPlaying]);

  const raceProps = {
    svgRef,
    config,
    isPlaying,
    currentTimeIndex,
    dimensions,
    dateGroups
  };

  return (
    <div ref={containerRef} className={`w-full h-full min-h-[500px] rounded-[2rem] overflow-hidden relative shadow-2xl border transition-all duration-500 group ${
      config.theme === 'dark' 
        ? 'bg-[#020202] border-white/5' 
        : 'bg-white border-zinc-200'
    }`}>
      <div className="absolute inset-0 pointer-events-none opacity-40 dark:opacity-20" style={{
        backgroundImage: `
          linear-gradient(to right, ${config.theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'} 1px, transparent 1px),
          linear-gradient(to bottom, ${config.theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'} 1px, transparent 1px),
          linear-gradient(to right, ${config.theme === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)'} 1px, transparent 1px),
          linear-gradient(to bottom, ${config.theme === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)'} 1px, transparent 1px)
        `,
        backgroundSize: '100px 100px, 100px 100px, 20px 20px, 20px 20px'
      }}></div>

      <div className="absolute inset-0 pointer-events-none bg-radial-[at_50%_50%] from-transparent via-transparent to-black/5 dark:to-black/40"></div>
      
      <div className="absolute top-6 right-6 flex items-center gap-3 z-10">
        <div className={`backdrop-blur-xl text-[10px] font-bold tracking-widest px-4 py-2 rounded-full border flex items-center gap-2.5 shadow-2xl transition-all group-hover:scale-105 ${
          config.theme === 'dark'
            ? 'bg-black/60 text-white/90 border-white/10'
            : 'bg-white/90 text-zinc-900 border-zinc-200'
        }`}>
          <div className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]' : 'bg-zinc-400'}`}></div>
          MASTER PREVIEW • 60 FPS
        </div>
      </div>

      <div className="absolute bottom-6 left-6 flex items-center gap-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className={`backdrop-blur-md px-3 py-1 rounded-md border text-[9px] font-mono uppercase tracking-tighter ${
          config.theme === 'dark'
            ? 'bg-black/40 border-white/5 text-white/40'
            : 'bg-zinc-900/10 border-black/5 text-zinc-900/60'
        }`}>
          Bitrate: 12.4 Mbps
        </div>
        <div className={`backdrop-blur-md px-3 py-1 rounded-md border text-[9px] font-mono uppercase tracking-tighter ${
          config.theme === 'dark'
            ? 'bg-black/40 border-white/5 text-white/40'
            : 'bg-zinc-900/10 border-black/5 text-zinc-900/60'
        }`}>
          Codec: H.264
        </div>
      </div>
      
      <svg ref={svgRef} width="100%" height="100%" viewBox={`0 0 ${dimensions.width} ${dimensions.height}`} preserveAspectRatio="xMidYMid meet" className="block relative z-0" />
      
      {config.type === 'bar' && <BarRace {...raceProps} />}
      {config.type === 'line' && <LineRace {...raceProps} />}
      {config.type === 'bubble' && <BubbleRace {...raceProps} />}
      {config.type === 'pie' && <PieRace {...raceProps} />}
      {config.type === 'area' && <AreaRace {...raceProps} />}
      
      {config.watermarkUrl && (
        <img 
          src={config.watermarkUrl} 
          alt="watermark" 
          className="absolute bottom-6 right-6 h-10 opacity-20 pointer-events-none grayscale" 
        />
      )}
    </div>
  );
}
