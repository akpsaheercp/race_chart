import React, { useState, useRef } from 'react';
import { Download, Video, Image as ImageIcon, Loader2 } from 'lucide-react';

interface ExportPanelProps {
  onExportVideo: () => void;
  onExportGif: () => void;
  isExporting: boolean;
  progress: number;
  totalFrames: number;
  fps: number;
}

export default function ExportPanel({ onExportVideo, onExportGif, isExporting, progress, totalFrames, fps }: ExportPanelProps) {
  const duration = totalFrames / (fps / 10); // Rough estimate of video length in seconds
  const estRenderTime = totalFrames * 0.2; // Estimate 0.2s per frame for rendering

  return (
    <div className="bg-white dark:bg-[#0a0a0a] p-6 rounded-2xl shadow-sm border border-zinc-200/80 dark:border-zinc-800/80 space-y-6 transition-colors duration-300">
      <h2 className="text-lg font-semibold flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
        <Download className="w-5 h-5 text-indigo-500" />
        Export & Preview
      </h2>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-100 dark:border-zinc-800">
            <div className="text-zinc-500 mb-1 uppercase tracking-wider">Final Duration</div>
            <div className="font-mono font-bold text-zinc-900 dark:text-zinc-100">{duration.toFixed(1)}s</div>
          </div>
          <div className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-100 dark:border-zinc-800">
            <div className="text-zinc-500 mb-1 uppercase tracking-wider">Est. Render Time</div>
            <div className="font-mono font-bold text-zinc-900 dark:text-zinc-100">{estRenderTime.toFixed(1)}s</div>
          </div>
        </div>

        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Export your animated chart as a video or GIF. The export process will capture the animation frame by frame at {fps} FPS.
        </p>

        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={onExportVideo}
            disabled={isExporting}
            className="flex flex-col items-center justify-center gap-2 p-4 border-2 border-zinc-200 dark:border-zinc-700 rounded-xl hover:border-indigo-500 dark:hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Video className="w-8 h-8 text-zinc-700 dark:text-zinc-300" />
            <span className="font-medium text-zinc-900 dark:text-zinc-100">Export MP4</span>
            <span className="text-xs text-zinc-500">1080p Video</span>
          </button>

          <button
            onClick={onExportGif}
            disabled={isExporting}
            className="flex flex-col items-center justify-center gap-2 p-4 border-2 border-zinc-200 dark:border-zinc-700 rounded-xl hover:border-indigo-500 dark:hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ImageIcon className="w-8 h-8 text-zinc-700 dark:text-zinc-300" />
            <span className="font-medium text-zinc-900 dark:text-zinc-100">Export GIF</span>
            <span className="text-xs text-zinc-500">Animated Image</span>
          </button>
        </div>

        {isExporting && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm font-medium text-zinc-700 dark:text-zinc-300">
              <span>Exporting...</span>
              <span>{Math.round(progress * 100)}%</span>
            </div>
            <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-2.5">
              <div
                className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${progress * 100}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
