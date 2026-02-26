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
import { useOrientation } from '../hooks/useOrientation';
import { Muxer, ArrayBufferTarget } from 'mp4-muxer';
import { GIFEncoder, quantize, applyPalette } from 'gifenc';
import { VideoExportController } from '../../../export/ExportController';

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
  const svgRef = useRef<SVGSVGElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { orientation, isMobile } = useOrientation();

  // Force preview mode in landscape mobile
  useEffect(() => {
    if (isMobile && orientation === 'landscape') {
      setActiveMobileTab('preview');
    }
  }, [isMobile, orientation]);

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

  const audioRef = useRef<HTMLAudioElement>(null);
  const [audioConfig, setAudioConfig] = useState<AudioConfig>({
    script: '',
    bgmVolume: 0.5,
    loopBgm: true,
  });

  // Sync audio playback
  useEffect(() => {
    if (!audioRef.current || !audioConfig.bgmUrl) return;

    const audio = audioRef.current;
    audio.volume = audioConfig.bgmVolume;
    audio.playbackRate = speed;
    audio.loop = audioConfig.loopBgm;

    if (isPlaying) {
      // Sync time before playing
      const targetTime = (engine.getTimeIndex() * config.duration) / 1000;
      if (Math.abs(audio.currentTime - targetTime) > 0.5) {
         audio.currentTime = targetTime;
      }
      audio.play().catch(e => console.error("Audio play failed", e));
    } else {
      audio.pause();
    }
  }, [isPlaying, audioConfig.bgmUrl, speed, audioConfig.bgmVolume, audioConfig.loopBgm, config.duration]);

  // Sync on scrub (when paused)
  useEffect(() => {
    if (!audioRef.current || isPlaying) return;
    const audio = audioRef.current;
    const targetTime = (currentTimeIndex * config.duration) / 1000;
    if (Math.abs(audio.currentTime - targetTime) > 0.1) {
      audio.currentTime = targetTime;
    }
  }, [currentTimeIndex, config.duration, isPlaying]);

  // Handle time updates (seeking while playing, drift correction, looping)
  useEffect(() => {
    const handleTimeUpdate = (e: Event) => {
      if (!audioRef.current || !isPlaying) return;
      
      const newTimeIndex = (e as CustomEvent).detail;
      const audio = audioRef.current;
      const targetTime = (newTimeIndex * config.duration) / 1000;
      
      // If desync is > 0.3s, sync it.
      if (Math.abs(audio.currentTime - targetTime) > 0.3) {
        audio.currentTime = targetTime;
      }
    };
    
    window.addEventListener('time-update', handleTimeUpdate);
    return () => window.removeEventListener('time-update', handleTimeUpdate);
  }, [isPlaying, config.duration]);

  const [youtubeMetadata, setYoutubeMetadata] = useState<YouTubeMetadata>({
    title: config.title,
    description: '',
    tags: [],
  });
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportResult, setExportResult] = useState<{ type: 'video' | 'gif', url: string } | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const exportController = useMemo(() => new VideoExportController(), []);

  useEffect(() => {
    exportController.onProgress = (pct, currentFrame, totalFrames, eta, sizeBytes) => {
      setExportProgress(pct);
    };
    exportController.onComplete = (blob, filename, sizeBytes) => {
      const url = URL.createObjectURL(blob);
      setExportResult({ type: 'video', url });
      setIsExporting(false);
      engine.setTimeIndex(0);
    };
    exportController.onError = (error, recoverable) => {
      console.error(error);
      alert('Export failed: ' + error.message);
      setIsExporting(false);
      engine.setTimeIndex(0);
    };
  }, [exportController, engine]);

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
    if (!svgRef.current) return;

    setIsExporting(true);
    setExportProgress(0);
    setExportResult(null);
    engine.pause();
    engine.setTimeIndex(0);

    exportController.settings.fps = 30;
    exportController.settings.durationPerFrame = config.duration / speed;
    exportController.settings.theme = config.theme;

    try {
      await exportController.startExport(svgRef.current, totalFrames, config.type);
    } catch (err) {
      console.error(err);
      alert('Export failed: ' + (err as any).message);
      setIsExporting(false);
      engine.setTimeIndex(0);
    }
  };

  const handleExportGif = async () => {
    if (!svgRef.current || !canvasRef.current) return;

    setIsExporting(true);
    setExportProgress(0);
    setExportResult(null);
    engine.pause();
    engine.setTimeIndex(0);
    
    try {
      // Use smaller resolution for GIF to avoid huge files and slow processing
      const width = 800;
      const height = 450;
      const fps = 15; // Lower FPS for GIF
      
      const durationMs = (totalFrames - 1) * config.duration / speed;
      const totalGifFrames = Math.ceil(durationMs / 1000 * fps);
      const step = (totalFrames - 1) / totalGifFrames;
      
      const gif = GIFEncoder();
      
      const canvas = canvasRef.current;
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d', { willReadFrequently: true })!;

      for (let f = 0; f < totalGifFrames; f++) {
        const engineIndex = f * step;
        
        window.dispatchEvent(new CustomEvent('time-update', { detail: engineIndex }));
        
        await new Promise(r => setTimeout(r, 0));

        const svgData = new XMLSerializer().serializeToString(svgRef.current);
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);
        
        const img = new Image();
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = url;
        });

        ctx.fillStyle = config.theme === 'dark' ? '#000' : '#fff';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        
        const { data } = ctx.getImageData(0, 0, width, height);
        const palette = quantize(data, 256);
        const index = applyPalette(data, palette);
        
        gif.writeFrame(index, width, height, { palette, delay: 1000 / fps });
        
        URL.revokeObjectURL(url);

        setExportProgress(f / totalGifFrames);
        
        await new Promise(r => setTimeout(r, 0));
      }
      
      gif.finish();
      
      const buffer = gif.bytes();
      const blob = new Blob([buffer], { type: 'image/gif' });
      const url = URL.createObjectURL(blob);
      
      setExportResult({ type: 'gif', url });

    } catch (err) {
      console.error(err);
      alert('GIF Export failed: ' + (err as any).message);
    } finally {
      setIsExporting(false);
      engine.setTimeIndex(0);
    }
  };

  const handleDownload = () => {
    if (exportResult) {
      const a = document.createElement('a');
      a.href = exportResult.url;
      a.download = `${config.title || 'race-chart'}.${exportResult.type === 'video' ? 'mp4' : 'gif'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      if (exportResult.type === 'video') {
         // Keep URL for re-download if needed, or revoke later?
         // URL.revokeObjectURL(exportResult.url);
      }
    }
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
      <canvas ref={canvasRef} className="hidden" />
      {/* Mobile Tab Switcher - Hide in landscape */}
      {!(isMobile && orientation === 'landscape') && (
        <div className="xl:hidden flex p-1 bg-zinc-100 dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 mb-4 sticky top-4 z-50 shadow-lg">
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
      )}

      {/* Main Content Area */}
      <div className={`flex-1 space-y-4 sm:space-y-8 ${activeMobileTab === 'preview' ? 'block' : 'hidden xl:block'}`}>
        <audio
          ref={audioRef}
          src={audioConfig.bgmUrl}
          loop={audioConfig.loopBgm}
          className="hidden"
        />
        <div className={`bg-white dark:bg-[#080808] p-3 sm:p-8 rounded-[1.5rem] sm:rounded-[2.5rem] shadow-2xl border border-zinc-200/50 dark:border-white/5 transition-all duration-500 ${
          isMobile && orientation === 'landscape' ? 'fixed inset-0 z-50 rounded-none border-0 p-2 sm:p-4 flex flex-col' : ''
        }`}>
          <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-6 mb-4 sm:mb-8 ${
            isMobile && orientation === 'landscape' ? 'hidden' : ''
          }`}>
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
            <div className={`${isFullscreen ? 'flex flex-col h-full w-full bg-white dark:bg-[#080808] p-4' : 'space-y-4 sm:space-y-6'} ${
              isMobile && orientation === 'landscape' ? 'flex-1 flex flex-col min-h-0 relative' : ''
            }`} ref={chartContainerRef}>
              <div className={`w-full ${
                isFullscreen 
                  ? 'flex-1 min-h-0' 
                  : isMobile && orientation === 'landscape'
                    ? 'absolute inset-0'
                    : 'aspect-video'
              }`}>
                <RaceChart
                  ref={svgRef}
                  config={config}
                  isPlaying={isPlaying}
                  currentTimeIndex={currentTimeIndex}
                  onTimeIndexChange={(index) => engine.setTimeIndex(index)}
                  speed={speed}
                />
              </div>
              <div className={`${
                isMobile && orientation === 'landscape' || isFullscreen
                  ? 'absolute bottom-4 left-4 right-4 z-50' 
                  : ''
              }`}>
                <div className={isMobile && orientation === 'landscape' || isFullscreen ? 'scale-90 origin-bottom' : ''}>
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
                    className={isMobile && orientation === 'landscape' || isFullscreen ? 'bg-white/80 dark:bg-black/80 backdrop-blur-md border-transparent' : ''}
                  />
                </div>
              </div>
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
          exportResult={exportResult}
          onDownload={handleDownload}
          onYouTubeUpload={handleYouTubeUpload}
          isUploading={isUploading}
          totalFrames={totalFrames}
          onDataLoaded={handleDataLoaded}
          exportController={exportController}
        />
      </div>
    </div>
  );
}
