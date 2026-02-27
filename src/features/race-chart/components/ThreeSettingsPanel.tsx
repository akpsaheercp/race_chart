import React, { useState } from 'react';
import { 
  Box, 
  RotateCw, 
  Grid, 
  Camera, 
  Zap, 
  Layers,
  ChevronDown,
  ChevronRight,
  Maximize,
  Monitor
} from 'lucide-react';
import { ChartConfig } from '../../../types';

interface ThreeSettingsPanelProps {
  config: ChartConfig;
  onConfigChange: (config: ChartConfig) => void;
}

export default function ThreeSettingsPanel({ config, onConfigChange }: ThreeSettingsPanelProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>('types');

  const handleChange = (key: keyof ChartConfig, value: any) => {
    onConfigChange({ ...config, [key]: value });
  };

  const toggleSection = (section: string) => {
    setExpandedSection(prev => prev === section ? null : section);
  };

  const threeTypes = [
    { id: 'bar-3d', label: '3D Bar', description: 'Classic bars in 3D space' },
    { id: 'cylinder-3d', label: 'Cylinder', description: 'Circular cylinder race' },
    { id: 'bubble-3d', label: '3D Bubble', description: 'Floating 3D spheres' },
    { id: 'podium-3d', label: 'Podium', description: 'Top 3 winners podium' },
    { id: 'terrain-3d', label: 'Terrain', description: 'Data points on a 3D grid' },
    { id: 'spiral-3d', label: 'Spiral', description: 'Vortex spiral animation' },
  ] as const;

  const AccordionHeader = ({ id, title, icon: Icon }: { id: string, title: string, icon: any }) => (
    <button
      onClick={() => toggleSection(id)}
      className={`w-full flex items-center justify-between p-3.5 rounded-xl transition-all duration-200 ${
        expandedSection === id 
          ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400' 
          : 'bg-zinc-50 dark:bg-zinc-900/50 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 text-zinc-700 dark:text-zinc-300'
      }`}
    >
      <div className="flex items-center gap-3 font-medium text-sm">
        <Icon className={`w-4 h-4 ${expandedSection === id ? 'text-indigo-500' : 'text-zinc-400'}`} />
        {title}
      </div>
      {expandedSection === id ? (
        <ChevronDown className="w-4 h-4 opacity-50" />
      ) : (
        <ChevronRight className="w-4 h-4 opacity-50" />
      )}
    </button>
  );

  return (
    <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* 3D Chart Types */}
      <div className="space-y-1">
        <AccordionHeader id="types" title="3D Chart Types" icon={Layers} />
        {expandedSection === 'types' && (
          <div className="p-4 grid grid-cols-1 gap-2 border-x border-b border-zinc-100 dark:border-zinc-800/50 rounded-b-xl bg-white dark:bg-black/20">
            {threeTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => handleChange('type', type.id)}
                className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                  config.type === type.id
                    ? 'bg-indigo-500 border-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                    : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-700'
                }`}
              >
                <div className={`p-2 rounded-lg ${config.type === type.id ? 'bg-white/20' : 'bg-zinc-100 dark:bg-zinc-800'}`}>
                  <Box className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold">{type.label}</div>
                  <div className={`text-[10px] ${config.type === type.id ? 'text-white/70' : 'text-zinc-500'}`}>{type.description}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Camera & View */}
      <div className="space-y-1">
        <AccordionHeader id="camera" title="Camera & View" icon={Camera} />
        {expandedSection === 'camera' && (
          <div className="p-4 space-y-4 border-x border-b border-zinc-100 dark:border-zinc-800/50 rounded-b-xl bg-white dark:bg-black/20">
            <div className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg border border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <RotateCw className="w-4 h-4 text-zinc-400" />
                <div>
                  <div className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Auto-Rotate</div>
                  <div className="text-[10px] text-zinc-500">Slowly rotate the camera</div>
                </div>
              </div>
              <button
                onClick={() => handleChange('threeAutoRotate', !config.threeAutoRotate)}
                className={`w-10 h-5 rounded-full transition-all relative ${config.threeAutoRotate ? 'bg-indigo-500' : 'bg-zinc-300 dark:bg-zinc-700'}`}
              >
                <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${config.threeAutoRotate ? 'left-6' : 'left-1'}`} />
              </button>
            </div>

            <div className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg border border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <Grid className="w-4 h-4 text-zinc-400" />
                <div>
                  <div className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Show Grid</div>
                  <div className="text-[10px] text-zinc-500">Display floor grid helper</div>
                </div>
              </div>
              <button
                onClick={() => handleChange('threeShowGrid', !config.threeShowGrid)}
                className={`w-10 h-5 rounded-full transition-all relative ${config.threeShowGrid ? 'bg-indigo-500' : 'bg-zinc-300 dark:bg-zinc-700'}`}
              >
                <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${config.threeShowGrid ? 'left-6' : 'left-1'}`} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Engine & Quality */}
      <div className="space-y-1">
        <AccordionHeader id="engine" title="Engine & Quality" icon={Zap} />
        {expandedSection === 'engine' && (
          <div className="p-4 space-y-4 border-x border-b border-zinc-100 dark:border-zinc-800/50 rounded-b-xl bg-white dark:bg-black/20">
            <div>
              <label className="block text-[10px] font-bold text-zinc-400 dark:text-zinc-500 mb-2 uppercase tracking-wider">Rendering Quality</label>
              <div className="grid grid-cols-3 gap-2">
                {(['low', 'medium', 'high'] as const).map((q) => (
                  <button
                    key={q}
                    onClick={() => handleChange('threeQuality', q)}
                    className={`p-2 text-[10px] font-bold rounded-lg border transition-all uppercase ${
                      (config.threeQuality || 'medium') === q
                        ? 'bg-indigo-500 border-indigo-500 text-white shadow-md shadow-indigo-500/20'
                        : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'
                    }`}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg border border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <Monitor className="w-4 h-4 text-zinc-400" />
                <div>
                  <div className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Shadows</div>
                  <div className="text-[10px] text-zinc-500">Real-time soft shadows</div>
                </div>
              </div>
              <button
                onClick={() => handleChange('threeShadows', !config.threeShadows)}
                className={`w-10 h-5 rounded-full transition-all relative ${config.threeShadows !== false ? 'bg-indigo-500' : 'bg-zinc-300 dark:bg-zinc-700'}`}
              >
                <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${config.threeShadows !== false ? 'left-6' : 'left-1'}`} />
              </button>
            </div>

            <div className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg border border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <Maximize className="w-4 h-4 text-zinc-400" />
                <div>
                  <div className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Bloom Effect</div>
                  <div className="text-[10px] text-zinc-500">Glow on emissive materials</div>
                </div>
              </div>
              <button
                onClick={() => handleChange('threeBloom', !config.threeBloom)}
                className={`w-10 h-5 rounded-full transition-all relative ${config.threeBloom ? 'bg-indigo-500' : 'bg-zinc-300 dark:bg-zinc-700'}`}
              >
                <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${config.threeBloom ? 'left-6' : 'left-1'}`} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
