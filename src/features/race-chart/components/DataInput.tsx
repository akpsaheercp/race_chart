import React, { useState } from 'react';
import { Upload, FileText, Database, Table, CheckCircle2, ChevronDown, ChevronRight, Download, Columns, Layers } from 'lucide-react';
import { parseCSV, generateColors } from '../../../core/dataProcessor';
import { DataPoint, ChartConfig, AudioConfig, YouTubeMetadata } from '../../../types';
import { SAMPLE_DATASETS, SampleDataset } from '../../../sampleData';

interface DataInputProps {
  config: ChartConfig;
  onDataLoaded: (data: DataPoint[], colors: Record<string, string>, config?: Partial<ChartConfig>, youtube?: Partial<YouTubeMetadata>, audio?: Partial<AudioConfig>) => void;
}

export default function DataInput({ config, onDataLoaded }: DataInputProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [csvText, setCsvText] = useState('');
  const [secondaryCsvText, setSecondaryCsvText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<DataPoint[]>([]);

  // Column selection state
  const [parsedRawData, setParsedRawData] = useState<DataPoint[]>([]);
  const [parsedConfig, setParsedConfig] = useState<Partial<ChartConfig>>({});
  const [availableColumns, setAvailableColumns] = useState<string[]>([]);
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [isColumnSelectionMode, setIsColumnSelectionMode] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, isSecondary: boolean = false) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (isSecondary) {
          setSecondaryCsvText(text);
          processSecondaryData(text);
        } else {
          setCsvText(text);
          processData(text);
        }
      };
      reader.onerror = () => setError('Failed to read file');
      reader.readAsText(file);
    }
  };

  const processData = (text: string) => {
    try {
      const { data: parsedData, config: parsedConfigData } = parseCSV(text);
      if (parsedData.length === 0) {
        setError('No valid data found in CSV. Ensure the first column is time/date and subsequent columns are numeric values.');
        return;
      }
      const names = Array.from(new Set(parsedData.map(d => d.name)));
      setParsedRawData(parsedData);
      setParsedConfig(parsedConfigData);
      setAvailableColumns(names);
      setSelectedColumns(names);
      setIsColumnSelectionMode(true);
      setError(null);
      setSuccess('Data parsed successfully! Please select columns to race.');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Error parsing data');
    }
  };

  const processSecondaryData = (text: string) => {
    try {
      const { data: parsedData } = parseCSV(text);
      if (parsedData.length === 0) {
        setError('No valid data found in secondary CSV.');
        return;
      }

      // Validate dates match primary data
      if (config.data.length > 0) {
        const primaryDates = new Set(config.data.map(d => d.date));
        const secondaryDates = new Set(parsedData.map(d => d.date));
        
        for (const date of secondaryDates) {
          if (!primaryDates.has(date)) {
            setError(`Secondary data contains date ${date} which is not in primary data.`);
            return;
          }
        }
      }

      onDataLoaded(config.data, config.colors, { secondaryData: parsedData });
      setSecondaryCsvText('');
      setError(null);
      setSuccess('Secondary data loaded successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Error parsing secondary data');
    }
  };

  const applyColumnSelection = () => {
    if (selectedColumns.length === 0) {
      setError('Please select at least one column to race.');
      return;
    }
    const filteredData = parsedRawData.filter(d => selectedColumns.includes(d.name));
    const colors = generateColors(selectedColumns);
    onDataLoaded(filteredData, colors, parsedConfig);
    setPreviewData(filteredData.slice(0, 10));
    setIsColumnSelectionMode(false);
    setError(null);
    setSuccess('Data loaded successfully!');
    setTimeout(() => setSuccess(null), 3000);
  };

  const toggleColumn = (col: string) => {
    setSelectedColumns(prev => 
      prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col]
    );
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
    setIsColumnSelectionMode(false);
    setError(null);
    setSuccess(`Sample "${sample.name}" loaded successfully!`);
    setTimeout(() => setSuccess(null), 3000);
  };

  const downloadTemplate = () => {
    const templateContent = `#title=Global Smartphone Market Share
#subtitle=2012 - 2022
#caption=Data source: Market Research Reports
#type=bar
#duration=800
#maxBars=6
Date,Apple,Samsung,Huawei,Xiaomi,Oppo,Vivo
2012,18,23,5,2,3,2
2013,20,25,6,3,4,3
2014,21,24,8,5,5,4
2015,19,22,10,7,6,5
2016,18,21,12,8,7,6
2017,19,20,14,10,8,7
2018,20,19,16,12,9,8
2019,21,18,15,14,10,9
2020,23,17,12,16,11,10
2021,25,18,8,18,12,11
2022,27,20,5,19,13,12`;
    const blob = new Blob([templateContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'smartphone_market_share_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
            {!isColumnSelectionMode ? (
              <>
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

                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Primary Data (CSV)</span>
                  <button 
                    onClick={downloadTemplate} 
                    className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 uppercase tracking-wider flex items-center gap-1 transition-colors"
                  >
                    <Download className="w-3 h-3" />
                    Download Template
                  </button>
                </div>

                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-zinc-200 dark:border-zinc-800 border-dashed rounded-xl cursor-pointer bg-zinc-50/50 dark:bg-zinc-900/30 hover:bg-zinc-100 dark:hover:bg-zinc-900/50 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-2 pb-2">
                      <Upload className="w-6 h-6 mb-1 text-zinc-400" />
                      <p className="text-xs text-zinc-500"><span className="font-semibold">Click to upload</span> primary CSV</p>
                    </div>
                    <input type="file" className="hidden" accept=".csv,.json" onChange={(e) => handleFileUpload(e, false)} />
                  </label>
                </div>

                <textarea
                  className="w-full p-3 text-sm border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50/50 dark:bg-zinc-900/50 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none resize-y transition-all"
                  rows={3}
                  placeholder="Paste primary CSV data here..."
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                />
                
                <button
                  onClick={() => processData(csvText)}
                  className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-600/20 transition-all active:scale-[0.98]"
                >
                  Process Primary Data
                </button>

                {config.type === 'stacked-bar' && config.data.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-zinc-200 dark:border-zinc-800">
                    <div className="flex items-center gap-2 mb-4">
                      <Layers className="w-4 h-4 text-indigo-500" />
                      <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Secondary Data (Component Bar Race)</span>
                    </div>
                    
                    <div className="flex items-center justify-center w-full mb-4">
                      <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-zinc-200 dark:border-zinc-800 border-dashed rounded-xl cursor-pointer bg-zinc-50/50 dark:bg-zinc-900/30 hover:bg-zinc-100 dark:hover:bg-zinc-900/50 transition-colors">
                        <div className="flex flex-col items-center justify-center pt-2 pb-2">
                          <Upload className="w-6 h-6 mb-1 text-zinc-400" />
                          <p className="text-xs text-zinc-500"><span className="font-semibold">Click to upload</span> secondary CSV</p>
                        </div>
                        <input type="file" className="hidden" accept=".csv,.json" onChange={(e) => handleFileUpload(e, true)} />
                      </label>
                    </div>

                    <textarea
                      className="w-full p-3 text-sm border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50/50 dark:bg-zinc-900/50 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none resize-y transition-all mb-4"
                      rows={3}
                      placeholder="Paste secondary CSV data here..."
                      value={secondaryCsvText}
                      onChange={(e) => setSecondaryCsvText(e.target.value)}
                    />
                    
                    <button
                      onClick={() => processSecondaryData(secondaryCsvText)}
                      className="w-full py-2.5 px-4 bg-zinc-800 hover:bg-zinc-900 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-white rounded-xl font-bold text-sm shadow-lg transition-all active:scale-[0.98]"
                    >
                      Process Secondary Data
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                    <Columns className="w-4 h-4" />
                    Select Columns to Race
                  </div>
                  <button 
                    onClick={() => {
                      setIsColumnSelectionMode(false);
                      setCsvText('');
                    }}
                    className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                  >
                    Cancel
                  </button>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-60 overflow-y-auto p-1">
                  {availableColumns.map(col => (
                    <label 
                      key={col} 
                      className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all ${
                        selectedColumns.includes(col) 
                          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300' 
                          : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700'
                      }`}
                    >
                      <input 
                        type="checkbox" 
                        className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                        checked={selectedColumns.includes(col)}
                        onChange={() => toggleColumn(col)}
                      />
                      <span className="text-sm font-medium truncate" title={col}>{col}</span>
                    </label>
                  ))}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedColumns(availableColumns)}
                    className="flex-1 py-1.5 px-3 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg text-xs font-semibold transition-colors"
                  >
                    Select All
                  </button>
                  <button
                    onClick={() => setSelectedColumns([])}
                    className="flex-1 py-1.5 px-3 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg text-xs font-semibold transition-colors"
                  >
                    Deselect All
                  </button>
                </div>

                <button
                  onClick={applyColumnSelection}
                  className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-600/20 transition-all active:scale-[0.98]"
                >
                  Load Selected Data ({selectedColumns.length} columns)
                </button>
              </div>
            )}

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

            {!isColumnSelectionMode && previewData.length > 0 && (
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

