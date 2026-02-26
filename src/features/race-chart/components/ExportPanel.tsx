import React, { useState, useEffect } from 'react';
import { Download, Video, Image as ImageIcon, Loader2, ChevronDown, ChevronRight, Play, Pause, X } from 'lucide-react';
import { VideoExportController } from '../../../export/ExportController';
import { getDeviceInfo } from '../../../export/DeviceDetector';

interface ExportPanelProps {
  onExportVideo: () => void;
  onExportGif: () => void;
  isExporting: boolean;
  progress: number;
  totalFrames: number;
  fps: number;
  exportResult: { type: 'video' | 'gif' | 'zip', url: string } | null;
  onDownload: () => void;
  exportController: VideoExportController;
}

export default function ExportPanel({ onExportVideo, onExportGif, isExporting, progress, totalFrames, fps, exportResult, onDownload, exportController }: ExportPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [methodInfo, setMethodInfo] = useState({ method: '', format: '' });
  const [eta, setEta] = useState('');
  const [sizeBytes, setSizeBytes] = useState(0);
  const [currentFrame, setCurrentFrame] = useState(0);
  
  const [resolution, setResolution] = useState<'480p' | '720p' | '1080p' | 'custom'>(exportController.settings.resolution);
  const [customW, setCustomW] = useState(exportController.settings.customWidth);
  const [customH, setCustomH] = useState(exportController.settings.customHeight);
  const [exportFps, setExportFps] = useState<24 | 30 | 60>(exportController.settings.fps);
  const [bitrate, setBitrate] = useState(exportController.settings.videoBitrate);
  
  const info = getDeviceInfo();

  useEffect(() => {
    exportController.settings.resolution = resolution;
    exportController.settings.customWidth = customW;
    exportController.settings.customHeight = customH;
    exportController.settings.fps = exportFps;
    exportController.settings.videoBitrate = bitrate;
  }, [resolution, customW, customH, exportFps, bitrate, exportController]);

  useEffect(() => {
    const handleProgress = (pct: number, frame: number, total: number, etaStr: string, bytes: number) => {
      setCurrentFrame(frame);
      setEta(etaStr);
      setSizeBytes(bytes);
    };
    const handleMethod = (method: string, format: string) => {
      setMethodInfo({ method, format });
    };
    
    // We need to proxy the callbacks to keep our local state updated, while also calling the original ChartPanel callbacks
    const origProgress = exportController.onProgress;
    const origMethod = exportController.onMethodDetected;
    
    exportController.onProgress = (pct, frame, total, etaStr, bytes) => {
      handleProgress(pct, frame, total, etaStr, bytes);
      origProgress(pct, frame, total, etaStr, bytes);
    };
    
    exportController.onMethodDetected = (method, format) => {
      handleMethod(method, format);
      origMethod(method, format);
    };
    
    return () => {
      exportController.onProgress = origProgress;
      exportController.onMethodDetected = origMethod;
    };
  }, [exportController]);

  const durationMs = (totalFrames - 1) * exportController.settings.durationPerFrame;
  const estSeconds = durationMs / 1000;
  const estMb = (bitrate * estSeconds) / 8 / 1_000_000 * 1.1;

  const handleCancel = () => {
    exportController.cancelExport();
  };

  const handlePauseResume = () => {
    if (exportController.isPaused) {
      exportController.resumeExport();
    } else {
      exportController.pauseExport();
    }
  };

  return (
    <div className="bg-white dark:bg-[#0a0a0a] rounded-2xl shadow-sm border border-zinc-200/80 dark:border-zinc-800/80 overflow-hidden transition-all duration-300">
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-6 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${isExpanded ? 'bg-indigo-500 text-white' : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-500'}`}>
            <Video className="w-5 h-5" />
          </div>
          <div className="text-left">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Export Video</h2>
            <p className="text-xs text-zinc-500">Render MP4 or WebM</p>
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
          
          {!isExporting && !exportResult && (
            <div className="space-y-6">
              <div className="p-3 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-600 dark:text-zinc-400">
                <div className="font-semibold text-zinc-900 dark:text-zinc-100 mb-1">Export Method: Auto-detected</div>
                <div className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  {info.supportsMediaRecorder ? `${info.bestMimeType || 'video/webm'} (MediaRecorder)` : 'Frames ZIP Fallback'}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">Resolution</label>
                <div className="flex flex-wrap gap-3">
                  {(['480p', '720p', '1080p', 'custom'] as const).map(res => (
                    <label key={res} className="flex items-center gap-2 text-sm cursor-pointer">
                      <input 
                        type="radio" 
                        name="resolution" 
                        value={res} 
                        checked={resolution === res}
                        onChange={() => setResolution(res)}
                        className="text-indigo-600 focus:ring-indigo-500"
                      />
                      {res === '480p' ? '480p (854×480)' : res === '720p' ? '720p (1280×720)' : res === '1080p' ? '1080p (1920×1080)' : 'Custom'}
                    </label>
                  ))}
                </div>
                {resolution === 'custom' && (
                  <div className="flex gap-4 mt-2">
                    <input type="number" value={customW} onChange={e => setCustomW(Number(e.target.value))} className="w-24 px-2 py-1 text-sm border rounded dark:bg-zinc-800 dark:border-zinc-700" placeholder="Width" />
                    <input type="number" value={customH} onChange={e => setCustomH(Number(e.target.value))} className="w-24 px-2 py-1 text-sm border rounded dark:bg-zinc-800 dark:border-zinc-700" placeholder="Height" />
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <label className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">Frame Rate</label>
                <div className="flex gap-4">
                  {([24, 30, 60] as const).map(f => (
                    <label key={f} className="flex items-center gap-2 text-sm cursor-pointer">
                      <input 
                        type="radio" 
                        name="fps" 
                        value={f} 
                        checked={exportFps === f}
                        onChange={() => setExportFps(f)}
                        className="text-indigo-600 focus:ring-indigo-500"
                      />
                      {f} fps
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">Quality (Bitrate)</label>
                <input 
                  type="range" 
                  min="500000" 
                  max="10000000" 
                  step="500000"
                  value={bitrate}
                  onChange={e => setBitrate(Number(e.target.value))}
                  className="w-full accent-indigo-600"
                />
                <div className="flex justify-between text-xs text-zinc-500">
                  <span>Draft</span>
                  <span>{(bitrate / 1_000_000).toFixed(1)} Mbps</span>
                  <span>High</span>
                </div>
              </div>

              <div className="p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Estimated duration:</span>
                  <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">~{estSeconds.toFixed(1)}s</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Estimated file size:</span>
                  <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">~{estMb.toFixed(1)} MB</span>
                </div>
              </div>

              {info.isAndroid && (
                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-xl text-xs text-amber-800 dark:text-amber-200">
                  ⚠ Android note: exports as .webm file. Plays in Chrome, VLC, or can be converted free online.
                </div>
              )}

              <button
                onClick={onExportVideo}
                className="w-full flex items-center justify-center gap-2 p-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold shadow-lg shadow-indigo-500/20 transition-all active:scale-[0.98]"
              >
                <Play className="w-5 h-5" />
                Start Export
              </button>
            </div>
          )}

          {isExporting && (
            <div className="space-y-4 p-6 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-zinc-200 dark:border-zinc-800">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2 text-sm font-bold text-indigo-600 dark:text-indigo-400">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Recording... Frame {currentFrame} / {Math.ceil(estSeconds * exportFps)}
                </div>
                <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{Math.round(progress * 100)}%</span>
              </div>
              
              <div className="w-full bg-zinc-200 dark:bg-zinc-800 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-indigo-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${progress * 100}%` }}
                ></div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs text-zinc-500 mt-4">
                <div>ETA: ~{eta}</div>
                <div className="text-right">Size so far: {(sizeBytes / 1024 / 1024).toFixed(1)} MB</div>
              </div>

              <div className="flex gap-3 mt-6">
                <button 
                  onClick={handlePauseResume}
                  className="flex-1 flex items-center justify-center gap-2 py-2 px-4 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 rounded-xl text-sm font-bold transition-colors"
                >
                  {exportController.isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                  {exportController.isPaused ? 'Resume' : 'Pause'}
                </button>
                <button 
                  onClick={handleCancel}
                  className="flex-1 flex items-center justify-center gap-2 py-2 px-4 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 rounded-xl text-sm font-bold transition-colors"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
              </div>
            </div>
          )}

          {exportResult && !isExporting && (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-900/30 rounded-2xl flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-full text-green-600 dark:text-green-400">
                  <Video className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Export Complete!</h3>
                  <p className="text-xs text-zinc-500">Your file is ready to download.</p>
                </div>
              </div>
              
              <button
                onClick={onDownload}
                className="w-full flex items-center justify-center gap-2 p-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold shadow-lg shadow-indigo-500/20 transition-all active:scale-[0.98]"
              >
                <Download className="w-5 h-5" />
                Download {exportResult.type === 'video' ? 'Video' : 'ZIP'}
              </button>
              
              <button
                onClick={() => window.location.reload()}
                className="w-full text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300 underline text-center"
              >
                Export Another File
              </button>

              {info.isAndroid && (
                <div className="text-center text-xs text-zinc-500 mt-4">
                  📱 Android users: file is in Downloads<br/>
                  Open with Chrome or VLC to play
                </div>
              )}
            </div>
          )}

        </div>
      )}
    </div>
  );
}
