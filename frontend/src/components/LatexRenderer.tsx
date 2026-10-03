import React, { useMemo } from 'react';
import { marked } from 'marked';
import katex from 'katex';

interface LatexRendererProps {
  content: string;
  className?: string;
  onCitationClick?: (paperId: string) => void;
}

export const LatexRenderer: React.FC<LatexRendererProps> = ({
  content,
  className = '',
  onCitationClick
}) => {
  const renderedHtml = useMemo(() => {
    if (!content) return '';

    // ── 1. Protect & Extract LaTeX Display Math ($$...$$) ───────────────────
    const displayMathTokens: string[] = [];
    let text = content.replace(/\$\$([\s\S]*?)\$\$/g, (_, math) => {
      try {
        const html = katex.renderToString(math.trim(), {
          displayMode: true,
          throwOnError: false
        });
        const token = `%%KATEX_DISP_${displayMathTokens.length}%%`;
        displayMathTokens.push(
          `<div class="my-3 overflow-x-auto py-2 text-center bg-[#1e1f20]/60 rounded-xl p-3 border border-[#3c4043]/60">${html}</div>`
        );
        return token;
      } catch {
        return `$$${math}$$`;
      }
    });

    // ── 2. Protect & Extract LaTeX Inline Math ($...$) ──────────────────────
    const inlineMathTokens: string[] = [];
    text = text.replace(/\$([^\$\n\r]+?)\$/g, (_, math) => {
      try {
        const html = katex.renderToString(math.trim(), {
          displayMode: false,
          throwOnError: false
        });
        const token = `%%KATEX_INL_${inlineMathTokens.length}%%`;
        inlineMathTokens.push(`<span class="inline-math px-1">${html}</span>`);
        return token;
      } catch {
        return `$${math}$`;
      }
    });

    // ── 3. Parse Markdown & GFM Tables via marked ───────────────────────────
    let parsedHtml = marked.parse(text, {
      gfm: true,
      breaks: true
    }) as string;

    // ── 4. Re-inject KaTeX Display & Inline Tokens ──────────────────────────
    displayMathTokens.forEach((rendered, i) => {
      parsedHtml = parsedHtml.replace(new RegExp(`%%KATEX_DISP_${i}%%`, 'g'), rendered);
    });
    inlineMathTokens.forEach((rendered, i) => {
      parsedHtml = parsedHtml.replace(new RegExp(`%%KATEX_INL_${i}%%`, 'g'), rendered);
    });

    // ── 5. Convert [1], [2], [1, 2] to Interactive Citation Pills ───────────
    parsedHtml = parsedHtml.replace(/\[(\d+(?:\s*,\s*\d+)*)\]/g, (match, nums) => {
      const parts = nums.split(',').map((n: string) => n.trim());
      const buttons = parts
        .map(
          (num: string) =>
            `<button type="button" data-citation="${num}" class="citation-badge inline-flex items-center justify-center px-1.5 py-0.5 mx-0.5 rounded-md bg-[#8ab4f8]/15 border border-[#8ab4f8]/35 text-[#8ab4f8] text-[11px] font-mono font-medium hover:bg-[#8ab4f8]/30 transition-colors cursor-pointer" title="View cited paper [${num}]">[${num}]</button>`
        )
        .join('');
      return buttons;
    });

    return parsedHtml;
  }, [content]);

  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = (e.target as HTMLElement).closest('[data-citation]');
    if (target && onCitationClick) {
      const citationId = target.getAttribute('data-citation');
      if (citationId) {
        onCitationClick(citationId);
      }
    }
  };

  return (
    <div
      onClick={handleContainerClick}
      dangerouslySetInnerHTML={{ __html: renderedHtml }}
      className={`latex-content leading-relaxed text-[#c4c7c5] ${className}`}
    />
  );
};
