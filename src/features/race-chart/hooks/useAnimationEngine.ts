import { useRef, useEffect, useState, useCallback } from 'react';
import { AnimationEngine } from '../../../core/AnimationEngine';

export function useAnimationEngine(totalFrames: number, durationPerFrame: number, speed: number, isLooping: boolean) {
  const engineRef = useRef<AnimationEngine | null>(null);
  if (!engineRef.current) {
    engineRef.current = new AnimationEngine();
  }
  const engine = engineRef.current;

  const [isPlaying, setIsPlaying] = useState(false);
  const [timeIndex, setTimeIndex] = useState(0);

  useEffect(() => {
    engine.setConfig(totalFrames, durationPerFrame);
  }, [engine, totalFrames, durationPerFrame]);

  useEffect(() => {
    engine.setSpeed(speed);
  }, [engine, speed]);

  useEffect(() => {
    engine.setLooping(isLooping);
  }, [engine, isLooping]);

  useEffect(() => {
    const unsubscribe = engine.subscribe((newTimeIndex, newIsPlaying) => {
      // Dispatch event for D3
      window.dispatchEvent(new CustomEvent('time-update', { detail: newTimeIndex }));
      
      // Update React state only when necessary to avoid re-renders
      setIsPlaying(prev => {
        if (prev !== newIsPlaying) return newIsPlaying;
        return prev;
      });
      
      // Update timeIndex state only when paused or manually scrubbed
      // During playback, we rely on the custom event and direct DOM updates for performance
      if (!newIsPlaying) {
        setTimeIndex(newTimeIndex);
      }
      
      // Direct DOM updates for UI elements to bypass React render cycle
      const slider = document.getElementById('time-slider') as HTMLInputElement;
      if (slider) slider.value = newTimeIndex.toString();
      const timeDisplay = document.getElementById('time-display');
      if (timeDisplay) timeDisplay.innerText = `${Math.floor(newTimeIndex)} / ${Math.max(0, totalFrames - 1)}`;
    });
    return unsubscribe;
  }, [engine, totalFrames]);

  return {
    engine,
    isPlaying,
    timeIndex: isPlaying ? engine.getTimeIndex() : timeIndex,
  };
}
