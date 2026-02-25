import React, { useState } from 'react';
import { Mic, Music, Volume2, Play, Square, Loader2, ChevronDown, ChevronRight } from 'lucide-react';
import { AudioConfig } from '../../../types';
import { GoogleGenAI, Modality } from '@google/genai';

interface AudioPanelProps {
  config: AudioConfig;
  onConfigChange: (config: AudioConfig) => void;
}

export default function AudioPanel({ config, onConfigChange }: AudioPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  const handleChange = (key: keyof AudioConfig, value: any) => {
    onConfigChange({ ...config, [key]: value });
  };

  const generateVoiceover = async () => {
    if (!config.script.trim()) {
      setError('Please enter a script first.');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('Gemini API key is missing. Please configure it in AI Studio.');
      }

      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: config.script }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        const audioUrl = `data:audio/pcm;rate=24000;base64,${base64Audio}`;
        handleChange('voiceoverUrl', audioUrl);
      } else {
        throw new Error('No audio data received from the model.');
      }
    } catch (err: any) {
      console.error('Error generating voiceover:', err);
      setError(err.message || 'Failed to generate voiceover.');
    } finally {
      setIsGenerating(false);
    }
  };

  const togglePlay = () => {
    if (isPlaying && audioElement) {
      audioElement.pause();
      setIsPlaying(false);
    } else if (config.voiceoverUrl) {
      const audio = new Audio(config.voiceoverUrl);
      audio.onended = () => setIsPlaying(false);
      audio.play();
      setAudioElement(audio);
      setIsPlaying(true);
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
            <Mic className="w-5 h-5" />
          </div>
          <div className="text-left">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Audio & Voiceover</h2>
            <p className="text-xs text-zinc-500">AI Narration & Background Music</p>
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
            <div>
              <label className="block text-[10px] font-bold text-zinc-400 dark:text-zinc-500 mb-2 uppercase tracking-wider">
                Narration Script (AI Text-to-Speech)
              </label>
              <textarea
                value={config.script}
                onChange={(e) => handleChange('script', e.target.value)}
                placeholder="Enter the script for the AI voiceover..."
                className="w-full p-3 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50/50 dark:bg-zinc-900/50 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none resize-y transition-all"
                rows={4}
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={generateVoiceover}
                disabled={isGenerating || !config.script.trim()}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-600/20 transition-all active:scale-[0.98]"
              >
                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mic className="w-4 h-4" />}
                Generate Voiceover
              </button>

              {config.voiceoverUrl && (
                <button
                  onClick={togglePlay}
                  className="flex items-center gap-2 py-2.5 px-4 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 rounded-xl font-bold text-sm transition-all"
                >
                  {isPlaying ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  {isPlaying ? 'Stop' : 'Preview'}
                </button>
              )}
            </div>

            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 rounded-xl border border-red-100 dark:border-red-900/30">
                {error}
              </div>
            )}

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-zinc-200 dark:border-zinc-800" />
              </div>
              <div className="relative flex justify-center text-[10px] font-bold uppercase tracking-widest">
                <span className="bg-white dark:bg-[#0a0a0a] px-3 text-zinc-400">Background Music</span>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-zinc-400 dark:text-zinc-500 mb-2 uppercase tracking-wider flex items-center gap-2">
                <Music className="w-3 h-3" />
                Music URL
              </label>
              <input
                type="text"
                value={config.bgmUrl || ''}
                onChange={(e) => handleChange('bgmUrl', e.target.value)}
                placeholder="https://example.com/music.mp3"
                className="w-full p-2.5 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50/50 dark:bg-zinc-900/50 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
              />
            </div>

            <div className="flex items-center gap-4 p-3 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-3 flex-1">
                <Volume2 className="w-4 h-4 text-zinc-400" />
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={config.bgmVolume}
                  onChange={(e) => handleChange('bgmVolume', parseFloat(e.target.value))}
                  className="flex-1 accent-indigo-500"
                />
              </div>
              <label className="flex items-center gap-2 text-xs font-bold text-zinc-600 dark:text-zinc-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.loopBgm}
                  onChange={(e) => handleChange('loopBgm', e.target.checked)}
                  className="rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
                />
                Loop
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

