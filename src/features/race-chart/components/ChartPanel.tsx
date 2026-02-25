import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ChartConfig, AudioConfig, YouTubeMetadata, DataPoint } from '../../../types';
import DataInput from './DataInput';
import RaceChart from './RaceChart';
import Controls from './Controls';
import StudioPanel from './StudioPanel';
import { BarChart3, Maximize, Minimize, Settings2, PlayCircle } from 'lucide-react';
import * as d3 from 'd3';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { useAnimationEngine } from '../hooks/useAnimationEngine';

interface ChartPanelProps {
  config: ChartConfig;
  onConfigChange: (config: ChartConfig) => void;
  onRemove: () => void;
}

export default function ChartPanel({ config, onConfigChange, onRemove }: ChartPanelProps) {
  const [speed, setSpeed] = useState(1);
  const [isLooping, setIsLooping] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeMobileTab, setActiveMobileTab] = useState<'preview' | 'studio'>('preview');
  const chartContainerRef = useRef<HTMLDivElement>(null);

  const totalFrames = React.useMemo(() => {
    if (!config.data || config.data.length === 0) return 0;
    const dates = new Set(config.data.map(d => d.date));
    return dates.size;
  }, [config.data]);

  const { engine, isPlaying, timeIndex: currentTimeIndex } = useAnimationEngine(
    totalFrames,
    config.duration,
    speed,
    isLooping
  );

  const [audioConfig, setAudioConfig] = useState<AudioConfig>({
    script: '',
    bgmVolume: 0.5,
    loopBgm: true,
  });
  const [youtubeMetadata, setYoutubeMetadata] = useState<YouTubeMetadata>({
    title: config.title,
    description: '',
    tags: [],
  });
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      chartContainerRef.current?.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useKeyboardShortcuts({
    'space': () => engine.togglePlay(),
    'f': toggleFullscreen,
    'l': () => setIsLooping(prev => !prev),
    'arrowleft': () => engine.setTimeIndex(engine.getTimeIndex() - 1),
    'arrowright': () => engine.setTimeIndex(engine.getTimeIndex() + 1),
  });

  const handleDataLoaded = (
    data: DataPoint[], 
    colors: Record<string, string>, 
    configUpdate?: Partial<ChartConfig>,
    youtubeUpdate?: Partial<YouTubeMetadata>,
    audioUpdate?: Partial<AudioConfig>
  ) => {
    onConfigChange({ 
      ...config, 
      data, 
      colors, 
      ...configUpdate,
      title: configUpdate?.title || config.title,
      subtitle: configUpdate?.subtitle || config.subtitle,
      caption: configUpdate?.caption || config.caption,
    });
    
    if (youtubeUpdate) {
      setYoutubeMetadata(prev => ({ ...prev, ...youtubeUpdate }));
    }
    
    if (audioUpdate) {
      setAudioConfig(prev => ({ ...prev, ...audioUpdate }));
    }

    engine.setTimeIndex(0);
    engine.pause();
  };

  const entities = useMemo(() => {
    const allEntities = Array.from(new Set(config.data.map(d => d.entity).filter(Boolean)));
    return allEntities as string[];
  }, [config.data]);

  const handleExportVideo = async () => {
    setIsExporting(true);
    setExportProgress(0);
    
    // Simulate export process
    for (let i = 0; i <= 100; i += 5) {
      await new Promise(resolve => setTimeout(resolve, 100));
      setExportProgress(i / 100);
    }
    
    setIsExporting(false);
    alert('Video export simulation complete! In a real environment, this would download an MP4 file.');
  };

  const handleExportGif = async () => {
    setIsExporting(true);
    setExportProgress(0);
    
    // Simulate export process
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 100));
      setExportProgress(i / 100);
    }
    
    setIsExporting(false);
    alert('GIF export simulation complete! In a real environment, this would download a GIF file.');
  };

  const handleYouTubeUpload = async () => {
    setIsUploading(true);
    // Simulate upload
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsUploading(false);
    alert('YouTube upload simulation complete! In a real environment, this would open an OAuth popup and upload the video.');
  };

  return (
    <div className="flex flex-col xl:flex-row gap-8 xl:gap-12">
      {/* Mobile Tab Switcher */}
      <div className="xl:hidden flex p-1 bg-zinc-100 dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 mb-4">
        <button
          onClick={() => setActiveMobileTab('preview')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${
            activeMobileTab === 'preview'
              ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-sm border border-zinc-200 dark:border-zinc-700'
              : 'text-zinc-500'
          }`}
        >
          <PlayCircle className="w-4 h-4" />
          Preview
        </button>
        <button
          onClick={() => setActiveMobileTab('studio')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${
            activeMobileTab === 'studio'
              ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-sm border border-zinc-200 dark:border-zinc-700'
              : 'text-zinc-500'
          }`}
        >
          <Settings2 className="w-4 h-4" />
          Studio
        </button>
      </div>

      {/* Main Content Area */}
      <div className={`flex-1 space-y-4 sm:space-y-8 ${activeMobileTab === 'preview' ? 'block' : 'hidden xl:block'}`}>
        <div className="bg-white dark:bg-[#080808] p-3 sm:p-8 rounded-[1.5rem] sm:rounded-[2.5rem] shadow-2xl border border-zinc-200/50 dark:border-white/5 transition-all duration-500">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-6 mb-4 sm:mb-8">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white tracking-tighter uppercase italic line-clamp-1">{config.title || 'Untitled Production'}</h2>
              <p className="text-[10px] font-bold tracking-widest uppercase text-zinc-500 dark:text-zinc-500 mt-1">Status: Ready to Render</p>
            </div>
            <div className="flex items-center gap-4 w-full sm:w-auto">
              {entities.length > 0 && (
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <span className="text-[10px] font-bold tracking-widest uppercase text-zinc-400 hidden sm:inline">Focus:</span>
                  <select
                    value={config.entityFilter || ''}
                    onChange={(e) => onConfigChange({ ...config, entityFilter: e.target.value })}
                    className="w-full sm:w-auto text-xs font-bold py-2 px-4 border border-zinc-200 dark:border-white/10 rounded-xl bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-indigo-500 outline-none transition-all cursor-pointer hover:border-indigo-500"
                  >
                    <option value="">All Entities</option>
                    {entities.map(e => <option key={e} value={e}>{e}</option>)}
                  </select>
                </div>
              )}
            </div>
          </div>
          
          {config.data.length > 0 ? (
            <div className={`space-y-4 sm:space-y-6 ${isFullscreen ? 'p-4 sm:p-8 bg-white dark:bg-[#080808] overflow-y-auto' : ''}`} ref={chartContainerRef}>
              <div className={`w-full ${isFullscreen ? 'h-[calc(100vh-140px)]' : 'aspect-video'}`}>
                <RaceChart
                  config={config}
                  isPlaying={isPlaying}
                  currentTimeIndex={currentTimeIndex}
                  onTimeIndexChange={(index) => engine.setTimeIndex(index)}
                  speed={speed}
                />
              </div>
              <Controls
                isPlaying={isPlaying}
                onPlayPause={() => engine.togglePlay()}
                onRestart={() => { engine.setTimeIndex(0); engine.play(); }}
                currentTimeIndex={currentTimeIndex}
                totalFrames={totalFrames}
                onTimeIndexChange={(index) => engine.setTimeIndex(index)}
                speed={speed}
                onSpeedChange={setSpeed}
                isLooping={isLooping}
                onLoopToggle={() => setIsLooping(!isLooping)}
                isFullscreen={isFullscreen}
                onFullscreenToggle={toggleFullscreen}
              />
            </div>
          ) : (
            <div className="aspect-video bg-zinc-50 dark:bg-[#020202] rounded-[2.5rem] border-2 border-dashed border-zinc-200 dark:border-white/5 flex flex-col items-center justify-center text-center p-6 sm:p-12">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-zinc-100 dark:bg-zinc-900 rounded-3xl flex items-center justify-center mb-6 shadow-xl">
                <BarChart3 className="w-8 h-8 sm:w-10 sm:h-10 text-zinc-300 dark:text-zinc-700" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-white mb-2">No Data Loaded</h3>
              <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-500 max-w-sm">Upload a CSV/JSON file or load a sample dataset from the Studio panel to begin.</p>
            </div>
          )}
        </div>
      </div>

      {/* Studio Sidebar */}
      <div className={`w-full xl:w-[450px] space-y-4 sm:space-y-8 ${activeMobileTab === 'studio' ? 'block' : 'hidden xl:block'}`}>
        <StudioPanel
          config={config}
          onConfigChange={onConfigChange}
          audioConfig={audioConfig}
          onAudioConfigChange={setAudioConfig}
          youtubeMetadata={youtubeMetadata}
          onYoutubeMetadataChange={setYoutubeMetadata}
          onExportVideo={handleExportVideo}
          onExportGif={handleExportGif}
          isExporting={isExporting}
          exportProgress={exportProgress}
          onYouTubeUpload={handleYouTubeUpload}
          isUploading={isUploading}
          totalFrames={totalFrames}
          onDataLoaded={handleDataLoaded}
        />
      </div>
    </div>
  );
}
