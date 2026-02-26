import { getDeviceInfo } from './DeviceDetector';
import { createZipFromFrames } from './ZipFallback';

export interface ExportSettings {
  resolution: '720p' | '1080p' | '480p' | 'custom';
  customWidth: number;
  customHeight: number;
  fps: 24 | 30 | 60;
  videoBitrate: number;
  durationPerFrame: number;
  includeAudio: boolean;
  quality: 'draft' | 'standard' | 'high';
  theme: string;
}

export class VideoExporter {
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private frames: Blob[] = [];
  private stream: MediaStream | null = null;

  async startMediaRecorder(canvas: HTMLCanvasElement, fps: number, bitrate: number): Promise<void> {
    const info = getDeviceInfo();
    this.stream = canvas.captureStream(fps);
    const mimeType = info.bestMimeType || 'video/webm';
    
    this.mediaRecorder = new MediaRecorder(this.stream, {
      mimeType,
      videoBitsPerSecond: bitrate
    });

    this.recordedChunks = [];
    this.mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        this.recordedChunks.push(e.data);
      }
    };

    this.mediaRecorder.start();
  }

  stopMediaRecorder(): Promise<Blob> {
    return new Promise((resolve) => {
      if (!this.mediaRecorder) {
        resolve(new Blob());
        return;
      }
      
      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.recordedChunks, { type: this.mediaRecorder?.mimeType || 'video/webm' });
        this.recordedChunks = [];
        if (this.stream) {
          this.stream.getTracks().forEach(track => track.stop());
        }
        resolve(blob);
      };
      
      if (this.mediaRecorder.state !== 'inactive') {
        this.mediaRecorder.stop();
      } else {
        resolve(new Blob());
      }
    });
  }

  async captureFrameAsBlob(canvas: HTMLCanvasElement): Promise<void> {
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) this.frames.push(blob);
        resolve();
      }, 'image/png');
    });
  }

  async finalizeFramesZip(): Promise<Blob> {
    const zipBlob = await createZipFromFrames(this.frames);
    this.frames = [];
    return zipBlob;
  }
}
