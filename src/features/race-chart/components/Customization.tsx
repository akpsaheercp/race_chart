import React, { useState } from 'react';
import { 
  Settings, 
  Palette, 
  Type, 
  Image as ImageIcon, 
  Moon, 
  Sun, 
  ChevronDown, 
  ChevronRight, 
  Layout, 
  Clock, 
  Zap, 
  BarChart3, 
  MessageSquare,
  Activity,
  Users
} from 'lucide-react';
import { ChartConfig } from '../../../types';

interface CustomizationProps {
  config: ChartConfig;
  onConfigChange: (config: ChartConfig) => void;
}

export default function Customization({ config, onConfigChange }: CustomizationProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [expandedSection, setExpandedSection] = useState<string | null>('content');

  const handleChange = (key: keyof ChartConfig, value: any) => {
    onConfigChange({ ...config, [key]: value });
  };

  const toggleSection = (section: string) => {
    setExpandedSection(prev => prev === section ? null : section);
  };

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
    <div className="bg-white dark:bg-[#0a0a0a] rounded-2xl shadow-sm border border-zinc-200/80 dark:border-zinc-800/80 overflow-hidden transition-all duration-300">
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-6 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${isExpanded ? 'bg-indigo-500 text-white' : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-500'}`}>
            <Settings className="w-5 h-5" />
          </div>
          <div className="text-left">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Customization</h2>
            <p className="text-xs text-zinc-500">Visuals, Animation & Branding</p>
          </div>
        </div>
        {isExpanded ? (
          <ChevronDown className="w-5 h-5 text-zinc-400" />
        ) : (
          <ChevronRight className="w-5 h-5 text-zinc-400" />
        )}
      </button>

      {isExpanded && (
        <div className="p-6 pt-0 space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
          {/* Content & Text */}
          <div className="space-y-1">
            <AccordionHeader id="content" title="Content & Text" icon={Type} />
            {expandedSection === 'content' && (
              <div className="p-4 space-y-4 border-x border-b border-zinc-100 dark:border-zinc-800/50 rounded-b-xl bg-white dark:bg-black/20 animate-in fade-in slide-in-from-top-2 duration-200">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 dark:text-zinc-500 mb-1.5 uppercase tracking-wider">Chart Title</label>
                  <input
                    type="text"
                    value={config.title}
                    onChange={(e) => handleChange('title', e.target.value)}
                    className="w-full p-2.5 text-sm border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50/50 dark:bg-zinc-900/50 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                    placeholder="Enter title..."
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 dark:text-zinc-500 mb-1.5 uppercase tracking-wider">Subtitle</label>
                  <input
                    type="text"
                    value={config.subtitle}
                    onChange={(e) => handleChange('subtitle', e.target.value)}
                    className="w-full p-2.5 text-sm border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50/50 dark:bg-zinc-900/50 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                    placeholder="Enter subtitle..."
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 dark:text-zinc-500 mb-1.5 uppercase tracking-wider">Caption / Source</label>
                  <input
                    type="text"
                    value={config.caption}
                    onChange={(e) => handleChange('caption', e.target.value)}
                    className="w-full p-2.5 text-sm border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50/50 dark:bg-zinc-900/50 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                    placeholder="Data source..."
                  />
                </div>
              </div>
            )}
          </div>

          {/* Chart Type & Layout */}
          <div className="space-y-1">
            <AccordionHeader id="layout" title="Chart Type & Layout" icon={BarChart3} />
            {expandedSection === 'layout' && (
              <div className="p-4 space-y-4 border-x border-b border-zinc-100 dark:border-zinc-800/50 rounded-b-xl bg-white dark:bg-black/20 animate-in fade-in slide-in-from-top-2 duration-200">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 dark:text-zinc-500 mb-1.5 uppercase tracking-wider">Chart Type</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {(['bar', 'stacked-bar', 'line', 'area', 'bubble', 'pie'] as const).map((type) => (
                      <button
                        key={type}
                        onClick={() => handleChange('type', type)}
                        className={`p-2 text-xs rounded-lg border transition-all ${
                          config.type === type 
                            ? 'bg-indigo-500 border-indigo-500 text-white shadow-md shadow-indigo-500/20' 
                            : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700'
                        }`}
                      >
                        {type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </button>
                    ))}
                  </div>
                </div>
                {['bar', 'line', 'area'].includes(config.type) && (
                  <>
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-400 dark:text-zinc-500 mb-1.5 uppercase tracking-wider">Orientation</label>
                      <div className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-900 p-1 rounded-xl border border-zinc-200 dark:border-zinc-800">
                        <button
                          onClick={() => handleChange('orientation', 'horizontal')}
                          className={`flex-1 p-1.5 rounded-lg text-xs transition-all ${(!config.orientation || config.orientation === 'horizontal') ? 'bg-white dark:bg-zinc-800 shadow-sm text-zinc-900 dark:text-zinc-100 font-semibold' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
                        >
                          Horizontal
                        </button>
                        <button
                          onClick={() => handleChange('orientation', 'vertical')}
                          className={`flex-1 p-1.5 rounded-lg text-xs transition-all ${config.orientation === 'vertical' ? 'bg-white dark:bg-zinc-800 shadow-sm text-zinc-900 dark:text-zinc-100 font-semibold' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
                        >
                          Vertical
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-400 dark:text-zinc-500 mb-1.5 uppercase tracking-wider">X-Axis Position</label>
                      <div className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-900 p-1 rounded-xl border border-zinc-200 dark:border-zinc-800">
                        <button
                          onClick={() => handleChange('xAxisPosition', 'top')}
                          className={`flex-1 p-1.5 rounded-lg text-xs transition-all ${(!config.xAxisPosition || config.xAxisPosition === 'top') ? 'bg-white dark:bg-zinc-800 shadow-sm text-zinc-900 dark:text-zinc-100 font-semibold' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
                        >
                          Top / Left
                        </button>
                        <button
                          onClick={() => handleChange('xAxisPosition', 'bottom')}
                          className={`flex-1 p-1.5 rounded-lg text-xs transition-all ${config.xAxisPosition === 'bottom' ? 'bg-white dark:bg-zinc-800 shadow-sm text-zinc-900 dark:text-zinc-100 font-semibold' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
                        >
                          Bottom / Right
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-400 dark:text-zinc-500 mb-1.5 uppercase tracking-wider">Bar Style</label>
                      <div className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-900 p-1 rounded-xl border border-zinc-200 dark:border-zinc-800">
                        <button
                          onClick={() => handleChange('barStyle', 'solid')}
                          className={`flex-1 p-1.5 rounded-lg text-xs transition-all ${(!config.barStyle || config.barStyle === 'solid') ? 'bg-white dark:bg-zinc-800 shadow-sm text-zinc-900 dark:text-zinc-100 font-semibold' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
                        >
                          Solid
                        </button>
                        <button
                          onClick={() => handleChange('barStyle', 'dots')}
                          className={`flex-1 p-1.5 rounded-lg text-xs transition-all ${config.barStyle === 'dots' ? 'bg-white dark:bg-zinc-800 shadow-sm text-zinc-900 dark:text-zinc-100 font-semibold' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
                        >
                          Dots
                        </button>
                      </div>
                    </div>
                    
                    {config.barStyle === 'dots' && (
                      <div className="mt-2 p-3 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg border border-zinc-200 dark:border-zinc-800">
                        <label className="block text-[10px] font-bold text-zinc-400 dark:text-zinc-500 mb-2 uppercase tracking-wider">Dot Effects</label>
                        <div className="grid grid-cols-2 gap-2">
                            {['none', 'trail', 'pulse', 'sparkle', 'gradient'].map(effect => (
                               <button
                                 key={effect}
                                 onClick={() => handleChange('dotEffect', effect)}
                                 className={`p-1.5 rounded text-[10px] capitalize transition-all ${config.dotEffect === effect ? 'bg-indigo-500 text-white shadow-sm' : 'bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700'}`}
                               >
                                 {effect}
                               </button>
                            ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 dark:text-zinc-500 mb-1.5 uppercase tracking-wider">Max Visible Bars</label>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="3"
                      max="50"
                      value={config.maxBars}
                      onChange={(e) => handleChange('maxBars', parseInt(e.target.value))}
                      className="flex-1 accent-indigo-500"
                    />
                    <span className="text-sm font-mono font-bold text-zinc-700 dark:text-zinc-300 w-8">{config.maxBars}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Animation & Engine */}
          <div className="space-y-1">
            <AccordionHeader id="animation" title="Animation & Engine" icon={Zap} />
            {expandedSection === 'animation' && (
              <div className="p-4 space-y-4 border-x border-b border-zinc-100 dark:border-zinc-800/50 rounded-b-xl bg-white dark:bg-black/20 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 dark:text-zinc-500 mb-1.5 uppercase tracking-wider flex items-center gap-1"><Clock className="w-3 h-3"/> Duration (ms)</label>
                    <input
                      type="number"
                      min="100"
                      step="100"
                      value={config.duration}
                      onChange={(e) => handleChange('duration', parseInt(e.target.value))}
                      className="w-full p-2.5 text-sm border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50/50 dark:bg-zinc-900/50 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 dark:text-zinc-500 mb-1.5 uppercase tracking-wider flex items-center gap-1"><Activity className="w-3 h-3"/> Target FPS</label>
                    <select
                      value={config.fps}
                      onChange={(e) => handleChange('fps', parseInt(e.target.value))}
                      className="w-full p-2.5 text-sm border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50/50 dark:bg-zinc-900/50 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                    >
                      <option value={30}>30 FPS</option>
                      <option value={60}>60 FPS</option>
                      <option value={120}>120 FPS</option>
                    </select>
                  </div>
                </div>

                {/* Animation Type */}
                <div>
                    <label className="block text-[10px] font-bold text-zinc-400 dark:text-zinc-500 mb-1.5 uppercase tracking-wider">Animation Physics</label>
                    <div className="grid grid-cols-3 gap-2 mb-3">
                        {['linear', 'spring', 'elastic', 'bounce', 'back'].map(type => (
                           <button
                             key={type}
                             onClick={() => handleChange('animationType', type)}
                             className={`p-1.5 rounded text-[10px] capitalize transition-all ${config.animationType === type ? 'bg-indigo-500 text-white shadow-sm' : 'bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700'}`}
                           >
                             {type}
                           </button>
                        ))}
                    </div>
                    
                    {(config.animationType === 'spring' || config.animationType === 'elastic') && (
                        <div className="grid grid-cols-2 gap-3 p-3 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg border border-zinc-200 dark:border-zinc-800 mb-3">
                            <div>
                                <label className="text-[10px] text-zinc-500 mb-1 block">Stiffness ({config.stiffness})</label>
                                <input
                                  type="range"
                                  min="0.01"
                                  max="1"
                                  step="0.01"
                                  value={config.stiffness || 0.1}
                                  onChange={(e) => handleChange('stiffness', parseFloat(e.target.value))}
                                  className="w-full accent-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] text-zinc-500 mb-1 block">Damping ({config.damping})</label>
                                <input
                                  type="range"
                                  min="0.1"
                                  max="1"
                                  step="0.05"
                                  value={config.damping || 0.8}
                                  onChange={(e) => handleChange('damping', parseFloat(e.target.value))}
                                  className="w-full accent-indigo-500"
                                />
                            </div>
                        </div>
                    )}

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => handleChange('staggerDelay', !config.staggerDelay)}
                            className={`flex-1 p-2 rounded-lg text-[10px] border transition-all ${config.staggerDelay ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400' : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-500'}`}
                        >
                            Staggered Cascade
                        </button>
                        <button
                            onClick={() => handleChange('showParticles', !config.showParticles)}
                            className={`flex-1 p-2 rounded-lg text-[10px] border transition-all ${config.showParticles ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400' : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-500'}`}
                        >
                            Overtake Particles
                        </button>
                    </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg border border-zinc-200 dark:border-zinc-800">
                  <div>
                    <div className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Smooth Interpolation</div>
                    <div className="text-[10px] text-zinc-500">Enable sub-frame data blending</div>
                  </div>
                  <button
                    onClick={() => handleChange('interpolation', !config.interpolation)}
                    className={`w-10 h-5 rounded-full transition-all relative ${config.interpolation ? 'bg-indigo-500' : 'bg-zinc-300 dark:bg-zinc-700'}`}
                  >
                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${config.interpolation ? 'left-6' : 'left-1'}`} />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Visual Style */}
          <div className="space-y-1">
            <AccordionHeader id="visual" title="Visual Style" icon={Palette} />
            {expandedSection === 'visual' && (
              <div className="p-4 space-y-4 border-x border-b border-zinc-100 dark:border-zinc-800/50 rounded-b-xl bg-white dark:bg-black/20 animate-in fade-in slide-in-from-top-2 duration-200">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 dark:text-zinc-500 mb-1.5 uppercase tracking-wider">Typography</label>
                  <select
                    value={config.fontFamily}
                    onChange={(e) => handleChange('fontFamily', e.target.value)}
                    className="w-full p-2.5 text-sm border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50/50 dark:bg-zinc-900/50 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                  >
                    <option value="Inter, sans-serif">Inter (Modern)</option>
                    <option value="Roboto, sans-serif">Roboto (Clean)</option>
                    <option value="Georgia, serif">Georgia (Classic)</option>
                    <option value="Courier New, monospace">Courier New (Technical)</option>
                    <option value="'JetBrains Mono', monospace">JetBrains Mono (Dev)</option>
                  </select>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Interface Theme</span>
                  <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-900 p-1 rounded-xl border border-zinc-200 dark:border-zinc-800">
                    <button
                      onClick={() => handleChange('theme', 'light')}
                      className={`p-1.5 rounded-lg flex items-center gap-1.5 transition-all ${config.theme === 'light' ? 'bg-white shadow-sm text-zinc-900 font-semibold border border-zinc-200' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 border border-transparent'}`}
                    >
                      <Sun className="w-3.5 h-3.5" />
                      <span className="text-[10px]">Light</span>
                    </button>
                    <button
                      onClick={() => handleChange('theme', 'dark')}
                      className={`p-1.5 rounded-lg flex items-center gap-1.5 transition-all ${config.theme === 'dark' ? 'bg-zinc-800 shadow-sm text-zinc-100 font-semibold border border-zinc-700' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 border border-transparent'}`}
                    >
                      <Moon className="w-3.5 h-3.5" />
                      <span className="text-[10px]">Dark</span>
                    </button>
                  </div>
                </div>

                {/* Text Colors */}
                <div className="space-y-3 pt-2 border-t border-zinc-100 dark:border-zinc-800/50">
                  <div className="flex items-center justify-between">
                    <label className="block text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Text Styling</label>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-zinc-500">Show Labels</span>
                      <button
                        onClick={() => handleChange('showLabels', !config.showLabels)}
                        className={`w-8 h-4 rounded-full transition-all relative ${config.showLabels ? 'bg-indigo-500' : 'bg-zinc-300 dark:bg-zinc-700'}`}
                      >
                        <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${config.showLabels ? 'left-4.5' : 'left-0.5'}`} />
                      </button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-zinc-500 mb-1 block">Entity Labels</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={config.labelColor || (config.theme === 'dark' ? '#ffffff' : '#09090b')}
                          onChange={(e) => handleChange('labelColor', e.target.value)}
                          className="w-8 h-8 rounded cursor-pointer border-0 p-0 bg-transparent"
                        />
                        <button 
                          onClick={() => handleChange('labelColor', undefined)}
                          className="text-[10px] text-zinc-400 hover:text-zinc-600 underline"
                        >Reset</button>
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] text-zinc-500 mb-1 block">Values</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={config.valueColor || (config.theme === 'dark' ? '#ffffff' : '#09090b')}
                          onChange={(e) => handleChange('valueColor', e.target.value)}
                          className="w-8 h-8 rounded cursor-pointer border-0 p-0 bg-transparent"
                        />
                        <button 
                          onClick={() => handleChange('valueColor', undefined)}
                          className="text-[10px] text-zinc-400 hover:text-zinc-600 underline"
                        >Reset</button>
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] text-zinc-500 mb-1 block">Date/Year</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={config.dateColor || (config.theme === 'dark' ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.12)')}
                          onChange={(e) => handleChange('dateColor', e.target.value)}
                          className="w-8 h-8 rounded cursor-pointer border-0 p-0 bg-transparent"
                        />
                        <button 
                          onClick={() => handleChange('dateColor', undefined)}
                          className="text-[10px] text-zinc-400 hover:text-zinc-600 underline"
                        >Reset</button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Date Border */}
                <div className="space-y-3 pt-2 border-t border-zinc-100 dark:border-zinc-800/50">
                  <label className="block text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Date Border</label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-zinc-500 mb-1 block">Border Color</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={config.dateBorderColor || '#000000'}
                          onChange={(e) => handleChange('dateBorderColor', e.target.value)}
                          className="w-8 h-8 rounded cursor-pointer border-0 p-0 bg-transparent"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] text-zinc-500 mb-1 block">Border Width</label>
                      <input
                        type="number"
                        min="0"
                        max="10"
                        step="0.5"
                        value={config.dateBorderWidth || 0}
                        onChange={(e) => handleChange('dateBorderWidth', parseFloat(e.target.value))}
                        className="w-full p-1.5 text-sm border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50/50 dark:bg-zinc-900/50 text-zinc-900 dark:text-zinc-100 outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Branding & Assets */}
          <div className="space-y-1">
            <AccordionHeader id="branding" title="Branding & Assets" icon={ImageIcon} />
            {expandedSection === 'branding' && (
              <div className="p-4 space-y-4 border-x border-b border-zinc-100 dark:border-zinc-800/50 rounded-b-xl bg-white dark:bg-black/20 animate-in fade-in slide-in-from-top-2 duration-200">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 dark:text-zinc-500 mb-1.5 uppercase tracking-wider">Watermark URL</label>
                  <input
                    type="text"
                    placeholder="https://example.com/logo.png"
                    value={config.watermarkUrl || ''}
                    onChange={(e) => handleChange('watermarkUrl', e.target.value)}
                    className="w-full p-2.5 text-sm border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50/50 dark:bg-zinc-900/50 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 dark:text-zinc-500 mb-1.5 uppercase tracking-wider">Logo URL (Top Right)</label>
                  <input
                    type="text"
                    placeholder="https://example.com/logo.png"
                    value={config.logoUrl || ''}
                    onChange={(e) => handleChange('logoUrl', e.target.value)}
                    className="w-full p-2.5 text-sm border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50/50 dark:bg-zinc-900/50 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Annotations */}
          <div className="space-y-1">
            <AccordionHeader id="annotations" title="Annotations & Insights" icon={MessageSquare} />
            {expandedSection === 'annotations' && (
              <div className="p-4 space-y-4 border-x border-b border-zinc-100 dark:border-zinc-800/50 rounded-b-xl bg-white dark:bg-black/20 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg border border-zinc-200 dark:border-zinc-800">
                  <div>
                    <div className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Show Annotations</div>
                    <div className="text-[10px] text-zinc-500">Display text insights on the chart</div>
                  </div>
                  <button
                    onClick={() => handleChange('showAnnotations', !config.showAnnotations)}
                    className={`w-10 h-5 rounded-full transition-all relative ${config.showAnnotations ? 'bg-indigo-500' : 'bg-zinc-300 dark:bg-zinc-700'}`}
                  >
                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${config.showAnnotations ? 'left-6' : 'left-1'}`} />
                  </button>
                </div>
                <div className="text-[10px] text-zinc-400 italic text-center">
                  Annotations are automatically generated based on data milestones.
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
