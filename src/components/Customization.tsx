import React from 'react';
import { Settings, Palette, Type, Image as ImageIcon, Moon, Sun } from 'lucide-react';
import { ChartConfig } from '../types';

interface CustomizationProps {
  config: ChartConfig;
  onConfigChange: (config: ChartConfig) => void;
}

export default function Customization({ config, onConfigChange }: CustomizationProps) {
  const handleChange = (key: keyof ChartConfig, value: any) => {
    onConfigChange({ ...config, [key]: value });
  };

  return (
    <div className="bg-white dark:bg-[#0a0a0a] p-6 rounded-2xl shadow-sm border border-zinc-200/80 dark:border-zinc-800/80 space-y-6 transition-colors duration-300">
      <h2 className="text-lg font-semibold flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
        <Settings className="w-5 h-5 text-indigo-500" />
        Customization
      </h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Title</label>
          <input
            type="text"
            value={config.title}
            onChange={(e) => handleChange('title', e.target.value)}
            className="w-full p-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Subtitle</label>
          <input
            type="text"
            value={config.subtitle}
            onChange={(e) => handleChange('subtitle', e.target.value)}
            className="w-full p-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Max Bars</label>
            <input
              type="number"
              min="3"
              max="20"
              value={config.maxBars}
              onChange={(e) => handleChange('maxBars', parseInt(e.target.value))}
              className="w-full p-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Duration (ms)</label>
            <input
              type="number"
              min="100"
              step="100"
              value={config.duration}
              onChange={(e) => handleChange('duration', parseInt(e.target.value))}
              className="w-full p-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Font Family</label>
          <select
            value={config.fontFamily}
            onChange={(e) => handleChange('fontFamily', e.target.value)}
            className="w-full p-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
          >
            <option value="Inter, sans-serif">Inter</option>
            <option value="Roboto, sans-serif">Roboto</option>
            <option value="Georgia, serif">Georgia</option>
            <option value="Courier New, monospace">Courier New</option>
          </select>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Theme</span>
          <div className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-900 p-1 rounded-xl">
            <button
              onClick={() => handleChange('theme', 'light')}
              className={`p-2 rounded-lg flex items-center gap-2 transition-all ${config.theme === 'light' ? 'bg-white shadow-sm text-zinc-900 font-semibold' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
            >
              <Sun className="w-4 h-4" />
              <span className="text-xs">Light</span>
            </button>
            <button
              onClick={() => handleChange('theme', 'dark')}
              className={`p-2 rounded-lg flex items-center gap-2 transition-all ${config.theme === 'dark' ? 'bg-zinc-800 shadow-sm text-zinc-100 font-semibold' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
            >
              <Moon className="w-4 h-4" />
              <span className="text-xs">Dark</span>
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Watermark URL</label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="https://example.com/logo.png"
              value={config.watermarkUrl || ''}
              onChange={(e) => handleChange('watermarkUrl', e.target.value)}
              className="flex-1 p-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
