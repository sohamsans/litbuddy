import React, { useState } from 'react';
import { Users, Copy, Check, Radio, Shield, MessageCircle, Send } from 'lucide-react';

interface CollabRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomCode: string;
  onJoinRoom: (code: string) => void;
  peerConnected: boolean;
  messages: Array<{ sender: string; text: string; time: string }>;
  onSendMessage: (text: string) => void;
}

export const CollabRoomModal: React.FC<CollabRoomModalProps> = ({
  isOpen,
  onClose,
  roomCode,
  onJoinRoom,
  peerConnected,
  messages,
  onSendMessage
}) => {
  const [copied, setCopied] = useState(false);
  const [joinInput, setJoinInput] = useState('');
  const [chatInput, setChatInput] = useState('');

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    onSendMessage(chatInput.trim());
    setChatInput('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-2xl antigravity-glass p-6 text-zinc-200 border border-white/10 shadow-2xl relative">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-zinc-900 border border-zinc-800">
              <Users className="w-4 h-4 text-zinc-300" />
            </div>
            <div>
              <h3 className="font-semibold text-zinc-100 text-sm">P2P Research Collaboration</h3>
              <p className="text-[11px] text-zinc-400">Direct peer-to-peer live canvas syncing (Zero Cloud Logging)</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-200 p-1.5 rounded-lg hover:bg-zinc-800/60 transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="mt-4 space-y-4 text-xs">
          {/* Status Indicator */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/80 border border-zinc-800">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${peerConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              <span className="font-medium text-zinc-300">
                {peerConnected ? 'Connected with Colleague' : 'Awaiting Peer Connection...'}
              </span>
            </div>
            <span className="text-[10px] text-zinc-500 font-mono flex items-center gap-1">
              <Shield className="w-3 h-3 text-emerald-400" /> E2E Encrypted
            </span>
          </div>

          {/* Share Room Code */}
          <div>
            <label className="block text-[11px] font-medium text-zinc-400 mb-1.5">
              Your Collaboration Room Token:
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={roomCode}
                className="flex-1 bg-zinc-950/80 border border-zinc-800 rounded-lg px-3 py-2 font-mono text-zinc-200 text-xs focus:outline-none"
              />
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 font-semibold text-xs transition-colors shrink-0"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Join Another Room */}
          <div>
            <label className="block text-[11px] font-medium text-zinc-400 mb-1.5">
              Or Connect to Peer's Room:
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Paste colleague's room token..."
                value={joinInput}
                onChange={(e) => setJoinInput(e.target.value)}
                className="flex-1 bg-zinc-950/80 border border-zinc-800 rounded-lg px-3 py-2 font-mono text-zinc-200 text-xs focus:outline-none focus:border-zinc-700"
              />
              <button
                type="button"
                onClick={() => {
                  if (joinInput.trim()) onJoinRoom(joinInput.trim());
                }}
                className="px-3.5 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium text-xs transition-colors shrink-0"
              >
                Connect
              </button>
            </div>
          </div>

          {/* Peer Chat Box */}
          <div className="border-t border-zinc-800/80 pt-3">
            <div className="flex items-center gap-1.5 text-zinc-400 mb-2 font-medium text-[11px]">
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Colleague Live Chat</span>
            </div>

            <div className="h-28 overflow-y-auto rounded-lg bg-zinc-950/60 border border-zinc-800/60 p-2.5 space-y-1.5 text-[11px]">
              {messages.length === 0 ? (
                <div className="text-zinc-600 text-center py-6 italic">No messages exchanged yet</div>
              ) : (
                messages.map((m, idx) => (
                  <div key={idx} className="flex flex-col">
                    <span className="text-[10px] text-zinc-500 font-semibold">{m.sender} • {m.time}</span>
                    <span className="text-zinc-200">{m.text}</span>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleSend} className="mt-2 flex gap-1.5">
              <input
                type="text"
                placeholder="Type message to peer..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className="flex-1 bg-zinc-950/80 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-700"
              />
              <button
                type="submit"
                className="p-2 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 transition-colors shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
