import React, { useState } from 'react';
import JSZip from 'jszip';
import { Play, Download, Trash2, Plus, Sparkles, Layers } from 'lucide-react';
import { UploadDropzone } from './UploadDropzone';
import { FileCard } from './FileCard';
import { ConversionJob, SupportedFormat, ConversionOptions } from '../types/conversion';
import { detectFileFormat, getAvailableTargets, validateFileSignature } from '../services/conversionRegistry';
import { executeConversion } from '../services/conversionEngine';
import { recordAuditLog, jobToMongoDocument } from '../services/mongoService';
import { logEventToGoogleSheets } from '../services/googleSheetsService';

interface ConversionWorkspaceProps {
  onNotify: (message: string, type?: 'success' | 'info' | 'error') => void;
  onAuditCountChange: () => void;
  preferredSource?: SupportedFormat;
  preferredTarget?: SupportedFormat;
}

export const ConversionWorkspace: React.FC<ConversionWorkspaceProps> = ({
  onNotify,
  onAuditCountChange,
  preferredSource,
  preferredTarget,
}) => {
  const [jobs, setJobs] = useState<ConversionJob[]>([]);
  const [isBatchConverting, setIsBatchConverting] = useState(false);

  // Add files to queue
  const handleFilesAdded = async (files: File[]) => {
    const newJobs: ConversionJob[] = [];

    for (const file of files) {
      const source = detectFileFormat(file.name, file.type) || 'pdf';
      const availableTargets = getAvailableTargets(source);

      // Default target
      let target: SupportedFormat = availableTargets[0] || 'pdf';
      if (preferredTarget && availableTargets.includes(preferredTarget)) {
        target = preferredTarget;
      }

      const jobId = `job_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      newJobs.push({
        id: jobId,
        originalFile: file,
        originalFileName: file.name,
        originalFileSize: file.size,
        sourceFormat: source,
        targetFormat: target,
        status: 'idle',
        progress: 0,
        options: {
          imageQuality: 0.9,
          csvDelimiter: ',',
          preserveFormatting: true,
        },
        createdAt: new Date().toISOString(),
      });
    }

    setJobs((prev) => [...prev, ...newJobs]);
    onNotify(`Added ${newJobs.length} file(s) to queue`, 'info');
  };

  // Change target format for single job
  const handleTargetChange = (jobId: string, newTarget: SupportedFormat) => {
    setJobs((prev) =>
      prev.map((j) => (j.id === jobId ? { ...j, targetFormat: newTarget } : j))
    );
  };

  // Update options for single job
  const handleUpdateOptions = (jobId: string, newOptions: ConversionOptions) => {
    setJobs((prev) =>
      prev.map((j) => (j.id === jobId ? { ...j, options: { ...j.options, ...newOptions } } : j))
    );
    onNotify('Conversion settings updated', 'info');
  };

  // Remove single job
  const handleRemove = (jobId: string) => {
    setJobs((prev) => prev.filter((j) => j.id !== jobId));
  };

  // Convert single job
  const handleConvert = async (jobId: string) => {
    const targetJob = jobs.find((j) => j.id === jobId);
    if (!targetJob) return;

    // Update status to validating
    setJobs((prev) =>
      prev.map((j) => (j.id === jobId ? { ...j, status: 'validating', progress: 10 } : j))
    );

    // Validate signature
    const validation = await validateFileSignature(targetJob.originalFile, targetJob.sourceFormat);
    if (!validation.valid) {
      setJobs((prev) =>
        prev.map((j) =>
          j.id === jobId
            ? {
                ...j,
                status: 'failed',
                errorMessage: validation.reason,
                errorCode: 'SIGNATURE_INVALID',
              }
            : j
        )
      );
      onNotify(`Validation failed: ${validation.reason}`, 'error');
      return;
    }

    // Set to processing
    setJobs((prev) =>
      prev.map((j) => (j.id === jobId ? { ...j, status: 'processing', progress: 25 } : j))
    );

    try {
      const result = await executeConversion(targetJob, (progress) => {
        setJobs((prev) =>
          prev.map((j) => (j.id === jobId ? { ...j, progress } : j))
        );
      });

      const completedAt = new Date().toISOString();
      const updatedJob: ConversionJob = {
        ...targetJob,
        status: 'completed',
        progress: 100,
        completedAt,
        durationMs: result.durationMs,
        resultBlob: result.blob,
        resultFileName: result.fileName,
        resultFileSize: result.fileSize,
      };

      setJobs((prev) => prev.map((j) => (j.id === jobId ? updatedJob : j)));

      // Audit Record & MongoDB Document
      const auditRecord = {
        event_id: `evt_${Date.now()}_${jobId}`,
        job_id: jobId,
        created_at: targetJob.createdAt,
        source_format: targetJob.sourceFormat,
        target_format: targetJob.targetFormat,
        original_file_size: targetJob.originalFileSize,
        status: 'completed',
        processing_duration_ms: result.durationMs,
        result_file_size: result.fileSize,
      };

      recordAuditLog(auditRecord);
      onAuditCountChange();

      // Dispatch to Google Sheets if configured
      logEventToGoogleSheets(auditRecord).catch(() => {});

      onNotify(`Converted ${targetJob.originalFileName} successfully in ${result.durationMs}ms`, 'success');
    } catch (err: any) {
      const failedJob: ConversionJob = {
        ...targetJob,
        status: 'failed',
        progress: 0,
        errorMessage: err.message || 'Conversion execution encountered an error.',
        errorCode: 'EXECUTION_ERROR',
      };
      setJobs((prev) => prev.map((j) => (j.id === jobId ? failedJob : j)));

      const auditRecord = {
        event_id: `evt_${Date.now()}_${jobId}`,
        job_id: jobId,
        created_at: targetJob.createdAt,
        source_format: targetJob.sourceFormat,
        target_format: targetJob.targetFormat,
        original_file_size: targetJob.originalFileSize,
        status: 'failed',
        processing_duration_ms: 0,
        error_code: 'EXECUTION_ERROR',
      };
      recordAuditLog(auditRecord);
      onAuditCountChange();

      onNotify(`Conversion failed: ${err.message}`, 'error');
    }
  };

  // Convert all pending jobs
  const handleConvertAll = async () => {
    const idleJobs = jobs.filter((j) => j.status === 'idle' || j.status === 'failed');
    if (idleJobs.length === 0) return;

    setIsBatchConverting(true);
    for (const job of idleJobs) {
      await handleConvert(job.id);
    }
    setIsBatchConverting(false);
  };

  // Download converted file
  const handleDownload = (jobId: string) => {
    const job = jobs.find((j) => j.id === jobId);
    if (!job || !job.resultBlob || !job.resultFileName) return;

    const url = URL.createObjectURL(job.resultBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = job.resultFileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Download all completed as single ZIP
  const handleDownloadAllZip = async () => {
    const completedJobs = jobs.filter((j) => j.status === 'completed' && j.resultBlob && j.resultFileName);
    if (completedJobs.length === 0) return;

    onNotify('Compressing converted documents into ZIP archive...', 'info');

    const zip = new JSZip();
    for (const job of completedJobs) {
      zip.file(job.resultFileName!, job.resultBlob!);
    }

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(zipBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `convertly_batch_${new Date().toISOString().slice(0, 10)}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    onNotify(`Downloaded ${completedJobs.length} converted files in ZIP archive!`, 'success');
  };

  // Clear completed files
  const handleClearCompleted = () => {
    setJobs((prev) => prev.filter((j) => j.status !== 'completed'));
    onNotify('Cleared completed files from workspace', 'info');
  };

  const completedCount = jobs.filter((j) => j.status === 'completed').length;
  const pendingCount = jobs.filter((j) => j.status === 'idle' || j.status === 'failed').length;

  return (
    <section id="workspace" className="py-12 bg-[#F5F7FB] border-y border-[#E5E9F2]">
      <div className="max-w-7xl mx-auto px-6 space-y-8">
        
        {/* Workspace Title & Description */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-[#635BFF]">
              Interactive Workspace
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#172033] mt-1">
              Document Conversion Studio
            </h2>
            <p className="text-sm text-[#687386] mt-1">
              Upload documents, select target formats, adjust options, and download processed files.
            </p>
          </div>

          {jobs.length > 0 && (
            <div className="flex items-center gap-2 text-xs text-[#687386]">
              <span>Queue: <strong className="text-[#172033] font-mono tabular-nums">{jobs.length}</strong> total</span>
              <span aria-hidden="true">·</span>
              <span><strong className="text-[#16876B] font-mono tabular-nums">{completedCount}</strong> ready</span>
              <span aria-hidden="true">·</span>
              <span><strong className="text-[#C78323] font-mono tabular-nums">{pendingCount}</strong> pending</span>
            </div>
          )}
        </div>

        {/* Upload Dropzone */}
        <UploadDropzone
          onFilesSelected={handleFilesAdded}
          preferredTarget={preferredTarget}
        />

        {/* File Queue Section */}
        {jobs.length > 0 && (
          <div className="space-y-4">
            
            {/* Batch Action Toolbar */}
            <div className="bg-white rounded-2xl border border-[#E5E9F2] p-4 flex flex-wrap items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-2 text-xs font-medium text-[#172033]">
                <Layers className="w-4 h-4 text-[#635BFF]" />
                <span>Conversion Queue ({jobs.length})</span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {pendingCount > 0 && (
                  <button
                    onClick={handleConvertAll}
                    disabled={isBatchConverting}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#635BFF] hover:bg-[#5145E5] active:scale-95 rounded-xl transition-all shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Convert All ({pendingCount})</span>
                  </button>
                )}

                {completedCount > 1 && (
                  <button
                    onClick={handleDownloadAllZip}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#16876B] hover:bg-[#126d56] active:scale-95 rounded-xl transition-all shadow-xs cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download All as ZIP ({completedCount})</span>
                  </button>
                )}

                {completedCount > 0 && (
                  <button
                    onClick={handleClearCompleted}
                    className="px-3 py-2 text-xs font-medium text-[#687386] hover:text-[#172033] hover:bg-[#F5F7FB] rounded-xl transition-colors cursor-pointer"
                  >
                    Clear Completed
                  </button>
                )}

                <button
                  onClick={() => setJobs([])}
                  className="px-3 py-2 text-xs font-medium text-[#D64545] hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                >
                  Clear Queue
                </button>
              </div>
            </div>

            {/* List of File Cards */}
            <div className="space-y-3">
              {jobs.map((job) => (
                <FileCard
                  key={job.id}
                  job={job}
                  onTargetChange={handleTargetChange}
                  onConvert={handleConvert}
                  onRemove={handleRemove}
                  onDownload={handleDownload}
                  onUpdateOptions={handleUpdateOptions}
                />
              ))}
            </div>

          </div>
        )}

      </div>
    </section>
  );
};
