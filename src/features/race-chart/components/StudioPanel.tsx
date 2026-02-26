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
  Database,
  Users
} from 'lucide-react';
import { ChartConfig, AudioConfig, YouTubeMetadata, DataPoint } from '../../../types';
import Customization from './Customization';
import AudioPanel from './AudioPanel';
import ExportPanel from './ExportPanel';
import YouTubePanel from './YouTubePanel';
import DataInput from './DataInput';
import EntityPanel from './EntityPanel';

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
  const [activeTab, setActiveTab] = useState<'source' | 'visuals' | 'entities' | 'audio' | 'export' | 'social'>('source');

  const tabs = [
    { id: 'source', label: 'Source', icon: Database },
    { id: 'visuals', label: 'Visuals', icon: Palette },
    { id: 'entities', label: 'Entities', icon: Users },
    { id: 'audio', label: 'Audio', icon: Music },
    { id: 'export', label: 'Export', icon: Download },
    { id: 'social', label: 'Social', icon: Share2 },
  ] as const;

  return (
    <div className="bg-white dark:bg-[#0a0a0a] rounded-xl shadow-xl border border-zinc-200/50 dark:border-white/5 overflow-hidden flex flex-col h-full transition-all duration-500">
      {/* Studio Header - Reduced padding */}
      <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-800/50 bg-zinc-50/50 dark:bg-zinc-900/20">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-indigo-600 rounded-lg shadow-lg shadow-indigo-500/20">
            <Settings className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-black tracking-tight text-zinc-900 dark:text-white uppercase italic">Studio</h2>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row flex-1 overflow-hidden">
        {/* Navigation - Compact */}
        <div className="w-full sm:w-16 flex flex-row sm:flex-col p-1 bg-zinc-50 dark:bg-zinc-900/50 border-b sm:border-b-0 sm:border-r border-zinc-100 dark:border-zinc-800/50 gap-1 overflow-x-auto sm:overflow-y-auto no-scrollbar shrink-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex flex-col items-center justify-center gap-1 py-2 px-2 rounded-lg text-[9px] font-bold transition-all min-w-[50px] sm:min-w-0 ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-sm border border-zinc-200 dark:border-zinc-700'
                  : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 border border-transparent'
              }`}
              title={tab.label}
            >
              <tab.icon className="w-4 h-4" />
              <span className="hidden sm:block">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content - Reduced padding */}
        <div className="flex-1 overflow-y-auto p-3 custom-scrollbar bg-white dark:bg-[#0a0a0a]">
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            {activeTab === 'source' && (
              <DataInput config={config} onDataLoaded={onDataLoaded} />
            )}

            {activeTab === 'visuals' && (
              <Customization config={config} onConfigChange={onConfigChange} />
            )}

            {activeTab === 'entities' && (
              <EntityPanel config={config} onConfigChange={onConfigChange} />
            )}

            {activeTab === 'audio' && (
              <AudioPanel config={audioConfig} onConfigChange={onAudioConfigChange} />
            )}

            {activeTab === 'export' && (
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
            )}

            {activeTab === 'social' && (
              <YouTubePanel
                metadata={youtubeMetadata}
                onMetadataChange={onYoutubeMetadataChange}
                onUpload={onYouTubeUpload}
                isUploading={isUploading}
                chartTitle={config.title}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
