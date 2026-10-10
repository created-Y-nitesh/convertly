import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { ConversionWorkspace } from './components/ConversionWorkspace';
import { PopularToolsGrid } from './components/PopularToolsGrid';
import { HowItWorksSection } from './components/HowItWorksSection';
import { ArchitectureSection } from './components/ArchitectureSection';
import { FAQSection } from './components/FAQSection';
import { Footer } from './components/Footer';
import { IntegrationHubModal } from './components/IntegrationHubModal';
import { ToastNotifications, ToastMessage } from './components/ToastNotifications';
import { SupportedFormat } from './types/conversion';
import { getStoredAuditLogs } from './services/mongoService';

export default function App() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [auditCount, setAuditCount] = useState<number>(0);
  const [isIntegrationHubOpen, setIsIntegrationHubOpen] = useState(false);
  const [preferredSource, setPreferredSource] = useState<SupportedFormat | undefined>(undefined);
  const [preferredTarget, setPreferredTarget] = useState<SupportedFormat | undefined>(undefined);

  useEffect(() => {
    updateAuditCount();
  }, []);

  const updateAuditCount = () => {
    const logs = getStoredAuditLogs();
    setAuditCount(logs.length);
  };

  const notify = (text: string, type: 'success' | 'info' | 'error' = 'info') => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    setToasts((prev) => [...prev, { id, text, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const handleDismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const scrollToWorkspace = () => {
    const el = document.getElementById('workspace');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSelectWorkflow = (source: SupportedFormat, target: SupportedFormat) => {
    setPreferredSource(source);
    setPreferredTarget(target);
    scrollToWorkspace();
    notify(`Selected workflow: ${source.toUpperCase()} to ${target.toUpperCase()}`, 'info');
  };

  return (
    <div className="min-h-screen bg-white text-[#172033] flex flex-col font-sans selection:bg-[#635BFF]/10 selection:text-[#635BFF]">
      {/* Navigation */}
      <Navbar
        onOpenWorkspace={scrollToWorkspace}
        onOpenIntegrations={() => setIsIntegrationHubOpen(true)}
        auditCount={auditCount}
      />

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Section */}
        <HeroSection
          onSelectWorkflow={handleSelectWorkflow}
          onOpenWorkspace={scrollToWorkspace}
        />

        {/* Dedicated Conversion Workspace */}
        <ConversionWorkspace
          onNotify={notify}
          onAuditCountChange={updateAuditCount}
          preferredSource={preferredSource}
          preferredTarget={preferredTarget}
        />

        {/* Popular Tools Grid */}
        <PopularToolsGrid onSelectTool={handleSelectWorkflow} />

        {/* How It Works Section */}
        <HowItWorksSection />

        {/* Full-Stack Architecture & API Reference */}
        <ArchitectureSection />

        {/* FAQ Section */}
        <FAQSection />
      </main>

      {/* Footer */}
      <Footer
        onOpenWorkspace={scrollToWorkspace}
        onOpenIntegrations={() => setIsIntegrationHubOpen(true)}
      />

      {/* Integration & Audit Hub Modal */}
      <IntegrationHubModal
        isOpen={isIntegrationHubOpen}
        onClose={() => setIsIntegrationHubOpen(false)}
        onNotify={notify}
        onAuditCountChange={updateAuditCount}
      />

      {/* Toast Notifications */}
      <ToastNotifications toasts={toasts} onDismiss={handleDismissToast} />
    </div>
  );
}
