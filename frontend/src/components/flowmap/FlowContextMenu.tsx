import React from 'react';
import {
  Trash2,
  FolderPlus,
  Compass,
  FileText,
  Quote,
  Plus,
  Layers,
  RotateCcw,
  StickyNote,
  Waypoints,
  AlignLeft
} from 'lucide-react';
import { FlowNode } from './FlowMapCanvas';

export interface FlowContextMenuProps {
  x: number;
  y: number;
  targetNode: FlowNode | null;
  onClose: () => void;
  onDeleteNode?: (nodeId: string) => void;
  onRemoveTrail?: (nodeId: string) => void;
  onCreateFolder?: () => void;
  onInsertPaper?: () => void;
  onAddNote?: (x?: number, y?: number, attachToNodeId?: string) => void;
  onStartTrail?: (node: FlowNode) => void;
  onCleanFolderPapers?: (folderNode: FlowNode) => void;
  onExtractTrail?: (node: FlowNode) => void;
  onOpenPdf?: (nodeId: string, title: string) => void;
  onCitePaper?: (node: FlowNode) => void;
  onCleanAndOrient?: () => void;
}

export const FlowContextMenu: React.FC<FlowContextMenuProps> = ({
  x,
  y,
  targetNode,
  onClose,
  onDeleteNode,
  onRemoveTrail,
  onCreateFolder,
  onInsertPaper,
  onAddNote,
  onStartTrail,
  onCleanFolderPapers,
  onExtractTrail,
  onOpenPdf,
  onCitePaper,
  onCleanAndOrient
}) => {
  // Prevent context menu from clipping outside viewport
  const adjustedX = Math.min(x, window.innerWidth - 240);
  const adjustedY = Math.min(y, window.innerHeight - 320);

  return (
    <div
      className="fixed z-50 w-60 rounded-xl antigravity-glass p-1.5 text-xs text-zinc-200 shadow-2xl border border-white/10 animate-in fade-in zoom-in-95 duration-100"
      style={{ left: `${adjustedX}px`, top: `${adjustedY}px` }}
      onMouseDown={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      {targetNode ? (
        // Context actions on a specific Node
        <div className="space-y-0.5">
          <div className="px-2 py-1 text-[10px] uppercase font-bold text-zinc-400 border-b border-zinc-800/80 truncate">
            {targetNode.title}
          </div>

          {/* User-driven custom trail builder */}
          {onStartTrail && (
            <button
              type="button"
              onClick={() => {
                onStartTrail(targetNode);
                onClose();
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-zinc-800 text-emerald-400 hover:text-emerald-300 transition-colors text-left"
            >
              <Waypoints className="w-3.5 h-3.5 text-emerald-400" />
              <span>Start / Extend Trail From Here</span>
            </button>
          )}

          {/* Attach Note Card */}
          {onAddNote && (
            <button
              type="button"
              onClick={() => {
                onAddNote(targetNode.x + 320, targetNode.y, targetNode.id);
                onClose();
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors text-left"
            >
              <StickyNote className="w-3.5 h-3.5 text-amber-400" />
              <span>Attach Sticky Note to Node</span>
            </button>
          )}

          {/* Folder specific Clean & Orient */}
          {targetNode.type === 'folder' && !targetNode.isCollapsed && onCleanFolderPapers && (
            <button
              type="button"
              onClick={() => {
                onCleanFolderPapers(targetNode);
                onClose();
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors text-left"
            >
              <AlignLeft className="w-3.5 h-3.5 text-sky-400" />
              <span>Clean &amp; Orient Child Papers</span>
            </button>
          )}

          {targetNode.doi && onExtractTrail && (
            <button
              type="button"
              onClick={() => {
                onExtractTrail(targetNode);
                onClose();
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors text-left"
            >
              <Compass className="w-3.5 h-3.5 text-zinc-400" />
              <span>Trace Paper Citations</span>
            </button>
          )}

          {targetNode.type === 'folder' || targetNode.id.includes('folder') ? (
            <button
              type="button"
              onClick={() => {
                onRemoveTrail?.(targetNode.id);
                onClose();
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors text-left"
            >
              <RotateCcw className="w-3.5 h-3.5 text-zinc-400" />
              <span>Remove Folder &amp; Trail</span>
            </button>
          ) : null}

          {onCitePaper && targetNode.type === 'paper' && (
            <button
              type="button"
              onClick={() => {
                onCitePaper(targetNode);
                onClose();
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors text-left"
            >
              <Quote className="w-3.5 h-3.5 text-zinc-400" />
              <span>Cite in Writing Studio</span>
            </button>
          )}

          {targetNode.pdf_url && onOpenPdf && (
            <button
              type="button"
              onClick={() => {
                onOpenPdf(targetNode.id, targetNode.title);
                onClose();
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors text-left"
            >
              <FileText className="w-3.5 h-3.5 text-zinc-400" />
              <span>Open PDF Document</span>
            </button>
          )}

          <div className="border-t border-zinc-800/80 my-1" />

          {onDeleteNode && (
            <button
              type="button"
              onClick={() => {
                onDeleteNode(targetNode.id);
                onClose();
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-red-950/40 text-red-400 hover:text-red-300 transition-colors text-left font-medium"
            >
              <Trash2 className="w-3.5 h-3.5 text-red-400" />
              <span>Delete from Canvas</span>
            </button>
          )}
        </div>
      ) : (
        // Context actions on Canvas Background
        <div className="space-y-0.5">
          <div className="px-2 py-1 text-[10px] uppercase font-bold text-zinc-400 border-b border-zinc-800/80">
            Canvas Operations
          </div>

          {onAddNote && (
            <button
              type="button"
              onClick={() => {
                onAddNote();
                onClose();
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors text-left"
            >
              <StickyNote className="w-3.5 h-3.5 text-amber-400" />
              <span>Add Sticky Note / Mind-Map Card</span>
            </button>
          )}

          {onInsertPaper && (
            <button
              type="button"
              onClick={() => {
                onInsertPaper();
                onClose();
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors text-left"
            >
              <Plus className="w-3.5 h-3.5 text-zinc-400" />
              <span>Insert Paper by DOI / Query</span>
            </button>
          )}

          {onCreateFolder && (
            <button
              type="button"
              onClick={() => {
                onCreateFolder();
                onClose();
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors text-left"
            >
              <FolderPlus className="w-3.5 h-3.5 text-zinc-400" />
              <span>Create Empty Folder</span>
            </button>
          )}

          {onCleanAndOrient && (
            <button
              type="button"
              onClick={() => {
                onCleanAndOrient();
                onClose();
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors text-left"
            >
              <Layers className="w-3.5 h-3.5 text-zinc-400" />
              <span>Clean &amp; Orient Entire Map</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
