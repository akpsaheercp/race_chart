import React, { useState, useEffect } from 'react';
import { Plus, BarChart3, Trash2, Sun, Moon } from 'lucide-react';
import { ChartConfig } from '../types';
import ChartPanel from './ChartPanel';

export default function Dashboard() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      // Check if a theme is already set on the document
      if (document.documentElement.classList.contains('dark')) return 'dark';
      
      // Otherwise, check system preference
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
    }
    return 'light';
  });

  // Apply theme on initial mount and when it changes
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
    }
  }, [theme]);

  const [charts, setCharts] = useState<ChartConfig[]>([
    {
      id: '1',
      title: 'Global Population by Country',
      subtitle: '1950 - 2020',
      caption: 'Data source: UN',
      type: 'bar',
      data: [],
      colors: {},
      maxBars: 10,
      duration: 500,
      theme: theme, // Initialize with global theme
      fontFamily: 'Inter, sans-serif',
      showAnnotations: false,
      annotations: {},
      interpolation: true,
      fps: 60
    }
  ]);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    // Sync all existing charts with the new global theme
    setCharts(prev => prev.map(chart => ({ ...chart, theme: newTheme })));
  };

  const addChart = () => {
    const newChart: ChartConfig = {
      id: Date.now().toString(),
      title: 'New Chart',
      subtitle: '',
      caption: '',
      type: 'bar',
      data: [],
      colors: {},
      maxBars: 10,
      duration: 500,
      theme: theme, // Use current global theme for new charts
      fontFamily: 'Inter, sans-serif',
      showAnnotations: false,
      annotations: {},
      interpolation: true,
      fps: 60
    };
    setCharts([...charts, newChart]);
  };

  const updateChart = (id: string, config: ChartConfig) => {
    setCharts(charts.map(c => c.id === id ? config : c));
  };

  const removeChart = (id: string) => {
    setCharts(charts.filter(c => c.id !== id));
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#000000] text-zinc-900 dark:text-zinc-100 p-6 selection:bg-indigo-500/30 transition-colors duration-700 ease-in-out relative overflow-hidden">
      {/* Dynamic Background Gradient */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full blur-[120px] opacity-20 bg-indigo-200 dark:bg-indigo-900/30"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full blur-[120px] opacity-20 bg-emerald-200 dark:bg-emerald-900/30"></div>
      </div>

      <div className="max-w-[1600px] mx-auto space-y-12 relative z-10">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div className="flex items-center gap-5">
            <div className="p-4 bg-indigo-600 rounded-[1.5rem] shadow-2xl shadow-indigo-500/40 rotate-3 hover:rotate-0 transition-transform duration-500">
              <BarChart3 className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-black tracking-tighter uppercase italic text-zinc-900 dark:text-white">
                RaceChart<span className="text-indigo-600">Animator</span>
              </h1>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 font-bold tracking-widest uppercase opacity-80">Cinematic Data Visualization Pro</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-2xl shadow-xl hover:scale-105 active:scale-95 transition-all text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
            </button>
            <button
              onClick={addChart}
              className="flex items-center gap-3 py-4 px-8 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold transition-all shadow-2xl shadow-indigo-500/30 hover:scale-105 active:scale-95"
            >
              <Plus className="w-5 h-5" />
              New Production
            </button>
          </div>
        </header>

        <div className="space-y-24">
          {charts.map(chart => (
            <div key={chart.id} className="relative group">
              <div className="absolute -top-6 -right-6 z-20 opacity-0 group-hover:opacity-100 transition-all duration-300 scale-90 group-hover:scale-100">
                <button
                  onClick={() => removeChart(chart.id)}
                  className="p-3 bg-red-500 hover:bg-red-600 text-white rounded-xl shadow-2xl transition-all hover:scale-110"
                  title="Remove Production"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
              <div className="bg-white dark:bg-[#0a0a0a] p-8 rounded-[2.5rem] shadow-2xl border border-zinc-200/50 dark:border-white/5 transition-all duration-500">
                <ChartPanel
                  config={chart}
                  onConfigChange={(config) => updateChart(chart.id, config)}
                  onRemove={() => removeChart(chart.id)}
                />
              </div>
            </div>
          ))}
          
          {charts.length === 0 && (
            <div className="text-center py-32 bg-white dark:bg-[#0a0a0a] rounded-[2.5rem] border border-zinc-200/50 dark:border-white/5 shadow-2xl">
              <BarChart3 className="w-16 h-16 mx-auto text-zinc-300 dark:text-zinc-700 mb-6" />
              <h3 className="text-2xl font-bold mb-2 text-zinc-900 dark:text-white">No productions yet</h3>
              <p className="text-zinc-500 dark:text-zinc-400 mb-8 max-w-md mx-auto">Create your first animated race chart to get started with cinematic data visualization.</p>
              <button
                onClick={addChart}
                className="inline-flex items-center gap-2 py-4 px-8 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold transition-all shadow-2xl shadow-indigo-500/30 active:scale-95"
              >
                <Plus className="w-5 h-5" />
                Create Production
              </button>
            </div>
          )}
        </div>

        <footer className="mt-32 pt-12 border-t border-zinc-200/50 dark:border-zinc-800/50 flex flex-col md:flex-row justify-between items-center gap-8 opacity-40 hover:opacity-100 transition-opacity duration-500">
          <div className="flex items-center gap-3 text-xs font-black tracking-[0.2em] uppercase">
            <BarChart3 className="w-4 h-4" />
            RaceChart Animator Pro v2.5
          </div>
          <div className="flex gap-10 text-[10px] font-black tracking-[0.2em] uppercase">
            <a href="#" className="hover:text-indigo-500 transition-colors">Documentation</a>
            <a href="#" className="hover:text-indigo-500 transition-colors">API Reference</a>
            <a href="#" className="hover:text-indigo-500 transition-colors">Cloud Export</a>
          </div>
        </footer>
      </div>
    </div>
  );
}
