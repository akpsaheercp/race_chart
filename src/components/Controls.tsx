import React from 'react';
import { Play, Pause, SkipBack, SkipForward, RotateCcw, Repeat, Maximize, Minimize } from 'lucide-react';

interface ControlsProps {
  isPlaying: boolean;
  onPlayPause: () => void;
  onRestart: () => void;
  currentTimeIndex: number;
  totalFrames: number;
  onTimeIndexChange: (index: number) => void;
  speed: number;
  onSpeedChange: (speed: number) => void;
  isLooping: boolean;
  onLoopToggle: () => void;
  isFullscreen: boolean;
  onFullscreenToggle: () => void;
}

export default function Controls({
  isPlaying,
  onPlayPause,
  onRestart,
  currentTimeIndex,
  totalFrames,
  onTimeIndexChange,
  speed,
  onSpeedChange,
  isLooping,
  onLoopToggle,
  isFullscreen,
  onFullscreenToggle
}: ControlsProps) {
  return (
    <div className="bg-white dark:bg-[#0a0a0a] p-5 rounded-2xl shadow-sm border border-zinc-200/80 dark:border-zinc-800/80 flex flex-col gap-5 transition-colors duration-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={onRestart}
            className="p-2.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-all active:scale-95"
            title="Restart"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
          <button
            onClick={() => onTimeIndexChange(Math.max(0, currentTimeIndex - 1))}
            className="p-2.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-all active:scale-95"
            title="Previous Frame"
          >
            <SkipBack className="w-5 h-5" />
          </button>
          <button
            onClick={onPlayPause}
            className="p-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 transition-all active:scale-95"
            title={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
          </button>
          <button
            onClick={() => onTimeIndexChange(Math.min(totalFrames - 1, currentTimeIndex + 1))}
            className="p-2.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-all active:scale-95"
            title="Next Frame"
          >
            <SkipForward className="w-5 h-5" />
          </button>
          <div className="w-px h-6 bg-zinc-200 dark:bg-zinc-800 mx-2"></div>
          <button
            onClick={onLoopToggle}
            className={`p-2.5 rounded-xl transition-all active:scale-95 ${isLooping ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' : 'hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'}`}
            title="Toggle Loop"
          >
            <Repeat className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Speed</span>
            <input
              type="range"
              min="0.5"
              max="3"
              step="0.5"
              value={speed}
              onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
              className="w-24 accent-indigo-500"
            />
            <span className="text-sm font-mono text-zinc-600 dark:text-zinc-300 w-8">{speed}x</span>
          </div>
          <div className="w-px h-6 bg-zinc-200 dark:bg-zinc-800 mx-1"></div>
          <button
            onClick={onFullscreenToggle}
            className="p-2.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-all active:scale-95"
            title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
          >
            {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <span id="time-display" className="text-xs font-mono text-zinc-500 dark:text-zinc-400 w-12">{Math.floor(currentTimeIndex)} / {totalFrames - 1}</span>
        <input
          id="time-slider"
          type="range"
          min="0"
          max={Math.max(0, totalFrames - 1)}
          step="0.01"
          defaultValue={currentTimeIndex}
          onChange={(e) => onTimeIndexChange(parseFloat(e.target.value))}
          className="flex-1 accent-indigo-500"
        />
      </div>
    </div>
  );
}
