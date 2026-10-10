import React, { useState, useEffect } from 'react';
import {
  X,
  Sheet,
  Database,
  CheckCircle,
  AlertCircle,
  Download,
  Trash2,
  RefreshCw,
  Send,
  FileCode,
  ExternalLink,
} from 'lucide-react';
import {
  getSheetsConfig,
  saveSheetsConfig,
  testSheetsConnection,
} from '../services/googleSheetsService';
import {
  getMongoConfig,
  saveMongoConfig,
  getStoredAuditLogs,
  clearAuditLogs,
  MONGO_INDEX_SPECS,
} from '../services/mongoService';
import { GoogleSheetsConfig, MongoConfig, ConversionEventRecord } from '../types/conversion';

interface IntegrationHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNotify: (msg: string, type?: 'success' | 'info' | 'error') => void;
  onAuditCountChange: () => void;
}

export const IntegrationHubModal: React.FC<IntegrationHubModalProps> = ({
  isOpen,
  onClose,
  onNotify,
  onAuditCountChange,
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'sheets' | 'mongo' | 'audit' | 'appsScript'>('sheets');
  const [sheetsConfig, setSheetsConfig] = useState<GoogleSheetsConfig>(getSheetsConfig());
  const [mongoConfig, setMongoConfig] = useState<MongoConfig>(getMongoConfig());
  const [auditLogs, setAuditLogs] = useState<ConversionEventRecord[]>(getStoredAuditLogs());
  const [isTestingSheets, setIsTestingSheets] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    setAuditLogs(getStoredAuditLogs());
  }, [isOpen]);

  const handleSaveSheets = () => {
    saveSheetsConfig(sheetsConfig);
    onNotify('Google Sheets integration settings saved.', 'success');
  };

  const handleSaveMongo = () => {
    saveMongoConfig(mongoConfig);
    onNotify('MongoDB Atlas settings saved.', 'success');
  };

  const handleTestSheets = async () => {
    setIsTestingSheets(true);
    setTestResult(null);
    try {
      const res = await testSheetsConnection(sheetsConfig);
      setTestResult(res);
      if (res.success) {
        onNotify('Google Apps Script connection verified!', 'success');
      } else {
        onNotify(res.message, 'error');
      }
    } catch (err: any) {
      setTestResult({ success: false, message: err.message || 'Connection test failed.' });
      onNotify('Webhook connection failed.', 'error');
    } finally {
      setIsTestingSheets(false);
    }
  };

  const handleClearAudit = () => {
    clearAuditLogs();
    setAuditLogs([]);
    onAuditCountChange();
    onNotify('Audit logs cleared.', 'info');
  };

  const handleExportAuditCSV = () => {
    if (auditLogs.length === 0) return;
    const headers = [
      'event_id',
      'job_id',
      'created_at',
      'source_format',
      'target_format',
      'original_file_size',
      'status',
      'processing_duration_ms',
      'error_code',
    ];
    const rows = auditLogs.map((log) => [
      log.event_id,
      log.job_id,
      log.created_at,
      log.source_format,
      log.target_format,
      log.original_file_size,
      log.status,
      log.processing_duration_ms,
      log.error_code || 'NONE',
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `convertly_audit_logs_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    onNotify('Exported audit logs as CSV', 'success');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-[#E5E9F2] shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E5E9F2] flex items-center justify-between shrink-0">
          <div>
            <h3 className="font-bold text-[#172033] text-base">
              Integration & Audit Hub
            </h3>
            <p className="text-xs text-[#687386]">
              Configure Google Sheets, MongoDB Atlas, and inspect conversion audit records.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#687386] hover:text-[#172033] rounded-xl hover:bg-[#F5F7FB] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 pt-3 border-b border-[#E5E9F2] flex items-center gap-2 shrink-0 bg-[#F5F7FB]/50">
          <button
            onClick={() => setActiveTab('sheets')}
            className={`px-4 py-2 text-xs font-semibold rounded-t-xl transition-all cursor-pointer ${
              activeTab === 'sheets'
                ? 'bg-white text-[#635BFF] border-t border-x border-[#E5E9F2] shadow-xs'
                : 'text-[#687386] hover:text-[#172033]'
            }`}
          >
            Google Sheets
          </button>
          <button
            onClick={() => setActiveTab('mongo')}
            className={`px-4 py-2 text-xs font-semibold rounded-t-xl transition-all cursor-pointer ${
              activeTab === 'mongo'
                ? 'bg-white text-[#635BFF] border-t border-x border-[#E5E9F2] shadow-xs'
                : 'text-[#687386] hover:text-[#172033]'
            }`}
          >
            MongoDB Atlas
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-4 py-2 text-xs font-semibold rounded-t-xl transition-all cursor-pointer ${
              activeTab === 'audit'
                ? 'bg-white text-[#635BFF] border-t border-x border-[#E5E9F2] shadow-xs'
                : 'text-[#687386] hover:text-[#172033]'
            }`}
          >
            Audit Logs ({auditLogs.length})
          </button>
          <button
            onClick={() => setActiveTab('appsScript')}
            className={`px-4 py-2 text-xs font-semibold rounded-t-xl transition-all cursor-pointer ${
              activeTab === 'appsScript'
                ? 'bg-white text-[#635BFF] border-t border-x border-[#E5E9F2] shadow-xs'
                : 'text-[#687386] hover:text-[#172033]'
            }`}
          >
            Apps Script Code
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm">
          
          {/* Tab 1: Google Sheets */}
          {activeTab === 'sheets' && (
            <div className="space-y-5">
              <div className="p-4 bg-[#F5F7FB] rounded-xl border border-[#E5E9F2] space-y-1">
                <div className="font-semibold text-xs text-[#172033]">
                  Controlled Google Sheets Integration via Apps Script Web App
                </div>
                <p className="text-xs text-[#687386]">
                  Every completed conversion sends structured audit metrics (timestamps, file sizes, durations, status) directly to your designated spreadsheet with shared-secret authentication. Zero document contents are ever transmitted.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#172033] mb-1">
                    Google Apps Script Web App URL
                  </label>
                  <input
                    type="url"
                    value={sheetsConfig.webhookUrl}
                    onChange={(e) => setSheetsConfig({ ...sheetsConfig, webhookUrl: e.target.value })}
                    placeholder="https://script.google.com/macros/s/AKfycb.../exec (leave blank to use server .env)"
                    className="w-full px-3.5 py-2.5 bg-white border border-[#E5E9F2] focus:border-[#635BFF] rounded-xl text-xs font-mono outline-hidden"
                  />
                  <p className="text-xs text-[#687386] mt-1">
                    Deployed from the Google Apps Script editor with "Who has access: Anyone". Leave blank if configured in server .env.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#172033] mb-1">
                    Shared Secret Token (CONVERTLY_SHARED_SECRET)
                  </label>
                  <input
                    type="password"
                    value={sheetsConfig.sharedSecret}
                    onChange={(e) => setSheetsConfig({ ...sheetsConfig, sharedSecret: e.target.value })}
                    placeholder="Stored securely in server .env (leave blank to use server secret)"
                    className="w-full px-3.5 py-2.5 bg-white border border-[#E5E9F2] focus:border-[#635BFF] rounded-xl text-xs font-mono outline-hidden"
                  />
                  <p className="text-xs text-[#687386] mt-1">
                    Matches the Script Property in your Apps Script project. Keep blank to use server-side secret.
                  </p>
                </div>

                <div className="flex items-center gap-3 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-[#172033]">
                    <input
                      type="checkbox"
                      checked={sheetsConfig.autoLog}
                      onChange={(e) => setSheetsConfig({ ...sheetsConfig, autoLog: e.target.checked })}
                      className="w-4 h-4 accent-[#635BFF] rounded"
                    />
                    <span>Automatically log every successful conversion to Google Sheets</span>
                  </label>
                </div>
              </div>

              {testResult && (
                <div
                  className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
                    testResult.success
                      ? 'bg-emerald-50 border-emerald-200 text-[#16876B]'
                      : 'bg-red-50 border-red-200 text-[#D64545]'
                  }`}
                >
                  {testResult.success ? (
                    <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  )}
                  <span>{testResult.message}</span>
                </div>
              )}

              <div className="pt-2 flex items-center justify-between border-t border-[#E5E9F2]">
                <button
                  onClick={handleTestSheets}
                  disabled={isTestingSheets}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-[#635BFF] bg-[#635BFF]/10 hover:bg-[#635BFF]/20 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isTestingSheets ? 'Pinging Webhook...' : 'Test Webhook Connection'}</span>
                </button>

                <button
                  onClick={handleSaveSheets}
                  className="px-5 py-2 text-xs font-semibold text-white bg-[#635BFF] hover:bg-[#5145E5] rounded-xl transition-all cursor-pointer shadow-xs"
                >
                  Save Sheets Settings
                </button>
              </div>
            </div>
          )}

          {/* Tab 2: MongoDB Atlas */}
          {activeTab === 'mongo' && (
            <div className="space-y-5">
              <div className="p-4 bg-[#F5F7FB] rounded-xl border border-[#E5E9F2] space-y-1">
                <div className="font-semibold text-xs text-[#172033]">
                  MongoDB Atlas Metadata Repository
                </div>
                <p className="text-xs text-[#687386]">
                  Persists conversion job status, processing times, and storage references. Files expire automatically after 24 hours via MongoDB TTL indexes.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#172033] mb-1">
                    MongoDB Connection URI
                  </label>
                  <input
                    type="text"
                    value={mongoConfig.connectionUri}
                    onChange={(e) => setMongoConfig({ ...mongoConfig, connectionUri: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white border border-[#E5E9F2] focus:border-[#635BFF] rounded-xl text-xs font-mono outline-hidden text-[#172033]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#172033] mb-1">
                      Database Name
                    </label>
                    <input
                      type="text"
                      value={mongoConfig.databaseName}
                      onChange={(e) => setMongoConfig({ ...mongoConfig, databaseName: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-white border border-[#E5E9F2] focus:border-[#635BFF] rounded-xl text-xs font-mono outline-hidden text-[#172033]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#172033] mb-1">
                      Collection Name
                    </label>
                    <input
                      type="text"
                      value={mongoConfig.collectionName}
                      onChange={(e) => setMongoConfig({ ...mongoConfig, collectionName: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-white border border-[#E5E9F2] focus:border-[#635BFF] rounded-xl text-xs font-mono outline-hidden text-[#172033]"
                    />
                  </div>
                </div>

                {/* MongoDB Index Specifications */}
                <div className="space-y-2 pt-2">
                  <div className="text-xs font-semibold text-[#172033]">Enforced Schema Indexes</div>
                  <div className="bg-[#F5F7FB] p-3 rounded-xl border border-[#E5E9F2] space-y-1.5 font-mono text-xs text-[#687386]">
                    {MONGO_INDEX_SPECS.map((idx, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <span>{idx.name}</span>
                        <span className="text-[#635BFF]">{JSON.stringify(idx.key)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end border-t border-[#E5E9F2]">
                <button
                  onClick={handleSaveMongo}
                  className="px-5 py-2 text-xs font-semibold text-white bg-[#635BFF] hover:bg-[#5145E5] rounded-xl transition-all cursor-pointer shadow-xs"
                >
                  Save MongoDB Settings
                </button>
              </div>
            </div>
          )}

          {/* Tab 3: Audit Logs */}
          {activeTab === 'audit' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#687386]">
                  Showing recent conversion events recorded in metadata store.
                </span>
                <div className="flex items-center gap-2">
                  {auditLogs.length > 0 && (
                    <button
                      onClick={handleExportAuditCSV}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#172033] bg-[#F5F7FB] hover:bg-[#E5E9F2] rounded-xl border border-[#E5E9F2] transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Export CSV</span>
                    </button>
                  )}
                  {auditLogs.length > 0 && (
                    <button
                      onClick={handleClearAudit}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#D64545] hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Clear</span>
                    </button>
                  )}
                </div>
              </div>

              {auditLogs.length === 0 ? (
                <div className="p-8 text-center bg-[#F5F7FB]/50 rounded-2xl border border-[#E5E9F2] space-y-2">
                  <p className="text-sm font-semibold text-[#172033]">No conversion events recorded yet</p>
                  <p className="text-xs text-[#687386]">Convert a file in the workspace to see live telemetry and duration data.</p>
                </div>
              ) : (
                <div className="border border-[#E5E9F2] rounded-xl overflow-hidden overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#F5F7FB] text-[#687386] font-semibold border-b border-[#E5E9F2]">
                      <tr>
                        <th className="py-2.5 px-3">Job ID</th>
                        <th className="py-2.5 px-3">Route</th>
                        <th className="py-2.5 px-3">Size</th>
                        <th className="py-2.5 px-3">Duration</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E9F2]">
                      {auditLogs.map((log) => (
                        <tr key={log.event_id} className="hover:bg-[#F5F7FB]/40">
                          <td className="py-2 px-3 font-mono text-[#635BFF]">{log.job_id.slice(-8)}</td>
                          <td className="py-2 px-3 font-medium uppercase text-[#172033]">
                            {log.source_format} → {log.target_format}
                          </td>
                          <td className="py-2 px-3 font-mono tabular-nums text-[#687386]">
                            {(log.original_file_size / 1024).toFixed(0)} KB
                          </td>
                          <td className="py-2 px-3 font-mono tabular-nums text-[#687386]">
                            {log.processing_duration_ms}ms
                          </td>
                          <td className="py-2 px-3">
                            <span
                              className={`font-medium ${
                                log.status === 'completed' ? 'text-[#16876B]' : 'text-[#D64545]'
                              }`}
                            >
                              {log.status}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-[#687386] font-mono tabular-nums">
                            {new Date(log.created_at).toLocaleTimeString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Tab 4: Apps Script Code */}
          {activeTab === 'appsScript' && (
            <div className="space-y-4">
              <div className="p-4 bg-[#F5F7FB] rounded-xl border border-[#E5E9F2] space-y-1">
                <div className="font-semibold text-xs text-[#172033]">
                  Ready-to-Deploy Google Apps Script (Code.gs)
                </div>
                <p className="text-xs text-[#687386]">
                  Copy this script into your Google Sheet's Apps Script editor (Extensions &gt; Apps Script) and deploy as a Web App.
                </p>
              </div>

              <div className="text-xs space-y-2">
                <p className="font-semibold text-[#172033]">Quick Setup in 3 Minutes:</p>
                <ol className="list-decimal list-inside space-y-1 text-[#687386]">
                  <li>Create a new spreadsheet at sheets.new</li>
                  <li>Go to Extensions &gt; Apps Script</li>
                  <li>Paste the Code.gs contents located in <code className="bg-slate-100 px-1 py-0.5 rounded text-[#172033]">/google_apps_script/Code.gs</code></li>
                  <li>In Project Settings, set Script Property <code className="bg-slate-100 px-1 py-0.5 rounded text-[#172033]">CONVERTLY_SHARED_SECRET</code></li>
                  <li>Click Deploy &gt; New deployment &gt; Web app (Access: Anyone)</li>
                  <li>Paste the resulting Web app URL into the Google Sheets tab here!</li>
                </ol>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
