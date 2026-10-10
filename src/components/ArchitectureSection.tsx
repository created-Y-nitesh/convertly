import React, { useState } from 'react';
import { Server, Database, Sheet, Code, ShieldCheck, Terminal, Copy, Check } from 'lucide-react';

export const ArchitectureSection: React.FC = () => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const curlSnippet = `curl -X POST "https://api.convertly.io/api/v1/conversions" \\
  -F "file=@annual_report.pdf" \\
  -F "source_format=pdf" \\
  -F "target_format=docx" \\
  -F 'options={"preserve_formatting": true}'`;

  return (
    <section id="architecture" className="py-20 bg-white border-t border-[#E5E9F2]">
      <div className="max-w-7xl mx-auto px-6 space-y-16">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-[#635BFF]">
            Full-Stack System Design
          </div>
          <h2 className="text-3xl font-bold text-[#172033]">
            Production Architecture & Integrations
          </h2>
          <p className="text-sm text-[#687386]">
            Built with strict separation of concerns, containerized conversion engines, MongoDB metadata persistence, and Google Sheets operational telemetry.
          </p>
        </div>

        {/* 4 Architectural Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          <div className="bg-[#F5F7FB]/50 rounded-2xl border border-[#E5E9F2] p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-white border border-[#E5E9F2] flex items-center justify-center text-[#635BFF]">
              <Server className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-[#172033] text-base">FastAPI Backend</h3>
            <p className="text-xs text-[#687386] leading-relaxed">
              Asynchronous Python 3.12 service powered by PyMuPDF, python-docx, Pillow, and openpyxl with strict Pydantic v2 schemas.
            </p>
          </div>

          <div className="bg-[#F5F7FB]/50 rounded-2xl border border-[#E5E9F2] p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-white border border-[#E5E9F2] flex items-center justify-center text-emerald-600">
              <Database className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-[#172033] text-base">MongoDB Atlas</h3>
            <p className="text-xs text-[#687386] leading-relaxed">
              Metadata repository tracking job lifecycles, execution durations, UTC timestamps, and automatic 24h TTL expiration indexes.
            </p>
          </div>

          <div className="bg-[#F5F7FB]/50 rounded-2xl border border-[#E5E9F2] p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-white border border-[#E5E9F2] flex items-center justify-center text-[#16876B]">
              <Sheet className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-[#172033] text-base">Google Sheets Webhook</h3>
            <p className="text-xs text-[#687386] leading-relaxed">
              Google Apps Script integration logging operational events with shared-secret authorization, lock concurrency, and zero document leakage.
            </p>
          </div>

          <div className="bg-[#F5F7FB]/50 rounded-2xl border border-[#E5E9F2] p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-white border border-[#E5E9F2] flex items-center justify-center text-indigo-600">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-[#172033] text-base">Vercel Deployment</h3>
            <p className="text-xs text-[#687386] leading-relaxed">
              High-performance React + TypeScript SPA delivered over Vercel Edge CDN with strict security headers and sub-second asset resolution.
            </p>
          </div>

        </div>

        {/* API Specification & Code Explorer */}
        <div className="bg-[#172033] text-white rounded-2xl border border-slate-800 p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-700/60 pb-5">
            <div className="flex items-center gap-3">
              <Terminal className="w-5 h-5 text-[#635BFF]" />
              <div>
                <h4 className="font-bold text-sm text-slate-100">REST API Integration</h4>
                <p className="text-xs text-slate-400">Execute automated conversions via documented HTTP endpoints</p>
              </div>
            </div>
            <button
              onClick={() => handleCopy(curlSnippet, 'curl')}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-mono bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-colors cursor-pointer self-start sm:self-auto"
            >
              {copiedCode === 'curl' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCode === 'curl' ? 'Copied' : 'Copy cURL'}</span>
            </button>
          </div>

          {/* Code display */}
          <pre className="font-mono text-xs text-slate-300 bg-slate-900/80 p-4 rounded-xl border border-slate-800 overflow-x-auto leading-relaxed">
            <code>{curlSnippet}</code>
          </pre>

          {/* Key Endpoints table */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 text-xs">
            <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-800/80">
              <span className="font-mono font-semibold text-emerald-400">GET /health</span>
              <p className="text-slate-400 mt-1">Verifies converter availability and database connectivity</p>
            </div>
            <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-800/80">
              <span className="font-mono font-semibold text-indigo-400">POST /api/v1/conversions</span>
              <p className="text-slate-400 mt-1">Multipart upload initiating validated conversion pipeline</p>
            </div>
            <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-800/80">
              <span className="font-mono font-semibold text-amber-400">GET /api/v1/conversions/:id/download</span>
              <p className="text-slate-400 mt-1">Direct stream of converted document with verified media type</p>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};
