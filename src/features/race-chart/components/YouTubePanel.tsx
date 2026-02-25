import React, { useState } from 'react';
import { Youtube, Wand2, UploadCloud, Loader2, ChevronDown, ChevronRight } from 'lucide-react';
import { YouTubeMetadata } from '../../../types';
import { GoogleGenAI } from '@google/genai';

interface YouTubePanelProps {
  metadata: YouTubeMetadata;
  onMetadataChange: (metadata: YouTubeMetadata) => void;
  onUpload: () => void;
  isUploading: boolean;
  chartTitle: string;
}

export default function YouTubePanel({ metadata, onMetadataChange, onUpload, isUploading, chartTitle }: YouTubePanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
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
    <div className="bg-white dark:bg-[#0a0a0a] rounded-2xl shadow-sm border border-zinc-200/80 dark:border-zinc-800/80 overflow-hidden transition-all duration-300">
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-6 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${isExpanded ? 'bg-red-500 text-white' : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-500'}`}>
            <Youtube className="w-5 h-5" />
          </div>
          <div className="text-left">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">YouTube Integration</h2>
            <p className="text-xs text-zinc-500">SEO & Direct Upload</p>
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
            <div className="flex justify-between items-center bg-zinc-50 dark:bg-zinc-900/50 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800">
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                Direct Upload
              </p>
              <button
                onClick={generateMetadata}
                disabled={isGenerating || !chartTitle}
                className="flex items-center gap-2 py-1.5 px-3 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 rounded-lg text-xs font-bold border border-zinc-200 dark:border-zinc-700 transition-all active:scale-[0.98] shadow-sm"
              >
                {isGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
                AI Auto-Fill
              </button>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-zinc-400 dark:text-zinc-500 mb-2 uppercase tracking-wider">Video Title</label>
              <input
                type="text"
                value={metadata.title}
                onChange={(e) => handleChange('title', e.target.value)}
                maxLength={100}
                placeholder="Enter video title..."
                className="w-full p-2.5 text-sm border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50/50 dark:bg-zinc-900/50 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-red-500/10 focus:border-red-500 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-zinc-400 dark:text-zinc-500 mb-2 uppercase tracking-wider">Description</label>
              <textarea
                value={metadata.description}
                onChange={(e) => handleChange('description', e.target.value)}
                rows={4}
                placeholder="Enter video description..."
                className="w-full p-2.5 text-sm border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50/50 dark:bg-zinc-900/50 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-red-500/10 focus:border-red-500 outline-none transition-all resize-y"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-zinc-400 dark:text-zinc-500 mb-2 uppercase tracking-wider">Tags (comma separated)</label>
              <input
                type="text"
                value={metadata.tags.join(', ')}
                onChange={(e) => handleChange('tags', e.target.value.split(',').map(t => t.trim()))}
                placeholder="data, visualization, chart..."
                className="w-full p-2.5 text-sm border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50/50 dark:bg-zinc-900/50 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-red-500/10 focus:border-red-500 outline-none transition-all"
              />
            </div>

            {error && (
              <div className="p-3 text-xs text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 rounded-xl border border-red-100 dark:border-red-900/30">
                {error}
              </div>
            )}

            <button
              onClick={onUpload}
              disabled={isUploading || !metadata.title}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-red-600/20 active:scale-[0.98]"
            >
              {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <UploadCloud className="w-5 h-5" />}
              {isUploading ? 'Uploading to YouTube...' : 'Upload to YouTube'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
