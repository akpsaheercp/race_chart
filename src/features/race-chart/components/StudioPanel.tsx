import React, { useState } from 'react';
import { 
  Settings, 
  Palette, 
  Type, 
  Image as ImageIcon, 
  ChevronDown, 
  ChevronRight, 
  BarChart3, 
  Zap, 
  Mic, 
  Download, 
  Youtube,
  Layout,
  Music,
  Share2,
  Database
} from 'lucide-react';
import { ChartConfig, AudioConfig, YouTubeMetadata, DataPoint } from '../../../types';
import Customization from './Customization';
import AudioPanel from './AudioPanel';
import ExportPanel from './ExportPanel';
import YouTubePanel from './YouTubePanel';
import DataInput from './DataInput';

interface StudioPanelProps {
  config: ChartConfig;
  onConfigChange: (config: ChartConfig) => void;
  audioConfig: AudioConfig;
  onAudioConfigChange: (config: AudioConfig) => void;
  youtubeMetadata: YouTubeMetadata;
  onYoutubeMetadataChange: (metadata: YouTubeMetadata) => void;
  onExportVideo: () => void;
  onExportGif: () => void;
  isExporting: boolean;
  exportProgress: number;
  exportResult: { type: 'video' | 'gif', url: string } | null;
  onDownload: () => void;
  onYouTubeUpload: () => void;
  isUploading: boolean;
  totalFrames: number;
  onDataLoaded: (data: DataPoint[], colors: Record<string, string>, config?: Partial<ChartConfig>, youtube?: Partial<YouTubeMetadata>, audio?: Partial<AudioConfig>) => void;
}

export default function StudioPanel({
  config,
  onConfigChange,
  audioConfig,
  onAudioConfigChange,
  youtubeMetadata,
  onYoutubeMetadataChange,
  onExportVideo,
  onExportGif,
  isExporting,
  exportProgress,
  exportResult,
  onDownload,
  onYouTubeUpload,
  isUploading,
  totalFrames,
  onDataLoaded
}: StudioPanelProps) {
  const [activeTab, setActiveTab] = useState<'source' | 'visuals' | 'audio' | 'export' | 'social'>('source');

  const tabs = [
    { id: 'source', label: 'Source', icon: Database },
    { id: 'visuals', label: 'Visuals', icon: Palette },
    { id: 'audio', label: 'Audio', icon: Music },
    { id: 'export', label: 'Export', icon: Download },
    { id: 'social', label: 'Social', icon: Share2 },
  ] as const;

  return (
    <div className="bg-white dark:bg-[#0a0a0a] rounded-[1.5rem] sm:rounded-[2rem] shadow-2xl border border-zinc-200/50 dark:border-white/5 overflow-hidden flex flex-col h-full transition-all duration-500">
      {/* Studio Header */}
      <div className="p-4 sm:p-6 border-b border-zinc-100 dark:border-zinc-800/50 bg-zinc-50/50 dark:bg-zinc-900/20">
        <div className="flex items-center gap-3">
          <div className="p-2 sm:p-2.5 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-500/20">
            <Settings className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-black tracking-tight text-zinc-900 dark:text-white uppercase italic">Studio Settings</h2>
            <p className="text-[9px] sm:text-[10px] font-bold tracking-widest uppercase text-zinc-400">Configure your production</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row flex-1 overflow-hidden">
        {/* Navigation - Horizontal on mobile, Vertical on desktop */}
        <div className="w-full sm:w-20 md:w-24 flex flex-row sm:flex-col p-2 bg-zinc-50 dark:bg-zinc-900/50 border-b sm:border-b-0 sm:border-r border-zinc-100 dark:border-zinc-800/50 gap-1 overflow-x-auto sm:overflow-y-auto no-scrollbar shrink-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center justify-center gap-1.5 py-2 sm:py-3 px-4 sm:px-1 rounded-xl text-[10px] sm:text-xs font-bold transition-all min-w-[60px] sm:min-w-0 ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-sm border border-zinc-200 dark:border-zinc-700'
                  : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 border border-transparent'
              }`}
            >
              <tab.icon className="w-5 h-5 sm:w-6 sm:h-6" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
          {activeTab === 'source' && (
            <div className="space-y-6">
              <DataInput config={config} onDataLoaded={onDataLoaded} />
            </div>
          )}

          {activeTab === 'visuals' && (
            <div className="space-y-6">
              <Customization config={config} onConfigChange={onConfigChange} />
            </div>
          )}

          {activeTab === 'audio' && (
            <div className="space-y-6">
              <AudioPanel config={audioConfig} onConfigChange={onAudioConfigChange} />
            </div>
          )}

          {activeTab === 'export' && (
            <div className="space-y-6">
              <ExportPanel
                onExportVideo={onExportVideo}
                onExportGif={onExportGif}
                isExporting={isExporting}
                progress={exportProgress}
                totalFrames={totalFrames}
                fps={config.fps}
                exportResult={exportResult}
                onDownload={onDownload}
              />
            </div>
          )}

          {activeTab === 'social' && (
            <div className="space-y-6">
              <YouTubePanel
                metadata={youtubeMetadata}
                onMetadataChange={onYoutubeMetadataChange}
                onUpload={onYouTubeUpload}
                isUploading={isUploading}
                chartTitle={config.title}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
  );
}
