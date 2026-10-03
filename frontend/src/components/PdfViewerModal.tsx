import React from 'react';
import { X, Download, ExternalLink, FileText } from 'lucide-react';
import { getVaultDownloadUrl, getVaultViewUrl } from '../services/api';

interface PdfViewerModalProps {
  isOpen: boolean;
  vaultId: string | null;
  title: string;
  onClose: () => void;
}

export const PdfViewerModal: React.FC<PdfViewerModalProps> = ({
  isOpen,
  vaultId,
  title,
  onClose
}) => {
  if (!isOpen || !vaultId) return null;

  const viewUrl = getVaultViewUrl(vaultId);
  const downloadUrl = getVaultDownloadUrl(vaultId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-6xl h-[92vh] flex flex-col bg-[#1e1f20] border border-[#3c4043] rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-[#131314] border-b border-[#3c4043]">
          <div className="flex items-center gap-3 min-w-0 pr-4">
            <div className="p-2 rounded-xl bg-[#282a2c] text-[#8ab4f8]">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-[#e3e3e3] truncate max-w-2xl">
                {title || 'Document Full Text'}
              </h2>
              <p className="text-[11px] text-[#9aa0a6]">
                Offline 0ms Document Vault • Pure PDF Binary
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <a
              href={downloadUrl}
              download
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#282a2c] hover:bg-[#3c4043] text-[#e3e3e3] text-xs font-medium rounded-xl border border-[#3c4043] transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-[#8ab4f8]" />
              <span>Download</span>
            </a>

            <a
              href={downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 text-[#9aa0a6] hover:text-[#e3e3e3] hover:bg-[#282a2c] rounded-xl transition-colors"
              title="Open in new browser tab"
            >
              <ExternalLink className="w-4 h-4" />
            </a>

            <button
              onClick={onClose}
              className="p-1.5 text-[#9aa0a6] hover:text-[#e3e3e3] hover:bg-[#282a2c] rounded-xl transition-colors"
              title="Close viewer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Embedded PDF iframe */}
        <div className="flex-1 w-full bg-[#131314] relative">
          <iframe
            src={`${viewUrl}#view=FitH`}
            title={title}
            className="w-full h-full border-0"
          />
        </div>
      </div>
    </div>
  );
};
