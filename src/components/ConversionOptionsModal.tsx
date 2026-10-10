import React, { useState } from 'react';
import { X, Sliders, Check } from 'lucide-react';
import { ConversionOptions, SupportedFormat } from '../types/conversion';

interface ConversionOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  sourceFormat: SupportedFormat;
  targetFormat: SupportedFormat;
  currentOptions: ConversionOptions;
  onSaveOptions: (options: ConversionOptions) => void;
}

export const ConversionOptionsModal: React.FC<ConversionOptionsModalProps> = ({
  isOpen,
  onClose,
  sourceFormat,
  targetFormat,
  currentOptions,
  onSaveOptions,
}) => {
  if (!isOpen) return null;

  const [quality, setQuality] = useState(currentOptions.imageQuality ?? 0.9);
  const [delimiter, setDelimiter] = useState<',' | ';' | '\t'>(currentOptions.csvDelimiter ?? ',');
  const [preserveFormatting, setPreserveFormatting] = useState(currentOptions.preserveFormatting ?? true);

  const isImageTarget = ['jpg', 'png', 'webp'].includes(targetFormat);
  const isCsvRelated = sourceFormat === 'csv' || targetFormat === 'csv';

  const handleSave = () => {
    onSaveOptions({
      imageQuality: quality,
      csvDelimiter: delimiter,
      preserveFormatting,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-[#E5E9F2] shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#E5E9F2] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-[#635BFF]" />
            <h3 className="font-semibold text-[#172033] text-sm">
              Conversion Settings: {sourceFormat.toUpperCase()} → {targetFormat.toUpperCase()}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[#687386] hover:text-[#172033] rounded-lg hover:bg-[#F5F7FB] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 text-sm">
          
          {isImageTarget && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-medium text-[#172033]">Image Output Quality</label>
                <span className="text-xs font-mono tabular-nums text-[#635BFF]">
                  {Math.round(quality * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0.2"
                max="1.0"
                step="0.05"
                value={quality}
                onChange={(e) => setQuality(parseFloat(e.target.value))}
                className="w-full accent-[#635BFF] cursor-pointer"
              />
              <p className="text-xs text-[#687386]">
                Higher quality preserves finer details; lower quality yields smaller file size.
              </p>
            </div>
          )}

          {isCsvRelated && (
            <div className="space-y-2">
              <label className="font-medium text-[#172033]">CSV Delimiter Character</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Comma (,)', val: ',' },
                  { label: 'Semicolon (;)', val: ';' },
                  { label: 'Tab (\\t)', val: '\t' },
                ].map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => setDelimiter(item.val as any)}
                    className={`py-2 px-3 text-xs font-medium rounded-xl border text-center transition-all cursor-pointer ${
                      delimiter === item.val
                        ? 'border-[#635BFF] bg-[#635BFF]/5 text-[#635BFF] font-semibold'
                        : 'border-[#E5E9F2] text-[#687386] hover:bg-[#F5F7FB]'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <div>
              <div className="font-medium text-[#172033]">Preserve Layout Structure</div>
              <div className="text-xs text-[#687386]">
                Maintain document margins, paragraph breaks, and typography
              </div>
            </div>
            <input
              type="checkbox"
              checked={preserveFormatting}
              onChange={(e) => setPreserveFormatting(e.target.checked)}
              className="w-4 h-4 accent-[#635BFF] rounded cursor-pointer"
            />
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-[#F5F7FB] border-t border-[#E5E9F2] flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-[#687386] hover:text-[#172033] rounded-xl hover:bg-white transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#635BFF] hover:bg-[#5145E5] rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Apply Settings</span>
          </button>
        </div>

      </div>
    </div>
  );
};
