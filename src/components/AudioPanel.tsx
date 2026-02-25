import React, { useState } from 'react';
import { Mic, Music, Volume2, Play, Square, Loader2 } from 'lucide-react';
import { AudioConfig } from '../types';
import { GoogleGenAI, Modality } from '@google/genai';

interface AudioPanelProps {
  config: AudioConfig;
  onConfigChange: (config: AudioConfig) => void;
}

export default function AudioPanel({ config, onConfigChange }: AudioPanelProps) {
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
    <div className="bg-white dark:bg-[#0a0a0a] p-6 rounded-2xl shadow-sm border border-zinc-200/80 dark:border-zinc-800/80 space-y-6 transition-colors duration-300">
      <h2 className="text-lg font-semibold flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
        <Mic className="w-5 h-5 text-indigo-500" />
        Audio & Voiceover
      </h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            Narration Script (AI Text-to-Speech)
          </label>
          <textarea
            value={config.script}
            onChange={(e) => handleChange('script', e.target.value)}
            placeholder="Enter the script for the AI voiceover..."
            className="w-full p-3 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-y"
            rows={4}
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={generateVoiceover}
            disabled={isGenerating || !config.script.trim()}
            className="flex items-center gap-2 py-2 px-4 bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
          >
            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mic className="w-4 h-4" />}
            Generate Voiceover
          </button>

          {config.voiceoverUrl && (
            <button
              onClick={togglePlay}
              className="flex items-center gap-2 py-2 px-4 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-zinc-800 dark:text-zinc-200 rounded-lg font-medium transition-colors"
            >
              {isPlaying ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {isPlaying ? 'Stop' : 'Preview'}
            </button>
          )}
        </div>

        {error && (
          <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 rounded-lg">
            {error}
          </div>
        )}

        <hr className="border-zinc-200 dark:border-zinc-700" />

        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1 flex items-center gap-2">
            <Music className="w-4 h-4" />
            Background Music URL
          </label>
          <input
            type="text"
            value={config.bgmUrl || ''}
            onChange={(e) => handleChange('bgmUrl', e.target.value)}
            placeholder="https://example.com/music.mp3"
            className="w-full p-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
          />
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 flex-1">
            <Volume2 className="w-4 h-4 text-zinc-500" />
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
          <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
            <input
              type="checkbox"
              checked={config.loopBgm}
              onChange={(e) => handleChange('loopBgm', e.target.checked)}
              className="rounded text-indigo-500 focus:ring-indigo-500"
            />
            Loop
          </label>
        </div>
      </div>
    </div>
  );
}
