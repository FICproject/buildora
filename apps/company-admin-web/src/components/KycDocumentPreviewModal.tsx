import React, { useEffect, useState } from 'react';
import {
  X,
  ZoomIn,
  ZoomOut,
  Maximize2,
  ExternalLink,
  Download,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Loader2,
  FileText,
} from 'lucide-react';
import { adminApi, formatDateTime } from '../services/adminApi';
import { Badge, Button, statusBadgeVariant } from './ui';

interface KycDocumentPreviewModalProps {
  open: boolean;
  onClose: () => void;
  vendorId: string;
  vendorName?: string;
  doc: any | null;
  onVerify: (doc: any) => Promise<void> | void;
  onRequestReject: (doc: any) => void;
  onDownload?: (doc: any) => Promise<void> | void;
}

export const KycDocumentPreviewModal: React.FC<KycDocumentPreviewModalProps> = ({
  open,
  onClose,
  vendorId,
  vendorName,
  doc,
  onVerify,
  onRequestReject,
  onDownload,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [resolvedMime, setResolvedMime] = useState<string>('');
  const [signedInfo, setSignedInfo] = useState<{
    inlineStreamPath: string;
    downloadStreamPath: string;
    expiresAt: string;
    fileSize: number;
  } | null>(null);

  const [zoom, setZoom] = useState<number>(100);
  const [fitMode, setFitMode] = useState<'fit' | 'custom'>('fit');
  const [renderFailed, setRenderFailed] = useState(false);

  const loadPreview = async () => {
    if (!open || !vendorId || !doc?.id) return;
    setLoading(true);
    setError(null);
    setRenderFailed(false);
    setZoom(100);
    setFitMode('fit');

    try {
      const [access, binary] = await Promise.all([
        adminApi.getVendorDocumentAccessUrl(vendorId, doc.id),
        adminApi.fetchVendorDocumentBlob(vendorId, doc.id, false),
      ]);
      const nextUrl = URL.createObjectURL(binary.blob);
      setBlobUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return nextUrl;
      });
      setResolvedMime(access.mimeType || binary.contentType || doc.mimeType || '');
      setSignedInfo({
        inlineStreamPath: access.inlineStreamPath,
        downloadStreamPath: access.downloadStreamPath,
        expiresAt: access.expiresAt,
        fileSize: access.fileSize || binary.blob.size,
      });
    } catch (err: any) {
      setError(err?.message || 'Unable to retrieve KYC document securely.');
      setBlobUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open || !doc?.id) {
      setBlobUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      setError(null);
      setSignedInfo(null);
      return;
    }
    void loadPreview();
  }, [open, vendorId, doc?.id]);

  useEffect(() => {
    return () => {
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [blobUrl]);

  if (!open || !doc) return null;

  const mimeLower = (resolvedMime || doc.mimeType || '').toLowerCase();
  const extLower = String(doc.fileName || '').split('.').pop()?.toLowerCase() || '';
  const isPdf = mimeLower === 'application/pdf' || extLower === 'pdf';
  const isImage =
    mimeLower.startsWith('image/') || ['jpg', 'jpeg', 'png', 'webp'].includes(extLower);
  const docStatus = doc.verificationStatus || doc.status || 'PENDING';
  const isHistorical = Boolean(doc.isHistoricalVersion);

  const handleOpenInNewTab = async () => {
    try {
      let pathToOpen = signedInfo?.inlineStreamPath;
      const isExpired =
        !signedInfo?.expiresAt ||
        new Date(signedInfo.expiresAt).getTime() - Date.now() < 15_000;
      if (!pathToOpen || isExpired) {
        const fresh = await adminApi.getVendorDocumentAccessUrl(vendorId, doc.id);
        pathToOpen = fresh.inlineStreamPath;
        setSignedInfo({
          inlineStreamPath: fresh.inlineStreamPath,
          downloadStreamPath: fresh.downloadStreamPath,
          expiresAt: fresh.expiresAt,
          fileSize: fresh.fileSize,
        });
      }
      window.open(adminApi.resolveApiStreamUrl(pathToOpen), '_blank', 'noopener,noreferrer');
    } catch (err: any) {
      setError(err?.message || 'Failed to generate new-tab preview link.');
    }
  };

  const handleDirectDownload = async () => {
    if (onDownload) {
      await onDownload(doc);
      return;
    }
    try {
      const { blob, fileName } = await adminApi.fetchVendorDocumentBlob(vendorId, doc.id, true);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.fileName || fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err: any) {
      setError(err?.message || 'Download failed.');
    }
  };

  const handleZoomIn = () => {
    setFitMode('custom');
    setZoom((z) => Math.min(isPdf ? 200 : 300, z + 25));
  };

  const handleZoomOut = () => {
    setFitMode('custom');
    setZoom((z) => Math.max(isPdf ? 50 : 25, z - 25));
  };

  const handleFit = () => {
    setFitMode('fit');
    setZoom(100);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-5 bg-[#3D392C]/65 backdrop-blur-[2px]">
      <div className="bg-white border border-[#E5DCD3] rounded-2xl w-full max-w-5xl h-[88vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Top Modal Header */}
        <div className="px-5 py-3.5 bg-[#FAF7F4] border-b border-[#E5DCD3] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-[#F0DED0] text-[#5E5946] flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-bold text-[#5E5946] truncate">
                  {doc.title || doc.type}
                </h3>
                <Badge variant={statusBadgeVariant(docStatus)}>{docStatus}</Badge>
              </div>
              <p className="text-xs text-[#6E6859] truncate">
                {vendorName ? `${vendorName} • ` : ''}
                File: <span className="font-medium text-[#5E5946]">{doc.fileName}</span>
                {doc.uploadedAt ? ` • Uploaded ${formatDateTime(doc.uploadedAt)}` : ''}
                {signedInfo?.fileSize || doc.fileSize
                  ? ` • ${Math.max(1, Math.round((signedInfo?.fileSize || doc.fileSize) / 1024))} KB`
                  : ''}
              </p>
            </div>
          </div>

          {/* Preview Controls Toolbar */}
          <div className="flex flex-wrap items-center gap-1.5">
            {(isPdf || isImage) && blobUrl && !error && !renderFailed && (
              <>
                <Button size="sm" variant="outline" onClick={handleZoomOut} title="Zoom Out">
                  <ZoomOut className="w-3.5 h-3.5" />
                </Button>
                <span className="px-2 text-xs font-semibold text-[#5E5946] min-w-[46px] text-center">
                  {fitMode === 'fit' ? 'Fit' : `${zoom}%`}
                </span>
                <Button size="sm" variant="outline" onClick={handleZoomIn} title="Zoom In">
                  <ZoomIn className="w-3.5 h-3.5" />
                </Button>
                <Button
                  size="sm"
                  variant={fitMode === 'fit' ? 'secondary' : 'outline'}
                  onClick={handleFit}
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  {isPdf ? 'Fit Width' : 'Fit Screen'}
                </Button>
              </>
            )}
            <Button size="sm" variant="outline" onClick={handleOpenInNewTab}>
              <ExternalLink className="w-3.5 h-3.5" /> Open Tab
            </Button>
            <Button size="sm" variant="outline" onClick={handleDirectDownload}>
              <Download className="w-3.5 h-3.5" /> Download
            </Button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#6E6859] hover:text-[#5E5946] hover:bg-[#F0DED0]/60 transition-colors cursor-pointer"
              aria-label="Close document preview"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Viewer Body */}
        <div className="flex-1 min-h-0 bg-[#F4EFEA] relative overflow-auto flex items-center justify-center p-3 sm:p-4">
          {loading ? (
            <div className="flex flex-col items-center gap-3 text-xs text-[#6E6859]">
              <Loader2 className="w-7 h-7 animate-spin text-[#AE887B]" />
              <p className="font-medium text-[#5E5946]">Decrypting & streaming KYC document...</p>
            </div>
          ) : error || renderFailed ? (
            <div className="bg-white border border-[#E5DCD3] rounded-xl p-6 max-w-md w-full text-center space-y-3 shadow-card">
              <div className="w-11 h-11 rounded-full bg-[#FEF2F2] text-[#C94444] mx-auto flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-[#5E5946]">Unable to Preview Document</h4>
              <p className="text-xs text-[#6E6859] leading-relaxed">
                {error || 'The file could not be rendered inline. Try reloading or downloading the original file.'}
              </p>
              <div className="flex items-center justify-center gap-2 pt-1">
                <Button size="sm" variant="primary" onClick={loadPreview}>
                  <RefreshCw className="w-3.5 h-3.5" /> Retry
                </Button>
                <Button size="sm" variant="outline" onClick={handleDirectDownload}>
                  <Download className="w-3.5 h-3.5" /> Download
                </Button>
              </div>
            </div>
          ) : isPdf && blobUrl ? (
            <iframe
              key={`${doc.id}-${fitMode}-${zoom}`}
              title={`Preview: ${doc.fileName}`}
              src={`${blobUrl}#toolbar=1&navpanes=0&view=${fitMode === 'fit' ? 'FitH' : 'Fit'}&zoom=${zoom}`}
              className="w-full h-full min-h-[60vh] bg-white rounded-lg border border-[#E5DCD3] shadow-sm"
              onError={() => setRenderFailed(true)}
            />
          ) : isImage && blobUrl ? (
            <div className="w-full h-full overflow-auto flex items-center justify-center">
              <img
                src={blobUrl}
                alt={doc.fileName}
                onError={() => setRenderFailed(true)}
                style={
                  fitMode === 'fit'
                    ? { maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }
                    : { width: `${zoom}%`, maxWidth: 'none', height: 'auto' }
                }
                className="rounded-lg border border-[#E5DCD3] bg-white shadow-sm transition-all"
              />
            </div>
          ) : (
            <div className="bg-white border border-[#E5DCD3] rounded-xl p-6 max-w-md w-full text-center space-y-3 shadow-card">
              <FileText className="w-9 h-9 text-[#AE887B] mx-auto" />
              <h4 className="text-sm font-bold text-[#5E5946]">Preview Not Supported</h4>
              <p className="text-xs text-[#6E6859]">
                Inline preview is supported for PDF, JPG, JPEG, PNG, and WEBP files. You can safely download this file to inspect it locally.
              </p>
              <Button size="sm" variant="primary" onClick={handleDirectDownload}>
                <Download className="w-3.5 h-3.5" /> Download File
              </Button>
            </div>
          )}
        </div>

        {/* Footer Inspection & Verification Actions */}
        <div className="px-5 py-3 bg-[#FAF7F4] border-t border-[#E5DCD3] flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-[#6E6859] min-w-0 flex-1">
            {docStatus === 'REJECTED' && doc.rejectionReason ? (
              <p className="text-[#C94444] font-medium truncate" title={doc.rejectionReason}>
                Rejection Reason: {doc.rejectionReason}
              </p>
            ) : isHistorical ? (
              <p>Historical archive version — read-only inspection.</p>
            ) : (
              <p>Inspect all document details carefully before verifying compliance status.</p>
            )}
          </div>
          {!isHistorical && (
            <div className="flex items-center gap-2 shrink-0">
              {docStatus !== 'VERIFIED' && (
                <Button size="sm" variant="success" onClick={() => onVerify(doc)}>
                  <CheckCircle2 className="w-3.5 h-3.5" /> Verify Document
                </Button>
              )}
              {docStatus !== 'REJECTED' && (
                <Button size="sm" variant="danger" onClick={() => onRequestReject(doc)}>
                  <XCircle className="w-3.5 h-3.5" /> Reject Document
                </Button>
              )}
              <Button size="sm" variant="outline" onClick={onClose}>
                Close
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
