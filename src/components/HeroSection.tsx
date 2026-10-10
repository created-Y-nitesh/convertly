import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight, ShieldCheck, Zap, RefreshCw, FileText } from 'lucide-react';
import { SupportedFormat } from '../types/conversion';

interface HeroSectionProps {
  onSelectWorkflow: (source: SupportedFormat, target: SupportedFormat) => void;
  onOpenWorkspace: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onSelectWorkflow,
  onOpenWorkspace,
}) => {
  const quickPairs: { label: string; source: SupportedFormat; target: SupportedFormat }[] = [
    { label: 'PDF to Word', source: 'pdf', target: 'docx' },
    { label: 'Word to PDF', source: 'docx', target: 'pdf' },
    { label: 'PNG to WebP', source: 'png', target: 'webp' },
    { label: 'CSV to Excel', source: 'csv', target: 'xlsx' },
    { label: 'Images to PDF', source: 'jpg', target: 'pdf' },
  ];

  return (
    <section id="home" className="relative pt-16 pb-20 overflow-hidden bg-white">
      {/* Background radial gradient accent */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-[#F5F7FB] to-transparent -z-10 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          
          {/* Subtle text kicker */}
          <div className="text-xs font-semibold uppercase tracking-wider text-[#635BFF]">
            Universal Document Engine
          </div>

          {/* Hero Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#172033] [text-wrap:balance]"
          >
            Every file. <span className="text-[#635BFF]">The right format.</span>
          </motion.h1>

          {/* Supporting Text */}
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.08 }}
            className="text-lg sm:text-xl text-[#687386] leading-relaxed max-w-2xl mx-auto"
          >
            Convert your documents in seconds with a beautifully simple, reliable, and secure workflow.
          </motion.p>

          {/* Quick Workflow Action Shortcuts */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.16 }}
            className="pt-2 flex flex-wrap items-center justify-center gap-2"
          >
            <span className="text-xs font-medium text-[#687386] mr-1">Popular workflows:</span>
            {quickPairs.map((pair) => (
              <button
                key={pair.label}
                onClick={() => onSelectWorkflow(pair.source, pair.target)}
                className="px-3 py-1.5 text-xs font-medium text-[#172033] bg-[#F5F7FB] hover:bg-[#E5E9F2] active:scale-95 border border-[#E5E9F2] rounded-lg transition-all cursor-pointer whitespace-nowrap"
              >
                {pair.label}
              </button>
            ))}
          </motion.div>

          {/* Trust Guarantees */}
          <div className="pt-6 flex flex-wrap items-center justify-center gap-y-2 gap-x-6 text-xs text-[#687386]">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#16876B]" />
              Zero permanent retention · Safe local processing
            </span>
            <span aria-hidden="true" className="hidden sm:inline">·</span>
            <span className="inline-flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-[#635BFF]" />
              Sub-second conversions
            </span>
            <span aria-hidden="true" className="hidden sm:inline">·</span>
            <span className="inline-flex items-center gap-1.5">
              <RefreshCw className="w-4 h-4 text-[#C78323]" />
              Full metadata tracking
            </span>
          </div>

        </div>
      </div>
    </section>
  );
};
