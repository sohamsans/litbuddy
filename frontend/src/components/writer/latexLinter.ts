import React from 'react';
import { AlertTriangle, CheckCircle, Sparkles, Wrench, X } from 'lucide-react';

export interface LatexDiagnosticError {
  line?: number;
  message: string;
  suggestion: string;
  rule: string;
}

export function lintLatexSource(source: string): LatexDiagnosticError[] {
  const errors: LatexDiagnosticError[] = [];
  const lines = source.split('\n');

  // 1. Check matching environments: \begin{env} vs \end{env}
  const beginStack: { env: string; line: number }[] = [];
  lines.forEach((line, idx) => {
    // Strip comments
    const clean = line.replace(/%.*$/, '');
    const beginMatches = [...clean.matchAll(/\\begin\{([a-zA-Z0-9*]+)\}/g)];
    const endMatches = [...clean.matchAll(/\\end\{([a-zA-Z0-9*]+)\}/g)];

    beginMatches.forEach((m) => {
      beginStack.push({ env: m[1], line: idx + 1 });
    });

    endMatches.forEach((m) => {
      const top = beginStack.pop();
      if (!top) {
        errors.push({
          line: idx + 1,
          message: `Unexpected \\end{${m[1]}} with no matching \\begin`,
          suggestion: `Remove this \\end{${m[1]}} or check environment ordering.`,
          rule: 'unmatched_end'
        });
      } else if (top.env !== m[1]) {
        errors.push({
          line: idx + 1,
          message: `Mismatched environment: \\begin{${top.env}} closed by \\end{${m[1]}}`,
          suggestion: `Change \\end{${m[1]}} to \\end{${top.env}}.`,
          rule: 'mismatched_env'
        });
      }
    });
  });

  beginStack.forEach((unclosed) => {
    errors.push({
      line: unclosed.line,
      message: `Unclosed environment: \\begin{${unclosed.env}} is never closed`,
      suggestion: `Add \\end{${unclosed.env}} before the end of the document.`,
      rule: 'unclosed_begin'
    });
  });

  // 2. Check for unescaped special characters in plain text (% and _)
  lines.forEach((line, idx) => {
    const isMathLine = line.includes('$') || line.includes('\\begin{equation}') || line.includes('\\[ ');
    if (!isMathLine) {
      // Find unescaped underscores outside math
      if (/(?<!\\)_/.test(line)) {
        errors.push({
          line: idx + 1,
          message: 'Unescaped underscore "_" found outside math mode',
          suggestion: 'Replace "_" with "\\_" or wrap in math mode.',
          rule: 'unescaped_underscore'
        });
      }
    }
  });

  return errors;
}

export function autoFixLatexSource(source: string, errors: LatexDiagnosticError[]): string {
  let fixed = source;

  errors.forEach((err) => {
    if (err.rule === 'unclosed_begin') {
      const match = err.message.match(/\\begin\{([a-zA-Z0-9*]+)\}/);
      if (match) {
        const env = match[1];
        if (fixed.includes('\\end{document}')) {
          fixed = fixed.replace('\\end{document}', `\\end{${env}}\n\\end{document}`);
        } else {
          fixed += `\n\\end{${env}}\n`;
        }
      }
    } else if (err.rule === 'unescaped_underscore' && err.line) {
      const lines = fixed.split('\n');
      if (lines[err.line - 1]) {
        lines[err.line - 1] = lines[err.line - 1].replace(/(?<!\\)_/g, '\\_');
        fixed = lines.join('\n');
      }
    }
  });

  return fixed;
}
