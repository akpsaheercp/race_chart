import React from 'react';
import { Users, Layout, Image as ImageIcon } from 'lucide-react';
import { ChartConfig } from '../../../types';

interface EntityPanelProps {
  config: ChartConfig;
  onConfigChange: (config: ChartConfig) => void;
}

export default function EntityPanel({ config, onConfigChange }: EntityPanelProps) {
  const handleChange = (key: keyof ChartConfig, value: any) => {
    onConfigChange({ ...config, [key]: value });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
          <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div>
          <h3 className="font-bold text-zinc-900 dark:text-zinc-100">Entity Settings</h3>
          <p className="text-xs text-zinc-500">Customize appearance for each entity</p>
        </div>
      </div>

      {/* Legend Settings */}
      <div className="p-3 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg border border-zinc-200 dark:border-zinc-800 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Show Legend</div>
            <div className="text-[10px] text-zinc-500">Display color legend on chart</div>
          </div>
          <button
            onClick={() => handleChange('showLegend', !config.showLegend)}
            className={`w-10 h-5 rounded-full transition-all relative ${config.showLegend ? 'bg-indigo-500' : 'bg-zinc-300 dark:bg-zinc-700'}`}
          >
            <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${config.showLegend ? 'left-6' : 'left-1'}`} />
          </button>
        </div>
        
        {config.showLegend && (
          <div>
            <label className="block text-[10px] font-bold text-zinc-400 dark:text-zinc-500 mb-1.5 uppercase tracking-wider">Position</label>
            <select
              value={config.legendPosition}
              onChange={(e) => handleChange('legendPosition', e.target.value)}
              className="w-full p-2 text-xs border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 outline-none"
            >
              <option value="top-left">Top Left</option>
              <option value="top-right">Top Right</option>
              <option value="bottom-left">Bottom Left</option>
              <option value="bottom-right">Bottom Right</option>
            </select>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <label className="block text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider sticky top-0 bg-white dark:bg-[#18181b] z-10 py-1">Entities ({Array.from(new Set(config.data.map(d => d.name))).length})</label>
        {Array.from(new Set(config.data.map(d => d.name))).sort().map(entityName => {
          const settings = config.entitySettings?.[entityName] || {};
          return (
            <div key={entityName} className="p-3 bg-zinc-50 dark:bg-zinc-900/30 rounded-lg border border-zinc-100 dark:border-zinc-800/50 hover:border-indigo-500/30 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 truncate max-w-[120px]" title={entityName}>{entityName}</span>
                <input
                  type="color"
                  value={settings.color || config.colors[entityName] || '#cccccc'}
                  onChange={(e) => {
                    const newSettings = { ...config.entitySettings };
                    newSettings[entityName] = { ...settings, color: e.target.value };
                    // Also update the main colors map for backward compatibility
                    const newColors = { ...config.colors, [entityName]: e.target.value };
                    onConfigChange({ ...config, entitySettings: newSettings, colors: newColors });
                  }}
                  className="w-6 h-6 rounded cursor-pointer border-0 p-0 bg-transparent"
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-3 h-3 text-zinc-400" />
                  <input
                    type="text"
                    placeholder="Icon URL (e.g. https://...)"
                    value={settings.icon || ''}
                    onChange={(e) => {
                      const newSettings = { ...config.entitySettings };
                      newSettings[entityName] = { ...settings, icon: e.target.value };
                      onConfigChange({ ...config, entitySettings: newSettings });
                    }}
                    className="flex-1 p-1.5 text-[10px] border border-zinc-200 dark:border-zinc-800 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 outline-none focus:border-indigo-500"
                  />
                </div>
                
                <div className="flex items-center gap-2">
                  <Layout className="w-3 h-3 text-zinc-400" />
                  <select
                    value={settings.iconPosition || 'before-name'}
                    onChange={(e) => {
                      const newSettings = { ...config.entitySettings };
                      newSettings[entityName] = { ...settings, iconPosition: e.target.value as any };
                      onConfigChange({ ...config, entitySettings: newSettings });
                    }}
                    className="flex-1 p-1.5 text-[10px] border border-zinc-200 dark:border-zinc-800 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 outline-none focus:border-indigo-500"
                  >
                    <option value="before-name">Before Name</option>
                    <option value="after-name">After Name</option>
                    <option value="end-of-bar">End of Bar</option>
                  </select>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
