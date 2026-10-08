import React, { useState, useEffect } from 'react';
import { Tablet, QrCode, Copy, Check, ExternalLink, X, Smartphone, RefreshCw, Globe, Wifi } from 'lucide-react';

interface TabletBridgeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TabletBridgeModal: React.FC<TabletBridgeModalProps> = ({ isOpen, onClose }) => {
  const [info, setInfo] = useState<{
    local_ip: string;
    port: number;
    tablet_url: string;
    public_url?: string | null;
    public_tablet_url?: string | null;
  } | null>(null);
  const [activeMode, setActiveMode] = useState<'internet' | 'local'>('internet');
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchBridgeInfo = () => {
    setIsLoading(true);
    fetch('/api/tablet/info')
      .then((res) => res.json())
      .then((data) => {
        setInfo(data);
        setIsLoading(false);
      })
      .catch(() => {
        const fallbackUrl = `http://${window.location.hostname}:8000/tablet-pad`;
        setInfo({ local_ip: window.location.hostname, port: 8000, tablet_url: fallbackUrl });
        setIsLoading(false);
      });
  };

  useEffect(() => {
    if (isOpen) {
      fetchBridgeInfo();
      // Poll every 3 seconds until public tunnel URL is discovered
      const timer = setInterval(() => {
        fetch('/api/tablet/info')
          .then((res) => res.json())
          .then((data) => {
            setInfo(data);
            if (data.public_url) {
              clearInterval(timer);
            }
          })
          .catch(() => {});
      }, 3000);
      return () => clearInterval(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Selected URL based on whether user is using internet port or local Wi-Fi
  const activeUrl =
    activeMode === 'internet' && info?.public_tablet_url
      ? info.public_tablet_url
      : info?.tablet_url || `http://${window.location.hostname}:8000/tablet-pad`;

  const handleCopy = () => {
    if (activeUrl) {
      navigator.clipboard.writeText(activeUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Generate QR code image URL
  const qrUrl = activeUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(activeUrl)}&bgcolor=07080a&color=ffffff`
    : '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="w-full max-w-md rounded-2xl antigravity-glass p-6 text-zinc-200 border border-white/10 shadow-2xl relative text-xs">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <Tablet className="w-4 h-4 text-zinc-300" />
            <h3 className="font-semibold text-sm text-zinc-100">Wireless Tablet &amp; Mobile Control Bridge</h3>
          </div>
          <button type="button" onClick={onClose} className="text-zinc-400 hover:text-white p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-4 space-y-4 text-center">
          {/* Connection Mode Switcher */}
          <div className="flex items-center justify-center p-1 rounded-xl bg-zinc-950 border border-zinc-800 gap-1">
            <button
              type="button"
              onClick={() => setActiveMode('internet')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition ${
                activeMode === 'internet' ? 'bg-zinc-800 text-white font-semibold' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Globe className="w-3.5 h-3.5 text-sky-400" />
              <span>Internet Port (Anywhere)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveMode('local')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition ${
                activeMode === 'local' ? 'bg-zinc-800 text-white font-semibold' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Wifi className="w-3.5 h-3.5 text-emerald-400" />
              <span>Local Wi-Fi Only</span>
            </button>
          </div>

          <p className="text-[11px] text-zinc-400 leading-relaxed">
            {activeMode === 'internet'
              ? 'Works over mobile 4G/5G data anywhere in the world! Scan with iPad or phone to control LitBuddy and draw.'
              : 'Direct high-speed local LAN connection. Both PC and tablet must be on the same Wi-Fi router.'}
          </p>

          {/* QR Code container */}
          <div className="w-52 h-52 mx-auto p-3 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-center shadow-inner relative">
            {isLoading && !qrUrl ? (
              <div className="flex flex-col items-center gap-2">
                <RefreshCw className="w-6 h-6 animate-spin text-zinc-500" />
                <span className="text-[10px] text-zinc-500">Opening secure port...</span>
              </div>
            ) : qrUrl ? (
              <img src={qrUrl} alt="Tablet QR Code" className="w-full h-full rounded-lg object-contain" />
            ) : (
              <QrCode className="w-16 h-16 text-zinc-600" />
            )}
          </div>

          {/* Direct URL input */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={activeUrl}
              className="flex-1 bg-zinc-950/80 border border-zinc-800 rounded-lg px-2.5 py-1.5 font-mono text-[11px] text-zinc-300 focus:outline-hidden"
            />
            <button
              type="button"
              onClick={handleCopy}
              className="px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 font-semibold text-xs flex items-center gap-1.5 transition"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 text-left space-y-1">
            <div className="font-semibold text-zinc-300 text-[11px]">Features enabled on tablet:</div>
            <div className="text-[10px] text-zinc-400">• Apple Pencil / S-Pen smooth stylus writing &amp; sketching.</div>
            <div className="text-[10px] text-zinc-400">• Tap "Send to Paper" to inject drawings into active manuscript.</div>
            <div className="text-[10px] text-zinc-400">• Keep PC running at home while drawing from anywhere.</div>
          </div>
        </div>
      </div>
    </div>
  );
};
