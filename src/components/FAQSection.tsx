import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
}

export const FAQSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs: FAQItem[] = [
    {
      question: 'Which file formats does Convertly currently support?',
      answer:
        'Convertly supports bidirectional and cross-category conversions across PDF, Microsoft Word (.docx), Microsoft Excel (.xlsx), Comma-Separated Values (.csv), Plain Text (.txt), and raster image formats including PNG, JPG, JPEG, and WebP.',
    },
    {
      question: 'What is the maximum file size limit for conversions?',
      answer:
        'By default, Convertly allows up to 50 MB per document for PDF, Word, and Excel files, and up to 25 MB for high-resolution images. Files exceeding these thresholds are safely rejected before processing begins to preserve browser and worker stability.',
    },
    {
      question: 'How does Convertly protect document privacy and security?',
      answer:
        'Security is a core design pillar. When conversions run, files are processed in ephemeral sandboxes. Converted files expire automatically, and no raw binary documents are stored in long-term databases. Furthermore, the Google Sheets integration transmits only operational metrics (file size, duration, format, status), never document contents.',
    },
    {
      question: 'Are PDF formatting, tables, and images preserved accurately?',
      answer:
        'Yes. Our conversion pipelines parse structural elements such as headings, paragraphs, table grids, and image embeds. When converting PDF to Word or Text to PDF, typographic metrics and margins are calculated to maintain document layout consistency.',
    },
    {
      question: 'Can I process multiple files simultaneously in a batch?',
      answer:
        'Absolutely. You can drag and drop multiple files at once. You can customize target formats per file or convert the entire queue with a single click. Once completed, you can download all converted files packaged together into a single ZIP archive.',
    },
    {
      question: 'How do the MongoDB Atlas and Google Sheets integrations work?',
      answer:
        'MongoDB Atlas stores persistent job metadata (job ID, timestamps, format routes, execution durations, and TTL expiration dates). Google Sheets acts as an administrative operational log through a secure Google Apps Script Web App that records conversion metrics without storing file binaries.',
    },
  ];

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section id="faq" className="py-20 bg-[#F5F7FB] border-t border-[#E5E9F2]">
      <div className="max-w-4xl mx-auto px-6 space-y-12">
        
        {/* Section Header */}
        <div className="text-center space-y-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-[#635BFF]">
            Common Inquiries
          </div>
          <h2 className="text-3xl font-bold text-[#172033]">
            Frequently Asked Questions
          </h2>
          <p className="text-sm text-[#687386]">
            Everything you need to know about formats, privacy, performance, and integrations.
          </p>
        </div>

        {/* Accordion */}
        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={faq.question}
                className="bg-white rounded-2xl border border-[#E5E9F2] overflow-hidden transition-colors"
              >
                <button
                  onClick={() => toggle(idx)}
                  className="w-full py-4.5 px-6 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-[#F5F7FB]/50 transition-colors"
                >
                  <span className="font-semibold text-[#172033] text-sm sm:text-base">
                    {faq.question}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-[#687386] shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-[#635BFF]' : ''
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-6 pb-5 pt-1 text-sm text-[#687386] leading-relaxed border-t border-[#E5E9F2]/60">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
