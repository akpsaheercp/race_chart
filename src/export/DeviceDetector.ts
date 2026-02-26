export interface DeviceInfo {
  isAndroid: boolean;
  isMobile: boolean;
  isChromeMobile: boolean;
  supportsMediaRecorder: boolean;
  supportsWebCodecs: boolean;
  bestMimeType: string;
  screenWidth: number;
  screenHeight: number;
}

function detectBestMimeType(): string {
  if (typeof MediaRecorder === 'undefined') return '';
  const types = [
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm',
    'video/mp4;codecs=h264',
    'video/mp4'
  ];
  for (const type of types) {
    if (MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }
  return '';
}

export function getDeviceInfo(): DeviceInfo {
  const ua = navigator.userAgent;
  return {
    isAndroid: /android/i.test(ua),
    isMobile: /android|iphone|ipad/i.test(ua),
    isChromeMobile: /chrome/i.test(ua) && /mobile/i.test(ua),
    supportsMediaRecorder: typeof MediaRecorder !== 'undefined',
    supportsWebCodecs: typeof VideoEncoder !== 'undefined',
    bestMimeType: detectBestMimeType(),
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
  };
}

export function detectBestExportMethod(): 'mediarecorder' | 'webcodecs' | 'frames-zip' {
  const info = getDeviceInfo();
  if (info.supportsMediaRecorder && info.bestMimeType) {
    return 'mediarecorder';
  }
  if (info.supportsWebCodecs) {
    return 'webcodecs';
  }
  return 'frames-zip';
}
