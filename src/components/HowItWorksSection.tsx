import React from 'react';
import { Upload, SlidersHorizontal, CheckCircle2 } from 'lucide-react';

export const HowItWorksSection: React.FC = () => {
  const steps = [
    {
      step: '01',
      title: 'Upload your file',
      description:
        'Select or drag and drop any supported document, spreadsheet, image, or text file. We validate file headers and integrity instantly.',
      icon: <Upload className="w-6 h-6 text-[#635BFF]" />,
    },
    {
      step: '02',
      title: 'Select your output format',
      description:
        'Pick your target extension from format routes backed by dedicated conversion engines. Fine-tune optional quality and delimiter parameters.',
      icon: <SlidersHorizontal className="w-6 h-6 text-[#635BFF]" />,
    },
    {
      step: '03',
      title: 'Download your converted file',
      description:
        'Process single files or batch queues in seconds. Download outputs individually or package all results into a single ZIP archive.',
      icon: <CheckCircle2 className="w-6 h-6 text-[#16876B]" />,
    },
  ];

  return (
    <section id="how-it-works" className="py-20 bg-[#F5F7FB] border-t border-[#E5E9F2]">
      <div className="max-w-7xl mx-auto px-6 space-y-14">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-[#635BFF]">
            Streamlined Workflow
          </div>
          <h2 className="text-3xl font-bold text-[#172033]">
            How Convertly Works
          </h2>
          <p className="text-sm text-[#687386]">
            Three intuitive steps between your raw file and a pristine, converted document.
          </p>
        </div>

        {/* 3 Step Flow */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {steps.map((item, idx) => (
            <div
              key={item.step}
              className="bg-white rounded-2xl border border-[#E5E9F2] p-8 shadow-xs flex flex-col justify-between space-y-6 relative group hover:border-[#635BFF]/30 transition-colors"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-xl bg-[#F5F7FB] border border-[#E5E9F2] flex items-center justify-center">
                    {item.icon}
                  </div>
                  <span className="text-2xl font-bold font-mono tabular-nums text-[#635BFF]/30 group-hover:text-[#635BFF] transition-colors">
                    {item.step}
                  </span>
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-[#172033]">
                    {item.title}
                  </h3>
                  <p className="text-sm text-[#687386] leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>

              {/* Progress indicator */}
              <div className="w-full bg-[#E5E9F2] h-1 rounded-full overflow-hidden">
                <div
                  className="bg-[#635BFF] h-full rounded-full"
                  style={{ width: `${((idx + 1) / steps.length) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
