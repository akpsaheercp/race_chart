import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { RaceProps } from './types';
import { formatNumber } from '../../../../shared/utils/formatters';
import { getInterpolatedFrame } from '../../../../core/dataProcessor';
import { feature } from 'topojson-client';

// Simple world map GeoJSON URL or import
// For this example, we'll fetch a low-res world map
const WORLD_ATLAS_URL = 'https://unpkg.com/world-atlas@2.0.2/countries-110m.json';

export default function MapRace({ svgRef, config, isPlaying, currentTimeIndex, dimensions, dateGroups }: RaceProps) {
  const gRef = useRef<d3.Selection<SVGGElement, unknown, null, undefined> | null>(null);
  const mapDataRef = useRef<any>(null);
  const mapStatesRef = useRef(new Map<string, { value: number, vv: number }>());

  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    
    svg.selectAll('.race-layer').remove();

    const margin = { top: 80, right: 20, bottom: 40, left: 20 };
    const innerWidth = dimensions.width - margin.left - margin.right;
    const innerHeight = dimensions.height - margin.top - margin.bottom;
    
    const layer = svg.insert('g', '.overlay-layer')
      .attr('class', 'race-layer')
      .attr('transform', `translate(${margin.left},${margin.top})`);
      
    // Add Dot Pattern Mask Definition
    const defs = layer.append('defs');
    const maskId = `dotMask-map-${config.id}`;
    const patternId = `dotPattern-map-${config.id}`;
    
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

    // Fetch map data if not already loaded
    if (!mapDataRef.current) {
      d3.json(WORLD_ATLAS_URL).then((data: any) => {
        mapDataRef.current = feature(data, data.objects.countries);
        // Trigger a re-render or just let the next frame handle it
      });
    }

    return () => {
      layer.remove();
    };
  }, [config.fontFamily, dimensions]);

  useEffect(() => {
    if (!gRef.current || dateGroups.length === 0) return;

    // If map data isn't loaded yet, we can't render
    if (!mapDataRef.current) return;

    const margin = { top: 80, right: 20, bottom: 40, left: 20 };
    const innerWidth = dimensions.width - margin.left - margin.right;
    const innerHeight = dimensions.height - margin.top - margin.bottom;

    // Define projection
    // Fit to extent
    const projection = d3.geoMercator()
      .fitSize([innerWidth, innerHeight], mapDataRef.current);
      
    const pathGenerator = d3.geoPath().projection(projection);

    const renderFrame = (index: number) => {
      const currentData = getInterpolatedFrame(dateGroups, index);
      // Map data by country name for easy lookup
      const dataMap = new Map(currentData.map(d => [d.name, d.value]));
      
      const maxVal = d3.max(currentData, d => d.value) || 1;
      
      // Color scale
      const colorScale = d3.scaleSequential(d3.interpolateInferno)
        .domain([0, maxVal]);

      const g = gRef.current!;

      // Draw Map
      // We bind map features to paths
      const countries = g.selectAll<SVGPathElement, any>('.country')
        .data(mapDataRef.current.features, (d: any) => d.properties.name);

      const countriesEnter = countries.enter()
        .append('path')
        .attr('class', 'country')
        .attr('d', pathGenerator as any)
        .attr('stroke', config.theme === 'dark' ? '#333' : '#fff')
        .attr('stroke-width', 0.5)
        .attr('fill', config.theme === 'dark' ? '#1a1a1a' : '#e5e5e5');

      const countriesUpdate = countries.merge(countriesEnter);

      // Update colors based on value
      countriesUpdate.each(function(d: any) {
        const countryName = d.properties.name;
        // Try to match data name to map name (simple match for now)
        // In a real app, we'd need a robust name mapping or ISO codes
        
        // Let's try to find a matching entry in our data
        // We might need to fuzzy match or check aliases
        // For this demo, we assume names match or user provides ISO codes if map uses them.
        // The world-atlas uses names in properties.name usually.
        
        // Let's look for exact match first
        let value = dataMap.get(countryName);
        
        // If not found, try to find in data keys if they contain the country name
        if (value === undefined) {
           // Reverse check: does data have "United States of America" when map has "United States"?
           // Or data "USA" vs map "United States of America"?
           // Simple alias check for common ones
           if (countryName === 'United States of America' && dataMap.has('USA')) value = dataMap.get('USA');
           else if (countryName === 'China' && dataMap.has('PRC')) value = dataMap.get('PRC');
           // Add more aliases as needed
        }

        const node = d3.select(this);
        
        if (value !== undefined) {
            // Interpolate value for smooth color transition
            let state = mapStatesRef.current.get(countryName);
            if (!state) {
                state = { value: value, vv: 0 };
                mapStatesRef.current.set(countryName, state);
            }
            
            const stiffness = 0.1;
            const damping = 0.8;
            state.vv = (state.vv + (value - state.value) * stiffness) * damping;
            state.value += state.vv;
            
            node.attr('fill', colorScale(state.value))
                .attr('mask', config.barStyle === 'dots' ? `url(#dotMask-map-${config.id})` : null);
            if (config.barStyle === 'dots') {
                node.attr('stroke', colorScale(state.value))
                    .attr('stroke-width', 1);
            } else {
                node.attr('stroke', config.theme === 'dark' ? '#333' : '#fff')
                    .attr('stroke-width', 0.5);
            }
            
            // Optional: Add tooltip or label?
            // For a race, maybe just color is enough, or we add bubbles on top?
            // "implement the race animation in map" -> usually means choropleth or bubbles.
            // Let's stick to choropleth (color) for now as it's "map race".
        } else {
            node.attr('fill', config.theme === 'dark' ? '#1a1a1a' : '#e5e5e5');
        }
      });
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
  }, [dimensions, dateGroups, config, mapDataRef.current]); // Depend on mapDataRef.current

  return null;
}
