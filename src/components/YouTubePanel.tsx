import React, { useState } from 'react';
import { Youtube, Wand2, UploadCloud, Loader2 } from 'lucide-react';
import { YouTubeMetadata } from '../types';
import { GoogleGenAI } from '@google/genai';

interface YouTubePanelProps {
  metadata: YouTubeMetadata;
  onMetadataChange: (metadata: YouTubeMetadata) => void;
  onUpload: () => void;
  isUploading: boolean;
  chartTitle: string;
}

export default function YouTubePanel({ metadata, onMetadataChange, onUpload, isUploading, chartTitle }: YouTubePanelProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (key: keyof YouTubeMetadata, value: any) => {
    onMetadataChange({ ...metadata, [key]: value });
  };

  const generateMetadata = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('Gemini API key is missing. Please configure it in AI Studio.');
      }

      const ai = new GoogleGenAI({ apiKey });
      const prompt = `Generate SEO-friendly YouTube metadata for a data visualization video titled "${chartTitle}".
      Return ONLY a JSON object with the following structure:
      {
        "title": "A catchy, SEO-optimized title (max 100 chars)",
        "description": "A detailed description including hashtags",
        "tags": ["tag1", "tag2", "tag3"]
      }`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });

      const text = response.text;
      if (text) {
        const generated = JSON.parse(text);
        onMetadataChange({
          title: generated.title || metadata.title,
          description: generated.description || metadata.description,
          tags: generated.tags || metadata.tags,
        });
      }
    } catch (err: any) {
      console.error('Error generating metadata:', err);
      setError(err.message || 'Failed to generate metadata.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-white dark:bg-[#0a0a0a] p-6 rounded-2xl shadow-sm border border-zinc-200/80 dark:border-zinc-800/80 space-y-6 transition-colors duration-300">
      <h2 className="text-lg font-semibold flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
        <Youtube className="w-5 h-5 text-red-500" />
        YouTube Integration
      </h2>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Upload your exported video directly to YouTube.
          </p>
          <button
            onClick={generateMetadata}
            disabled={isGenerating || !chartTitle}
            className="flex items-center gap-2 py-1.5 px-3 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-zinc-800 dark:text-zinc-200 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
            AI Auto-Fill
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Video Title</label>
          <input
            type="text"
            value={metadata.title}
            onChange={(e) => handleChange('title', e.target.value)}
            maxLength={100}
            className="w-full p-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Description</label>
          <textarea
            value={metadata.description}
            onChange={(e) => handleChange('description', e.target.value)}
            rows={4}
            className="w-full p-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 resize-y"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Tags (comma separated)</label>
          <input
            type="text"
            value={metadata.tags.join(', ')}
            onChange={(e) => handleChange('tags', e.target.value.split(',').map(t => t.trim()))}
            className="w-full p-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
          />
        </div>

        {error && (
          <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 rounded-lg">
            {error}
          </div>
        )}

        <button
          onClick={onUpload}
          disabled={isUploading || !metadata.title}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg font-medium transition-colors shadow-sm"
        >
          {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <UploadCloud className="w-5 h-5" />}
          {isUploading ? 'Uploading to YouTube...' : 'Upload to YouTube'}
        </button>
      </div>
    </div>
  );
}
