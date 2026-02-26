import React, { useState } from 'react';
import { Download, Video, Image as ImageIcon, Loader2, ChevronDown, ChevronRight } from 'lucide-react';

interface ExportPanelProps {
  onExportVideo: () => void;
  onExportGif: () => void;
  isExporting: boolean;
  progress: number;
  totalFrames: number;
  fps: number;
  exportResult: { type: 'video' | 'gif', url: string } | null;
  onDownload: () => void;
}

export default function ExportPanel({ onExportVideo, onExportGif, isExporting, progress, totalFrames, fps, exportResult, onDownload }: ExportPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const duration = totalFrames / (fps / 10); // Rough estimate of video length in seconds
  const estRenderTime = totalFrames * 0.2; // Estimate 0.2s per frame for rendering

  return (
    <div className="bg-white dark:bg-[#0a0a0a] rounded-2xl shadow-sm border border-zinc-200/80 dark:border-zinc-800/80 overflow-hidden transition-all duration-300">
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-6 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${isExpanded ? 'bg-indigo-500 text-white' : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-500'}`}>
            <Download className="w-5 h-5" />
          </div>
          <div className="text-left">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Export & Preview</h2>
            <p className="text-xs text-zinc-500">Render MP4 or GIF</p>
          </div>
        </div>
        {isExpanded ? (
          <ChevronDown className="w-5 h-5 text-zinc-400" />
        ) : (
          <ChevronRight className="w-5 h-5 text-zinc-400" />
        )}
      </button>

      {isExpanded && (
        <div className="p-6 pt-0 space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800">
                <div className="text-[10px] font-bold text-zinc-400 mb-1 uppercase tracking-wider">Final Duration</div>
                <div className="font-mono font-bold text-zinc-900 dark:text-zinc-100">{duration.toFixed(1)}s</div>
              </div>
              <div className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800">
                <div className="text-[10px] font-bold text-zinc-400 mb-1 uppercase tracking-wider">Est. Render Time</div>
                <div className="font-mono font-bold text-zinc-900 dark:text-zinc-100">{estRenderTime.toFixed(1)}s</div>
              </div>
            </div>

            <p className="text-xs text-zinc-500 leading-relaxed">
              Export your animated chart as a video or GIF. The export process will capture the animation frame by frame at {fps} FPS.
            </p>

            {!exportResult ? (
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={onExportVideo}
                  disabled={isExporting}
                  className="flex flex-col items-center justify-center gap-2 p-4 border border-zinc-200 dark:border-zinc-800 rounded-2xl hover:border-indigo-500 dark:hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed group active:scale-[0.98]"
                >
                  <Video className="w-8 h-8 text-zinc-400 group-hover:text-indigo-500 transition-colors" />
                  <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">Export MP4</span>
                  <span className="text-[10px] text-zinc-400">1080p Video</span>
                </button>

                <button
                  onClick={onExportGif}
                  disabled={isExporting}
                  className="flex flex-col items-center justify-center gap-2 p-4 border border-zinc-200 dark:border-zinc-800 rounded-2xl hover:border-indigo-500 dark:hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed group active:scale-[0.98]"
                >
                  <ImageIcon className="w-8 h-8 text-zinc-400 group-hover:text-indigo-500 transition-colors" />
                  <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">Export GIF</span>
                  <span className="text-[10px] text-zinc-400">Animated Image</span>
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-900/30 rounded-2xl flex items-center gap-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-full text-green-600 dark:text-green-400">
                    {exportResult.type === 'video' ? <Video className="w-5 h-5" /> : <ImageIcon className="w-5 h-5" />}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Export Ready!</h3>
                    <p className="text-xs text-zinc-500">Your {exportResult.type === 'video' ? 'video' : 'GIF'} has been rendered successfully.</p>
                  </div>
                </div>
                <button
                  onClick={onDownload}
                  className="w-full flex items-center justify-center gap-2 p-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold shadow-lg shadow-indigo-500/20 transition-all active:scale-[0.98]"
                >
                  <Download className="w-5 h-5" />
                  Download {exportResult.type === 'video' ? 'MP4' : 'GIF'}
                </button>
                <button
                  onClick={() => window.location.reload()} // Reset state hack or pass a reset handler
                  className="w-full text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300 underline"
                >
                  Export Another File
                </button>
              </div>
            )}

            {isExporting && (
              <div className="space-y-3 p-4 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-2xl border border-indigo-100 dark:border-indigo-900/30">
                <div className="flex justify-between text-xs font-bold text-indigo-600 dark:text-indigo-400">
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Exporting...
                  </span>
                  <span>{Math.round(progress * 100)}%</span>
                </div>
                <div className="w-full bg-zinc-200 dark:bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-indigo-500 h-full rounded-full transition-all duration-300 shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                    style={{ width: `${progress * 100}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
