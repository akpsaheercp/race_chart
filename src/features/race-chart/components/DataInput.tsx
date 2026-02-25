import React, { useState } from 'react';
import { Upload, FileText, Database, Table, CheckCircle2, ChevronDown, ChevronRight } from 'lucide-react';
import { parseCSV, generateColors } from '../../../core/dataProcessor';
import { DataPoint, ChartConfig, AudioConfig, YouTubeMetadata } from '../../../types';
import { SAMPLE_DATASETS, SampleDataset } from '../../../sampleData';

interface DataInputProps {
  onDataLoaded: (data: DataPoint[], colors: Record<string, string>, config?: Partial<ChartConfig>, youtube?: Partial<YouTubeMetadata>, audio?: Partial<AudioConfig>) => void;
}

export default function DataInput({ onDataLoaded }: DataInputProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [csvText, setCsvText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<DataPoint[]>([]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        setCsvText(text);
        processData(text);
      };
      reader.onerror = () => setError('Failed to read file');
      reader.readAsText(file);
    }
  };

  const processData = (text: string) => {
    try {
      const parsedData = parseCSV(text);
      if (parsedData.length === 0) {
        setError('No valid data found in CSV. Ensure the first column is time/date and subsequent columns are numeric values.');
        return;
      }
      const names = Array.from(new Set(parsedData.map(d => d.name)));
      const colors = generateColors(names);
      onDataLoaded(parsedData, colors);
      setPreviewData(parsedData.slice(0, 10));
      setError(null);
      setSuccess('Data processed successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Error parsing data');
    }
  };

  const loadSample = (sample: SampleDataset) => {
    const names = Array.from(new Set(sample.data.map(d => d.name)));
    const colors = generateColors(names);
    onDataLoaded(
      sample.data, 
      colors, 
      sample.config, 
      { title: sample.youtubeTitle }, 
      { script: sample.aiScript }
    );
    setPreviewData(sample.data.slice(0, 10));
    setCsvText('');
    setError(null);
    setSuccess(`Sample "${sample.name}" loaded successfully!`);
    setTimeout(() => setSuccess(null), 3000);
  };

  return (
    <div className="bg-white dark:bg-[#0a0a0a] rounded-2xl shadow-sm border border-zinc-200/80 dark:border-zinc-800/80 overflow-hidden transition-all duration-300">
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-6 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${isExpanded ? 'bg-indigo-500 text-white' : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-500'}`}>
            <Database className="w-5 h-5" />
          </div>
          <div className="text-left">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Data Source</h2>
            <p className="text-xs text-zinc-500">CSV, JSON, or Sample Packs</p>
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
              <label className="block text-[10px] font-bold text-zinc-400 dark:text-zinc-500 mb-2 uppercase tracking-wider">Load Sample Data Pack</label>
              <div className="grid grid-cols-1 gap-2">
                {SAMPLE_DATASETS.map((sample, idx) => (
                  <button
                    key={idx}
                    onClick={() => loadSample(sample)}
                    className="text-left p-3 text-sm border border-zinc-200 dark:border-zinc-700 rounded-lg hover:border-indigo-500 dark:hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all group"
                  >
                    <div className="font-medium text-zinc-900 dark:text-zinc-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">{sample.name}</div>
                    <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Mode: {sample.config.type} race</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-zinc-200 dark:border-zinc-800" />
              </div>
              <div className="relative flex justify-center text-[10px] font-bold uppercase tracking-widest">
                <span className="bg-white dark:bg-[#0a0a0a] px-3 text-zinc-400">Or upload your own</span>
              </div>
            </div>

            <div className="flex items-center justify-center w-full">
              <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-zinc-200 dark:border-zinc-800 border-dashed rounded-xl cursor-pointer bg-zinc-50/50 dark:bg-zinc-900/30 hover:bg-zinc-100 dark:hover:bg-zinc-900/50 transition-colors">
                <div className="flex flex-col items-center justify-center pt-2 pb-2">
                  <Upload className="w-6 h-6 mb-1 text-zinc-400" />
                  <p className="text-xs text-zinc-500"><span className="font-semibold">Click to upload</span> CSV/JSON</p>
                </div>
                <input type="file" className="hidden" accept=".csv,.json" onChange={handleFileUpload} />
              </label>
            </div>

            <textarea
              className="w-full p-3 text-sm border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50/50 dark:bg-zinc-900/50 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none resize-y transition-all"
              rows={3}
              placeholder="Paste CSV data here..."
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
            />
            
            <button
              onClick={() => processData(csvText)}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-600/20 transition-all active:scale-[0.98]"
            >
              Process Data
            </button>

            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 rounded-xl border border-red-100 dark:border-red-900/30">
                {error}
              </div>
            )}

            {success && (
              <div className="p-3 text-sm text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400 rounded-xl border border-emerald-100 dark:border-emerald-900/30 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                {success}
              </div>
            )}

            {previewData.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                  <Table className="w-3 h-3" />
                  Dataset Preview (First 10 rows)
                </div>
                <div className="overflow-x-auto border border-zinc-200 dark:border-zinc-800 rounded-xl">
                  <table className="w-full text-[10px] text-left">
                    <thead className="bg-zinc-50 dark:bg-zinc-900/50 text-zinc-400 uppercase font-bold">
                      <tr>
                        <th className="px-3 py-2">Date</th>
                        <th className="px-3 py-2">Name</th>
                        <th className="px-3 py-2">Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                      {previewData.map((row, i) => (
                        <tr key={i} className="bg-white dark:bg-transparent">
                          <td className="px-3 py-2 text-zinc-900 dark:text-zinc-100 font-medium">{row.date}</td>
                          <td className="px-3 py-2 text-zinc-900 dark:text-zinc-100">{row.name}</td>
                          <td className="px-3 py-2 text-zinc-900 dark:text-zinc-100 font-mono">{row.value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

