import { VideoExporter, ExportSettings } from './VideoExporter';
import { detectBestExportMethod, getDeviceInfo } from './DeviceDetector';
import { renderSvgToCanvas } from './SvgToCanvas';

export class VideoExportController {
  public isRecording: boolean = false;
  public isPaused: boolean = false;
  private exporter: VideoExporter;
  private offscreenCanvas: HTMLCanvasElement;
  private totalFrames: number = 0;
  private capturedFrames: number = 0;
  private abortController: AbortController;
  private method: 'mediarecorder' | 'webcodecs' | 'frames-zip';
  
  public settings: ExportSettings = {
    resolution: '720p',
    customWidth: 1280,
    customHeight: 720,
    fps: 30,
    videoBitrate: 2_500_000,
    durationPerFrame: 600,
    includeAudio: false,
    quality: 'standard',
    theme: 'light'
  };

  public onProgress: (pct: number, currentFrame: number, totalFrames: number, eta: string, sizeBytes: number) => void = () => {};
  public onComplete: (blob: Blob, filename: string, sizeBytes: number) => void = () => {};
  public onError: (error: Error, recoverable: boolean) => void = () => {};
  public onMethodDetected: (method: string, format: string) => void = () => {};

  constructor() {
    this.exporter = new VideoExporter();
    this.offscreenCanvas = document.createElement('canvas');
    this.abortController = new AbortController();
    this.method = detectBestExportMethod();
    
    const info = getDeviceInfo();
    if (info.isAndroid) {
      this.settings.resolution = '720p';
      this.settings.videoBitrate = 1_500_000;
      this.settings.fps = 24;
    }
  }

  private getDimensions() {
    if (this.settings.resolution === '480p') return { w: 854, h: 480 };
    if (this.settings.resolution === '720p') return { w: 1280, h: 720 };
    if (this.settings.resolution === '1080p') return { w: 1920, h: 1080 };
    return { w: this.settings.customWidth, h: this.settings.customHeight };
  }

  async startExport(svgElement: SVGSVGElement, totalDataFrames: number, chartType: string, threeCanvas?: HTMLCanvasElement | null): Promise<void> {
    this.isRecording = true;
    this.isPaused = false;
    this.totalFrames = totalDataFrames;
    this.capturedFrames = 0;
    this.abortController = new AbortController();

    const { w, h } = this.getDimensions();
    this.offscreenCanvas.width = w;
    this.offscreenCanvas.height = h;

    const info = getDeviceInfo();
    this.onMethodDetected(this.method, info.bestMimeType || 'video/webm');

    try {
      if (this.method === 'mediarecorder') {
        await this.exporter.startMediaRecorder(this.offscreenCanvas, this.settings.fps, this.settings.videoBitrate);
      }

      const durationMs = (this.totalFrames - 1) * this.settings.durationPerFrame;
      const totalVideoFrames = Math.ceil(durationMs / 1000 * this.settings.fps);
      const step = (this.totalFrames - 1) / totalVideoFrames;

      const startTime = Date.now();

      for (let f = 0; f < totalVideoFrames; f++) {
        if (this.abortController.signal.aborted) break;
        while (this.isPaused) {
          await new Promise(r => setTimeout(r, 100));
          if (this.abortController.signal.aborted) break;
        }
        if (this.abortController.signal.aborted) break;

        const engineIndex = f * step;
        window.dispatchEvent(new CustomEvent('time-update', { detail: engineIndex }));
        
        await new Promise(r => setTimeout(r, 10)); // Wait for D3

        // Render SVG to canvas
        await renderSvgToCanvas(svgElement, this.offscreenCanvas, w, h, this.settings.theme);

        // If 3D, composite the 3D canvas
        if (threeCanvas) {
          const ctx = this.offscreenCanvas.getContext('2d');
          if (ctx) {
            // Draw 3D canvas behind the SVG content (which was already drawn with background)
            // Wait, renderSvgToCanvas draws background.
            // If 3D, we should draw 3D canvas FIRST, then SVG (without background if possible)
            // Or just draw 3D canvas on top if it has transparency? 
            // Usually 3D is the background.
            
            // Let's re-think:
            // 1. Fill background color
            // 2. Draw 3D canvas
            // 3. Draw SVG (with transparent background)
            
            // I need to modify renderSvgToCanvas to support transparent background.
            await renderSvgToCanvas(svgElement, this.offscreenCanvas, w, h, this.settings.theme, threeCanvas);
          }
        }

        if (this.method === 'frames-zip') {
          await this.exporter.captureFrameAsBlob(this.offscreenCanvas);
        }

        this.capturedFrames++;
        
        const elapsed = Date.now() - startTime;
        const timePerFrame = elapsed / this.capturedFrames;
        const remainingFrames = totalVideoFrames - this.capturedFrames;
        const etaSeconds = Math.round((remainingFrames * timePerFrame) / 1000);
        const etaString = `${etaSeconds}s`;
        
        const estimatedTotalBytes = (this.settings.videoBitrate * (durationMs / 1000)) / 8;
        const currentBytes = (this.capturedFrames / totalVideoFrames) * estimatedTotalBytes;

        this.onProgress(this.capturedFrames / totalVideoFrames, this.capturedFrames, totalVideoFrames, etaString, currentBytes);
      }

      if (!this.abortController.signal.aborted) {
        await this.finalizeAndDownload(chartType);
      }

    } catch (err) {
      this.isRecording = false;
      this.onError(err as Error, false);
    }
  }

  pauseExport(): void {
    this.isPaused = true;
  }

  resumeExport(): void {
    this.isPaused = false;
  }

  cancelExport(): void {
    this.abortController.abort();
    this.isRecording = false;
    this.isPaused = false;
    if (this.method === 'mediarecorder') {
      this.exporter.stopMediaRecorder();
    }
  }

  async finalizeAndDownload(chartType: string): Promise<void> {
    this.isRecording = false;
    let blob: Blob;
    let ext = 'webm';

    if (this.method === 'mediarecorder') {
      blob = await this.exporter.stopMediaRecorder();
      if (blob.type.includes('mp4')) ext = 'mp4';
    } else {
      blob = await this.exporter.finalizeFramesZip();
      ext = 'zip'; // Or pngs
    }

    const date = new Date().toISOString().split('T')[0];
    const filename = `race_chart_${chartType}_${this.settings.resolution}_${date}.${ext}`;

    this.onComplete(blob, filename, blob.size);
  }
}
