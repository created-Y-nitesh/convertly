import React from 'react';
import { Layers } from 'lucide-react';

interface FooterProps {
  onOpenWorkspace: () => void;
  onOpenIntegrations: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onOpenWorkspace,
  onOpenIntegrations,
}) => {
  return (
    <footer className="bg-white border-t border-[#E5E9F2] pt-16 pb-12 text-[#687386] text-xs">
      <div className="max-w-7xl mx-auto px-6 space-y-12">
        
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          
          {/* Brand Col */}
          <div className="col-span-2 space-y-4">
            <div className="flex items-center gap-2.5 text-[#172033]">
              <div className="w-7 h-7 rounded-lg bg-[#635BFF] flex items-center justify-center text-white">
                <Layers className="w-4 h-4" />
              </div>
              <span className="text-lg font-bold tracking-tight">Convertly</span>
            </div>
            <p className="max-w-xs leading-relaxed text-[#687386]">
              Every file. The right format. A modern, reliable, and secure document conversion web platform.
            </p>
          </div>

          {/* Product Links */}
          <div className="space-y-3">
            <div className="font-semibold text-[#172033] uppercase tracking-wider text-[11px]">
              Platform
            </div>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={onOpenWorkspace}
                  className="hover:text-[#172033] transition-colors cursor-pointer"
                >
                  Conversion Studio
                </button>
              </li>
              <li>
                <a href="#tools" className="hover:text-[#172033] transition-colors">
                  Popular Tools
                </a>
              </li>
              <li>
                <a href="#how-it-works" className="hover:text-[#172033] transition-colors">
                  How It Works
                </a>
              </li>
              <li>
                <button
                  onClick={onOpenIntegrations}
                  className="hover:text-[#172033] transition-colors cursor-pointer"
                >
                  Audit & Telemetry Hub
                </button>
              </li>
            </ul>
          </div>

          {/* Formats */}
          <div className="space-y-3">
            <div className="font-semibold text-[#172033] uppercase tracking-wider text-[11px]">
              Supported Formats
            </div>
            <ul className="space-y-2">
              <li>PDF (.pdf)</li>
              <li>Microsoft Word (.docx)</li>
              <li>Microsoft Excel (.xlsx)</li>
              <li>Comma-Separated (.csv)</li>
              <li>Images (PNG, JPG, WebP)</li>
            </ul>
          </div>

          {/* Architecture & Engineering */}
          <div className="space-y-3">
            <div className="font-semibold text-[#172033] uppercase tracking-wider text-[11px]">
              Architecture
            </div>
            <ul className="space-y-2">
              <li>FastAPI Python Backend</li>
              <li>MongoDB Atlas Metadata</li>
              <li>Google Apps Script Logs</li>
              <li>Vercel Edge Frontend</li>
              <li>Pydantic v2 Contracts</li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-[#E5E9F2] flex flex-col sm:flex-row items-center justify-between gap-4 text-[#687386]">
          <div>
            © {new Date().getFullYear()} Convertly. All rights reserved. Universal document conversion platform.
          </div>
          <div className="flex items-center gap-6">
            <span className="hover:text-[#172033] transition-colors">Privacy Conscious File Processing</span>
            <span aria-hidden="true">·</span>
            <span className="hover:text-[#172033] transition-colors">24h Automatic Storage Purge</span>
          </div>
        </div>

      </div>
    </footer>
  );
};
