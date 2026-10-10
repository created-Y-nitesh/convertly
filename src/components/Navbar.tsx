import React from 'react';
import { ArrowRight, Layers, Database } from 'lucide-react';

interface NavbarProps {
  onOpenWorkspace: () => void;
  onOpenIntegrations: () => void;
  auditCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenWorkspace,
  onOpenIntegrations,
  auditCount,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E5E9F2]">
      <div className="max-w-7xl mx-auto px-6 h-18 flex items-center justify-between gap-8">
        
        {/* Zone 1: Brand Wordmark (Single element) */}
        <a
          href="#home"
          className="flex items-center gap-2.5 text-[#172033] hover:opacity-90 transition-opacity whitespace-nowrap shrink-0 group"
        >
          <div className="w-8 h-8 rounded-lg bg-[#635BFF] flex items-center justify-center text-white shadow-sm shadow-[#635BFF]/20 group-hover:scale-105 transition-transform">
            <Layers className="w-4.5 h-4.5" />
          </div>
          <span className="text-xl font-bold tracking-tight">Convertly</span>
        </a>

        {/* Zone 2: 4-5 single-line clean text navigation links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-[#687386]">
          <a
            href="#workspace"
            className="hover:text-[#172033] transition-colors whitespace-nowrap shrink-0"
          >
            Workspace
          </a>
          <a
            href="#tools"
            className="hover:text-[#172033] transition-colors whitespace-nowrap shrink-0"
          >
            Popular Tools
          </a>
          <a
            href="#how-it-works"
            className="hover:text-[#172033] transition-colors whitespace-nowrap shrink-0"
          >
            How It Works
          </a>
          <a
            href="#architecture"
            className="hover:text-[#172033] transition-colors whitespace-nowrap shrink-0"
          >
            Architecture & API
          </a>
          <a
            href="#faq"
            className="hover:text-[#172033] transition-colors whitespace-nowrap shrink-0"
          >
            FAQ
          </a>
          <button
            onClick={onOpenIntegrations}
            className="flex items-center gap-1.5 hover:text-[#635BFF] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Database className="w-3.5 h-3.5" />
            <span>Audit & Sync</span>
            {auditCount > 0 && (
              <span className="text-xs font-mono tabular-nums text-[#635BFF]">
                ({auditCount})
              </span>
            )}
          </button>
        </nav>

        {/* Zone 3: 1 Primary Action Button */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onOpenWorkspace}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-[#635BFF] hover:bg-[#5145E5] active:scale-[0.98] rounded-xl transition-all shadow-sm shadow-[#635BFF]/25 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <span>Start Converting</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </header>
  );
};
