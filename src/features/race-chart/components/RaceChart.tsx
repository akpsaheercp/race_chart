import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { ChartConfig, DataPoint } from '../../../types';
import BarRace from './races/BarRace';
import LineRace from './races/LineRace';
import BubbleRace from './races/BubbleRace';
import PieRace from './races/PieRace';
import AreaRace from './races/AreaRace';
import MapRace from './races/MapRace';
import TreemapRace from './races/TreemapRace';
import RadialRace from './races/RadialRace';
import BumpRace from './races/BumpRace';
import StackedAreaRace from './races/StackedAreaRace';
import ScatterRace from './races/ScatterRace';
import SpiralRace from './races/SpiralRace';
import NetworkRace from './races/NetworkRace';

import { Maximize } from 'lucide-react';
import { 
  ThreeSetup, 
  ThreeAnimationBridge, 
  Bar3DRace, 
  Cylinder3DRace, 
  Bubble3DRace, 
  Podium3DRace, 
  Terrain3DRace, 
  Spiral3DRace 
} from '../../../3d';

interface RaceChartProps {
  config: ChartConfig;
  isPlaying: boolean;
  currentTimeIndex: number;
  onTimeIndexChange: (index: number) => void;
  speed: number;
}

export const RaceChart = React.forwardRef<SVGSVGElement, RaceChartProps>(({ config, isPlaying, currentTimeIndex, onTimeIndexChange, speed }, ref) => {
  const internalSvgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const threeContainerRef = useRef<HTMLDivElement>(null);
  const threeSetupRef = useRef<ThreeSetup | null>(null);
  const threeBridgeRef = useRef<ThreeAnimationBridge | null>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 });
  const [isThreeLoading, setIsThreeLoading] = useState(false);

  const dateGroups = useMemo(() => {
    const filteredData = config.entityFilter 
      ? config.data.filter(d => d.entity === config.entityFilter)
      : config.data;

    const groups = d3.group(filteredData, (d: DataPoint) => d.date);
    const dates = Array.from(groups.keys()).sort((a, b) => {
      const valA = (groups.get(a)?.[0] as any)?.timestamp || 0;
      const valB = (groups.get(b)?.[0] as any)?.timestamp || 0;
      return valA - valB;
    });
    
    return dates.map(date => {
      const values = (groups.get(date) || []) as DataPoint[];
      return {
        date: date as string,
        values: values.sort((a, b) => d3.descending(a.value, b.value))
      };
    });
  }, [config.data, config.entityFilter]);
  
  const is3D = config.type.endsWith('-3d');

  useEffect(() => {
    if (is3D && threeContainerRef.current && !threeSetupRef.current) {
      setIsThreeLoading(true);
      // Small delay to show loading screen
      setTimeout(() => {
        const setup = new ThreeSetup({
          container: threeContainerRef.current!,
          theme: config.theme,
          antialias: config.threeQuality !== 'low',
          shadows: config.threeShadows !== false
        });
        setup.startAnimation();
        threeSetupRef.current = setup;
        threeBridgeRef.current = new ThreeAnimationBridge(setup);
        setIsThreeLoading(false);
      }, 500);
    }

    return () => {
      if (threeSetupRef.current) {
        threeSetupRef.current.dispose();
        threeSetupRef.current = null;
      }
      if (threeBridgeRef.current) {
        threeBridgeRef.current.dispose();
        threeBridgeRef.current = null;
      }
    };
  }, [is3D]);

  // Update 3D Chart when type or config changes
  useEffect(() => {
    if (is3D && threeSetupRef.current && threeBridgeRef.current) {
      let chart;
      switch (config.type) {
        case 'bar-3d': chart = new Bar3DRace(threeSetupRef.current.scene, config, dateGroups); break;
        case 'cylinder-3d': chart = new Cylinder3DRace(threeSetupRef.current.scene, config, dateGroups); break;
        case 'bubble-3d': chart = new Bubble3DRace(threeSetupRef.current.scene, config, dateGroups); break;
        case 'podium-3d': chart = new Podium3DRace(threeSetupRef.current.scene, config, dateGroups); break;
        case 'terrain-3d': chart = new Terrain3DRace(threeSetupRef.current.scene, config, dateGroups); break;
        case 'spiral-3d': chart = new Spiral3DRace(threeSetupRef.current.scene, config, dateGroups); break;
      }
      if (chart) {
        threeBridgeRef.current.setChart(chart);
      }
    }
  }, [config.type, is3D, dateGroups, config.theme]);

  // Update 3D Theme
  useEffect(() => {
    if (threeSetupRef.current) {
      threeSetupRef.current.updateTheme(config.theme);
    }
  }, [config.theme]);

  // Update 3D Auto-Rotate
  useEffect(() => {
    if (threeSetupRef.current && threeSetupRef.current.controls) {
      threeSetupRef.current.controls.autoRotate = !!config.threeAutoRotate;
    }
  }, [config.threeAutoRotate]);

  React.useImperativeHandle(ref, () => internalSvgRef.current!);
  
  const dateLabelRef = useRef<d3.Selection<SVGTextElement, unknown, null, undefined> | null>(null);
  const headerRef = useRef<d3.Selection<SVGGElement, unknown, null, undefined> | null>(null);

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
    if (!internalSvgRef.current) return;

    const svg = d3.select(internalSvgRef.current);
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

    // Global Dot Pattern for all charts
    const pattern = defs.append('pattern')
      .attr('id', `globalDotPattern-${config.id}`)
      .attr('patternUnits', 'userSpaceOnUse')
      .attr('width', 6)
      .attr('height', 6);

    pattern.append('rect')
      .attr('width', 6)
      .attr('height', 6)
      .attr('fill', config.theme === 'dark' ? '#000' : '#fff')
      .attr('fill-opacity', 0); // Transparent background

    pattern.append('circle')
      .attr('cx', 3)
      .attr('cy', 3)
      .attr('r', 1.5)
      .attr('fill', config.theme === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)');

    const isSmallScreen = dimensions.width < 600;
    const margin = isSmallScreen 
      ? { top: 60, right: 20, bottom: 40, left: config.showLabels ? 90 : 20 } 
      : { top: 80, right: 100, bottom: 40, left: config.showLabels ? 140 : 20 };
    
    const staticLayer = svg.append('g').attr('class', 'static-layer');
    headerRef.current = staticLayer.append('g').attr('transform', `translate(${margin.left}, ${isSmallScreen ? 20 : 30})`);
    
    dateLabelRef.current = staticLayer.append('text')
      .attr('font-size', isSmallScreen ? '48px' : '80px')
      .attr('font-weight', '900')
      .attr('text-anchor', 'end')
      .attr('font-family', config.fontFamily);

    // Create an empty overlay layer for race components to insert before
    svg.append('g').attr('class', 'overlay-layer static-layer');

  }, [config.fontFamily]);

  // Legend Rendering
  useEffect(() => {
    if (!internalSvgRef.current) return;
    const svg = d3.select(internalSvgRef.current);
    
    // Clear existing legend
    svg.select('.legend-layer').remove();

    if (!config.showLegend) return;

    const legendG = svg.append('g')
      .attr('class', 'legend-layer');

    const uniqueEntities = Array.from(new Set(config.data.map(d => d.name))).sort() as string[];
    const itemHeight = 20;
    const itemSpacing = 5;
    const symbolSize = 12;
    
    // Position logic
    let x = 20;
    let y = 20;
    
    const isRight = config.legendPosition.includes('right');
    const isBottom = config.legendPosition.includes('bottom');
    
    if (isRight) {
       x = dimensions.width - 150; // Approximate width
    }
    
    if (isBottom) {
       y = dimensions.height - (uniqueEntities.length * (itemHeight + itemSpacing)) - 40;
    } else {
       y = 100; // Below header
    }

    legendG.attr('transform', `translate(${x}, ${y})`);
    
    // Background for legend to make it readable
    if (uniqueEntities.length > 0) {
      const padding = 10;
      const legendHeight = uniqueEntities.length * (itemHeight + itemSpacing) + padding;
      const legendWidth = 140; // Approx
      
      legendG.append('rect')
        .attr('x', -padding)
        .attr('y', -padding)
        .attr('width', legendWidth)
        .attr('height', legendHeight)
        .attr('rx', 8)
        .attr('fill', config.theme === 'dark' ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.8)')
        .attr('stroke', config.theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)');
    }

    uniqueEntities.forEach((entity: string, i: number) => {
      const g = legendG.append('g')
        .attr('transform', `translate(0, ${i * (itemHeight + itemSpacing)})`);
        
      const color = config.entitySettings?.[entity]?.color || config.colors[entity] || '#ccc';
      
      g.append('rect')
        .attr('width', symbolSize)
        .attr('height', symbolSize)
        .attr('rx', 2)
        .attr('fill', color);
        
      g.append('text')
        .attr('x', symbolSize + 8)
        .attr('y', symbolSize / 2)
        .attr('dy', '0.35em')
        .attr('fill', config.theme === 'dark' ? '#fff' : '#000')
        .attr('font-family', config.fontFamily)
        .attr('font-size', '12px')
        .attr('font-weight', '500')
        .text(entity);
    });

  }, [config.showLegend, config.legendPosition, config.data, config.colors, config.entitySettings, dimensions, config.theme, config.fontFamily]);

  useEffect(() => {
    if (!dateLabelRef.current || !headerRef.current || dateGroups.length === 0) return;

    const renderStaticFrame = (index: number) => {
      const isSmallScreen = dimensions.width < 600;

      d3.select('#motionBlur feGaussianBlur')
        .attr('stdDeviation', isPlaying ? '1.5 0' : '0 0');

      headerRef.current!.selectAll('*').remove();
      headerRef.current!.append('text')
        .attr('font-size', isSmallScreen ? '20px' : '32px')
        .attr('font-weight', '800')
        .attr('letter-spacing', '-0.02em')
        .attr('fill', config.theme === 'dark' ? '#ffffff' : '#09090b')
        .attr('font-family', config.fontFamily)
        .text(config.title);

      headerRef.current!.append('text')
        .attr('y', isSmallScreen ? 18 : 28)
        .attr('font-size', isSmallScreen ? '12px' : '16px')
        .attr('font-weight', '500')
        .attr('fill', config.theme === 'dark' ? '#a1a1aa' : '#71717a')
        .attr('font-family', config.fontFamily)
        .text(config.subtitle);

      if (config.caption) {
        headerRef.current!.append('text')
          .attr('y', isSmallScreen ? 32 : 48)
          .attr('font-size', isSmallScreen ? '9px' : '11px')
          .attr('font-weight', '600')
          .attr('fill', config.theme === 'dark' ? '#52525b' : '#a1a1aa')
          .attr('font-family', config.fontFamily)
          .attr('text-transform', 'uppercase')
          .attr('letter-spacing', '0.05em')
          .text(config.caption);
      }

      dateLabelRef.current!
        .attr('x', dimensions.width - (isSmallScreen ? 20 : 40))
        .attr('y', dimensions.height - (isSmallScreen ? 20 : 40))
        .attr('font-size', isSmallScreen ? '48px' : '96px')
        .attr('font-weight', '900')
        .attr('letter-spacing', '-0.05em')
        .attr('text-anchor', 'end')
        .attr('fill', config.dateColor || (config.theme === 'dark' ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.12)'))
        .attr('stroke', config.dateBorderWidth ? (config.dateBorderColor || '#000') : 'none')
        .attr('stroke-width', config.dateBorderWidth || 0)
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
    svgRef: internalSvgRef,
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
      
      <svg ref={internalSvgRef} width="100%" height="100%" viewBox={`0 0 ${dimensions.width} ${dimensions.height}`} preserveAspectRatio="xMidYMid meet" className={`block relative z-0 ${is3D ? 'pointer-events-none' : ''}`} />
      
      {is3D && (
        <div className="absolute top-6 right-6 z-20 flex flex-col gap-2">
          <button 
            onClick={() => threeSetupRef.current?.fitCameraToScene(1.5)}
            className={`p-2 rounded-full backdrop-blur-md border transition-all hover:scale-110 active:scale-95 ${
              config.theme === 'dark' 
                ? 'bg-black/40 border-white/10 text-white/60 hover:text-white hover:bg-black/60' 
                : 'bg-white/40 border-black/10 text-black/60 hover:text-black hover:bg-white/60'
            }`}
            title="Fit View"
          >
            <Maximize size={18} />
          </button>
        </div>
      )}

      {is3D && (
        <div 
          ref={threeContainerRef} 
          className="absolute inset-0 z-0"
          style={{ cursor: 'grab' }}
        />
      )}

      {isThreeLoading && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md">
          <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-4"></div>
          <div className="text-white font-bold tracking-widest text-sm animate-pulse">INITIALIZING 3D ENGINE...</div>
          <div className="text-white/40 text-[10px] mt-2 font-mono uppercase">Three.js r128 • WebGL 1.0</div>
        </div>
      )}
      
      {config.type === 'bar' && <BarRace {...raceProps} />}
      {config.type === 'line' && <LineRace {...raceProps} />}
      {config.type === 'bubble' && <BubbleRace {...raceProps} />}
      {config.type === 'pie' && <PieRace {...raceProps} />}
      {config.type === 'area' && <AreaRace {...raceProps} />}
      {config.type === 'map' && <MapRace {...raceProps} />}
      {config.type === 'treemap' && <TreemapRace {...raceProps} />}
      {config.type === 'radial' && <RadialRace {...raceProps} />}
      {config.type === 'bump' && <BumpRace {...raceProps} />}
      {config.type === 'stacked-area' && <StackedAreaRace {...raceProps} />}
      {config.type === 'scatter' && <ScatterRace {...raceProps} />}
      {config.type === 'spiral' && <SpiralRace {...raceProps} />}
      {config.type === 'network' && <NetworkRace {...raceProps} />}
      
      {config.watermarkUrl && (
        <img 
          src={config.watermarkUrl} 
          alt="watermark" 
          className="absolute bottom-6 right-6 h-10 opacity-20 pointer-events-none grayscale" 
        />
      )}
    </div>
  );
});

export default RaceChart;
