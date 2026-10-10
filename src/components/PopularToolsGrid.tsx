import React from 'react';
import {
  FileText,
  FileSpreadsheet,
  FileImage,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { SupportedFormat } from '../types/conversion';

interface ToolItem {
  id: string;
  source: SupportedFormat;
  target: SupportedFormat;
  title: string;
  description: string;
  category: 'PDF' | 'Office' | 'Images' | 'Data';
}

interface PopularToolsGridProps {
  onSelectTool: (source: SupportedFormat, target: SupportedFormat) => void;
}

export const PopularToolsGrid: React.FC<PopularToolsGridProps> = ({ onSelectTool }) => {
  const tools: ToolItem[] = [
    {
      id: 'pdf-word',
      source: 'pdf',
      target: 'docx',
      title: 'PDF to Word (.docx)',
      description: 'Extract text, paragraphs, and headings into editable Microsoft Word documents.',
      category: 'PDF',
    },
    {
      id: 'word-pdf',
      source: 'docx',
      target: 'pdf',
      title: 'Word (.docx) to PDF',
      description: 'Compile formatted Word documents into standard, viewable PDF files.',
      category: 'Office',
    },
    {
      id: 'pdf-images',
      source: 'pdf',
      target: 'png',
      title: 'PDF to Images (PNG)',
      description: 'Render document pages into crisp raster images for presentations or web embedding.',
      category: 'PDF',
    },
    {
      id: 'images-pdf',
      source: 'jpg',
      target: 'pdf',
      title: 'Images to PDF',
      description: 'Combine photographs or graphics into a clean, paginated PDF document.',
      category: 'Images',
    },
    {
      id: 'jpg-png',
      source: 'jpg',
      target: 'png',
      title: 'JPG to PNG',
      description: 'Convert compressed JPEG photos into lossless PNG format with transparency support.',
      category: 'Images',
    },
    {
      id: 'png-webp',
      source: 'png',
      target: 'webp',
      title: 'PNG to WebP',
      description: 'Modern next-gen image compression saving up to 80% bandwidth with sharp quality.',
      category: 'Images',
    },
    {
      id: 'docx-txt',
      source: 'docx',
      target: 'txt',
      title: 'Word (.docx) to TXT',
      description: 'Strip XML tags and extract clean raw text lines for data processing and analysis.',
      category: 'Office',
    },
    {
      id: 'csv-xlsx',
      source: 'csv',
      target: 'xlsx',
      title: 'CSV to Excel (.xlsx)',
      description: 'Transform tabular delimited records into formatted multi-column Excel workbooks.',
      category: 'Data',
    },
  ];

  return (
    <section id="tools" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-6 space-y-12">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-[#635BFF]">
            Engine Catalog
          </div>
          <h2 className="text-3xl font-bold text-[#172033]">
            Popular Conversion Workflows
          </h2>
          <p className="text-sm text-[#687386]">
            Every tool links directly to an active conversion pipeline with verified file outputs.
          </p>
        </div>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {tools.map((tool) => (
            <div
              key={tool.id}
              onClick={() => onSelectTool(tool.source, tool.target)}
              className="group relative bg-[#F5F7FB]/50 hover:bg-white rounded-2xl border border-[#E5E9F2] hover:border-[#635BFF]/40 p-6 transition-all duration-200 cursor-pointer hover:shadow-md flex flex-col justify-between"
            >
              <div className="space-y-4">
                {/* Category & Arrow */}
                <div className="flex items-center justify-between text-xs text-[#687386]">
                  <span className="font-semibold text-[#635BFF]">{tool.category}</span>
                  <div className="w-7 h-7 rounded-lg bg-white border border-[#E5E9F2] group-hover:bg-[#635BFF] group-hover:text-white flex items-center justify-center transition-colors">
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-base font-semibold text-[#172033] group-hover:text-[#635BFF] transition-colors">
                    {tool.title}
                  </h3>
                  <p className="text-xs text-[#687386] leading-relaxed">
                    {tool.description}
                  </p>
                </div>
              </div>

              {/* Action Link */}
              <div className="pt-5 mt-4 border-t border-[#E5E9F2]/70 flex items-center gap-1.5 text-xs font-semibold text-[#172033] group-hover:text-[#635BFF]">
                <span>Launch Converter</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
