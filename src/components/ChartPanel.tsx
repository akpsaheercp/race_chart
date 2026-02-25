import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ChartConfig, AudioConfig, YouTubeMetadata, DataPoint } from '../types';
import DataInput from './DataInput';
import RaceChart from './RaceChart';
import Controls from './Controls';
import Customization from './Customization';
import AudioPanel from './AudioPanel';
import ExportPanel from './ExportPanel';
import YouTubePanel from './YouTubePanel';
import { BarChart3 } from 'lucide-react';
import * as d3 from 'd3';

interface ChartPanelProps {
  config: ChartConfig;
  onConfigChange: (config: ChartConfig) => void;
  onRemove: () => void;
}

export default function ChartPanel({ config, onConfigChange, onRemove }: ChartPanelProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTimeIndex, setCurrentTimeIndex] = useState(0);
  const [speed, setSpeed] = useState(1);
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

  const timerRef = useRef<d3.Timer | null>(null);

  const totalFrames = React.useMemo(() => {
    if (!config.data || config.data.length === 0) return 0;
    const dates = new Set(config.data.map(d => d.date));
    return dates.size;
  }, [config.data]);

  const timeIndexRef = useRef(currentTimeIndex);

  // Sync ref when prop changes (e.g. from Controls)
  useEffect(() => {
    timeIndexRef.current = currentTimeIndex;
    window.dispatchEvent(new CustomEvent('time-update', { detail: currentTimeIndex }));
  }, [currentTimeIndex]);

  useEffect(() => {
    let animationFrameId: number;
    let lastTime: number;

    const animate = (time: number) => {
      if (!lastTime) lastTime = time;
      const deltaTime = time - lastTime;
      lastTime = time;

      if (isPlaying) {
        const progressToAdd = (deltaTime * speed) / config.duration;
        timeIndexRef.current += progressToAdd;
        
        let shouldStop = false;
        if (timeIndexRef.current >= totalFrames - 1) {
          timeIndexRef.current = totalFrames - 1;
          shouldStop = true;
        }

        window.dispatchEvent(new CustomEvent('time-update', { detail: timeIndexRef.current }));
        
        const slider = document.getElementById('time-slider') as HTMLInputElement;
        if (slider) slider.value = timeIndexRef.current.toString();
        const timeDisplay = document.getElementById('time-display');
        if (timeDisplay) timeDisplay.innerText = `${Math.floor(timeIndexRef.current)} / ${totalFrames - 1}`;

        if (shouldStop) {
          setIsPlaying(false);
          setCurrentTimeIndex(timeIndexRef.current); // Sync back to React state when stopped
        } else {
          animationFrameId = requestAnimationFrame(animate);
        }
      }
    };

    if (isPlaying) {
      animationFrameId = requestAnimationFrame(animate);
    }
    return () => cancelAnimationFrame(animationFrameId);
  }, [isPlaying, totalFrames, config.duration, speed]);

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

    setCurrentTimeIndex(0);
    setIsPlaying(false);
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
    <div className="flex flex-col xl:flex-row gap-12">
      <div className="flex-1 space-y-8">
        <div className="bg-white dark:bg-[#080808] p-8 rounded-[2.5rem] shadow-2xl border border-zinc-200/50 dark:border-white/5 transition-all duration-500">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-8">
            <div>
              <h2 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tighter uppercase italic">{config.title || 'Untitled Production'}</h2>
              <p className="text-xs font-bold tracking-widest uppercase text-zinc-500 dark:text-zinc-500 mt-1">Status: Ready to Render</p>
            </div>
            <div className="flex items-center gap-4">
              {entities.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold tracking-widest uppercase text-zinc-400">Focus:</span>
                  <select
                    value={config.entityFilter || ''}
                    onChange={(e) => onConfigChange({ ...config, entityFilter: e.target.value })}
                    className="text-xs font-bold py-2 px-4 border border-zinc-200 dark:border-white/10 rounded-xl bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-indigo-500 outline-none transition-all cursor-pointer hover:border-indigo-500"
                  >
                    {entities.map(e => <option key={e} value={e}>{e}</option>)}
                  </select>
                </div>
              )}
            </div>
          </div>
          
          {config.data.length > 0 ? (
            <div className="space-y-8">
              <div className="p-3 bg-zinc-50 dark:bg-[#020202] rounded-[2.5rem] shadow-2xl border border-zinc-200/50 dark:border-white/5">
                <RaceChart
                  config={config}
                  isPlaying={isPlaying}
                  currentTimeIndex={currentTimeIndex}
                  onTimeIndexChange={setCurrentTimeIndex}
                  speed={speed}
                />
              </div>
              <Controls
                isPlaying={isPlaying}
                onPlayPause={() => {
                  if (isPlaying) {
                    setIsPlaying(false);
                    setCurrentTimeIndex(timeIndexRef.current);
                  } else {
                    if (timeIndexRef.current >= totalFrames - 1) {
                      setCurrentTimeIndex(0);
                    }
                    setIsPlaying(true);
                  }
                }}
                onRestart={() => { setCurrentTimeIndex(0); setIsPlaying(true); }}
                currentTimeIndex={currentTimeIndex}
                totalFrames={totalFrames}
                onTimeIndexChange={setCurrentTimeIndex}
                speed={speed}
                onSpeedChange={setSpeed}
              />
            </div>
          ) : (
            <div className="aspect-video bg-zinc-50 dark:bg-[#020202] rounded-[2.5rem] border-2 border-dashed border-zinc-200 dark:border-white/5 flex flex-col items-center justify-center text-center p-12">
              <div className="w-20 h-20 bg-zinc-100 dark:bg-zinc-900 rounded-3xl flex items-center justify-center mb-6 shadow-xl">
                <BarChart3 className="w-10 h-10 text-zinc-300 dark:text-zinc-700" />
              </div>
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">No Data Loaded</h3>
              <p className="text-zinc-500 dark:text-zinc-500 max-w-sm">Upload a CSV/JSON file or load a sample dataset from the panel on the right to begin.</p>
            </div>
          )}
        </div>

        {config.data.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <ExportPanel
              onExportVideo={handleExportVideo}
              onExportGif={handleExportGif}
              isExporting={isExporting}
              progress={exportProgress}
              totalFrames={totalFrames}
              fps={config.fps}
            />
            <YouTubePanel
              metadata={youtubeMetadata}
              onMetadataChange={setYoutubeMetadata}
              onUpload={handleYouTubeUpload}
              isUploading={isUploading}
              chartTitle={config.title}
            />
          </div>
        )}
      </div>

      <div className="w-full xl:w-[400px] space-y-8">
        <DataInput onDataLoaded={handleDataLoaded} />
        {config.data.length > 0 && (
          <>
            <Customization config={config} onConfigChange={onConfigChange} />
            <AudioPanel config={audioConfig} onConfigChange={setAudioConfig} />
          </>
        )}
      </div>
    </div>
  );
}
