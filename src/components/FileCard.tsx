import React, { useState } from 'react';
import {
  FileText,
  FileSpreadsheet,
  FileImage,
  ArrowRight,
  Download,
  Trash2,
  RefreshCw,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { ConversionJob, SupportedFormat } from '../types/conversion';
import { getAvailableTargets, FORMAT_DEFINITIONS } from '../services/conversionRegistry';
import { ConversionOptionsModal } from './ConversionOptionsModal';

interface FileCardProps {
  job: ConversionJob;
  onTargetChange: (jobId: string, newTarget: SupportedFormat) => void;
  onConvert: (jobId: string) => void;
  onRemove: (jobId: string) => void;
  onDownload: (jobId: string) => void;
  onUpdateOptions: (jobId: string, options: any) => void;
}

export const FileCard: React.FC<FileCardProps> = ({
  job,
  onTargetChange,
  onConvert,
  onRemove,
  onDownload,
  onUpdateOptions,
}) => {
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);

  const availableTargets = getAvailableTargets(job.sourceFormat);
  const targetDef = FORMAT_DEFINITIONS[job.targetFormat];

  // Helper for formatting file size cleanly
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  // Helper icon for file categories
  const getFileIcon = (fmt: SupportedFormat) => {
    const def = FORMAT_DEFINITIONS[fmt];
    if (def?.category === 'images') return <FileImage className="w-5 h-5 text-indigo-500" />;
    if (def?.category === 'data') return <FileSpreadsheet className="w-5 h-5 text-emerald-600" />;
    return <FileText className="w-5 h-5 text-[#635BFF]" />;
  };

  const isConverting = job.status === 'processing' || job.status === 'uploading' || job.status === 'validating';

  return (
    <div className="bg-white rounded-2xl border border-[#E5E9F2] p-5 shadow-xs hover:border-[#635BFF]/30 transition-all">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        
        {/* Left: File Information & Metadata */}
        <div className="flex items-start sm:items-center gap-3.5 min-w-0">
          <div className="w-11 h-11 rounded-xl bg-[#F5F7FB] border border-[#E5E9F2] flex items-center justify-center shrink-0">
            {getFileIcon(job.sourceFormat)}
          </div>
          <div className="min-w-0">
            <h4 className="text-sm font-semibold text-[#172033] truncate max-w-xs sm:max-w-md" title={job.originalFileName}>
              {job.originalFileName}
            </h4>
            {/* Zero-pill metadata text with bullet separators */}
            <div className="flex items-center gap-2 text-xs text-[#687386] mt-0.5">
              <span className="uppercase font-medium text-[#172033]">{job.sourceFormat}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">{formatBytes(job.originalFileSize)}</span>
              {job.durationMs && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono tabular-nums">{job.durationMs}ms</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Center: Target Format Selector & Options */}
        <div className="flex flex-wrap items-center gap-3">
          
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-[#687386]">Convert to</span>
            <div className="relative">
              <select
                value={job.targetFormat}
                disabled={isConverting || job.status === 'completed'}
                onChange={(e) => onTargetChange(job.id, e.target.value as SupportedFormat)}
                className="appearance-none bg-[#F5F7FB] hover:bg-[#E5E9F2] text-[#172033] text-xs font-semibold py-2 pl-3 pr-8 rounded-xl border border-[#E5E9F2] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                {availableTargets.map((target) => (
                  <option key={target} value={target}>
                    {target.toUpperCase()} ({FORMAT_DEFINITIONS[target]?.extension})
                  </option>
                ))}
              </select>
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#687386]">
                <ArrowRight className="w-3.5 h-3.5 rotate-90 sm:rotate-0" />
              </div>
            </div>
          </div>

          {/* Options Cog Button */}
          {['jpg', 'png', 'webp', 'csv'].includes(job.targetFormat) && (
            <button
              onClick={() => setIsOptionsOpen(true)}
              disabled={isConverting || job.status === 'completed'}
              className="p-2 text-[#687386] hover:text-[#172033] hover:bg-[#F5F7FB] rounded-xl border border-transparent hover:border-[#E5E9F2] transition-colors cursor-pointer disabled:opacity-50"
              title="Conversion Settings"
            >
              <Sliders className="w-4 h-4" />
            </button>
          )}

        </div>

        {/* Right: Actions & State */}
        <div className="flex items-center gap-2 shrink-0 self-end lg:self-center">
          
          {job.status === 'idle' && (
            <button
              onClick={() => onConvert(job.id)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#635BFF] hover:bg-[#5145E5] active:scale-95 rounded-xl transition-all shadow-xs cursor-pointer"
            >
              <span>Convert</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          {isConverting && (
            <div className="flex items-center gap-2 text-xs text-[#635BFF] font-medium px-3 py-1.5 bg-[#635BFF]/5 rounded-xl">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Processing...</span>
            </div>
          )}

          {job.status === 'completed' && (
            <button
              onClick={() => onDownload(job.id)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#16876B] hover:bg-[#126d56] active:scale-95 rounded-xl transition-all shadow-xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
              {job.resultFileSize && (
                <span className="font-mono tabular-nums text-emerald-100 font-normal">
                  ({formatBytes(job.resultFileSize)})
                </span>
              )}
            </button>
          )}

          {job.status === 'failed' && (
            <button
              onClick={() => onConvert(job.id)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#D64545] hover:bg-red-50 rounded-xl border border-red-200 transition-colors cursor-pointer"
              title="Retry Conversion"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          )}

          {/* Remove / Cancel button */}
          <button
            onClick={() => onRemove(job.id)}
            disabled={isConverting}
            className="p-2 text-[#687386] hover:text-[#D64545] hover:bg-[#F5F7FB] rounded-xl transition-colors cursor-pointer disabled:opacity-40"
            title="Remove from queue"
          >
            <Trash2 className="w-4 h-4" />
          </button>

        </div>

      </div>

      {/* Conversion Progress Bar */}
      {isConverting && (
        <div className="mt-4 pt-3 border-t border-[#E5E9F2]">
          <div className="flex items-center justify-between text-xs text-[#687386] mb-1.5">
            <span>Converting {job.sourceFormat.toUpperCase()} to {job.targetFormat.toUpperCase()}</span>
            <span className="font-mono tabular-nums text-[#635BFF]">{job.progress}%</span>
          </div>
          <div className="w-full bg-[#E5E9F2] h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-[#635BFF] h-full rounded-full transition-all duration-300 ease-out"
              style={{ width: `${Math.max(job.progress, 5)}%` }}
            />
          </div>
        </div>
      )}

      {/* Completion Notification */}
      {job.status === 'completed' && job.resultFileName && (
        <div className="mt-3 pt-3 border-t border-[#E5E9F2] flex items-center justify-between text-xs text-[#16876B]">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Ready for download: <strong className="font-medium text-[#172033]">{job.resultFileName}</strong></span>
          </div>
          <button
            onClick={() => onDownload(job.id)}
            className="font-medium hover:underline cursor-pointer"
          >
            Click to save file
          </button>
        </div>
      )}

      {/* Error state message */}
      {job.status === 'failed' && (
        <div className="mt-3 pt-3 border-t border-[#E5E9F2] flex items-center gap-2 text-xs text-[#D64545]">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{job.errorMessage || 'Conversion failed. Please try a different target format or verify input file integrity.'}</span>
        </div>
      )}

      {/* Options modal */}
      <ConversionOptionsModal
        isOpen={isOptionsOpen}
        onClose={() => setIsOptionsOpen(false)}
        sourceFormat={job.sourceFormat}
        targetFormat={job.targetFormat}
        currentOptions={job.options}
        onSaveOptions={(newOpts) => onUpdateOptions(job.id, newOpts)}
      />
    </div>
  );
};
