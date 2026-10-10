import React, { useRef, useState, DragEvent, ChangeEvent } from 'react';
import { UploadCloud, FileUp, AlertCircle, CheckCircle } from 'lucide-react';
import { detectFileFormat } from '../services/conversionRegistry';
import { SupportedFormat } from '../types/conversion';

interface UploadDropzoneProps {
  onFilesSelected: (files: File[]) => void;
  preferredTarget?: SupportedFormat;
}

export const UploadDropzone: React.FC<UploadDropzoneProps> = ({
  onFilesSelected,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [dropError, setDropError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    setDropError(null);

    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length === 0) return;

    processFiles(droppedFiles);
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const selected = Array.from(e.target.files);
    processFiles(selected);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const processFiles = (files: File[]) => {
    const validFiles: File[] = [];
    const unsupported: string[] = [];

    for (const f of files) {
      const detected = detectFileFormat(f.name, f.type);
      if (detected) {
        validFiles.push(f);
      } else {
        unsupported.push(f.name);
      }
    }

    if (unsupported.length > 0 && validFiles.length === 0) {
      setDropError(`Unsupported file format: ${unsupported.join(', ')}. Please upload PDF, Word, Excel, CSV, Text, or Image files.`);
      return;
    }

    if (unsupported.length > 0) {
      setDropError(`Skipped unsupported files: ${unsupported.join(', ')}`);
    } else {
      setDropError(null);
    }

    if (validFiles.length > 0) {
      onFilesSelected(validFiles);
    }
  };

  return (
    <div className="w-full">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center transition-all cursor-pointer group ${
          isDragOver
            ? 'border-[#635BFF] bg-[#635BFF]/5 scale-[1.005]'
            : 'border-[#E5E9F2] hover:border-[#635BFF]/50 bg-[#F5F7FB]/60 hover:bg-[#F5F7FB]'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.docx,.txt,.png,.jpg,.jpeg,.webp,.csv,.xlsx"
          onChange={handleFileInputChange}
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center space-y-4 max-w-lg mx-auto pointer-events-none">
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${
              isDragOver
                ? 'bg-[#635BFF] text-white'
                : 'bg-white text-[#635BFF] shadow-sm border border-[#E5E9F2] group-hover:scale-110'
            }`}
          >
            {isDragOver ? <FileUp className="w-7 h-7" /> : <UploadCloud className="w-7 h-7" />}
          </div>

          <div className="space-y-1.5">
            <h3 className="text-lg font-semibold text-[#172033]">
              Drag and drop your documents here
            </h3>
            <p className="text-sm text-[#687386]">
              or click to browse from your device · supports multiple files
            </p>
          </div>

          {/* Supported format information */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-2 text-xs text-[#687386]">
            <span>PDF</span>
            <span aria-hidden="true">·</span>
            <span>Word (.docx)</span>
            <span aria-hidden="true">·</span>
            <span>Excel (.xlsx)</span>
            <span aria-hidden="true">·</span>
            <span>CSV</span>
            <span aria-hidden="true">·</span>
            <span>Images (PNG, JPG, WebP)</span>
            <span aria-hidden="true">·</span>
            <span>Text (.txt)</span>
          </div>

          <div className="pt-2 text-xs text-[#687386]">
            Maximum file size: 50 MB per file
          </div>
        </div>
      </div>

      {dropError && (
        <div className="mt-3 flex items-start gap-2 p-3 bg-red-50/70 border border-red-200 rounded-xl text-xs text-[#D64545]">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{dropError}</span>
        </div>
      )}
    </div>
  );
};
