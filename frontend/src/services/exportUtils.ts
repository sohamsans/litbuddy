import * as XLSX from 'xlsx';
import { ReviewPaper } from '../types';

export function formatPapersForExport(papers: ReviewPaper[]) {
  return papers.map((p, index) => ({
    '#': index + 1,
    'Title': p.title,
    'Year': p.year || 'N/A',
    'Authors': p.authors.join(', '),
    'Venue / Journal': p.venue || 'N/A',
    'Relevance Score (1-5)': p.relevance_score,
    'Triage Rationale': p.triage_rationale,
    'Core Problem': p.core_problem,
    'Methodology': p.methodology,
    'Key Findings': p.key_findings,
    'Research Gaps': p.research_gaps,
    'Critical Remarks': p.critical_remarks,
    'Open Access Full-Text': p.pdf_downloaded ? 'Yes (Analyzed)' : 'No (Abstract Fallback)',
    'DOI / URL': p.doi_link,
    'Source': p.source,
  }));
}

export function exportToExcel(papers: ReviewPaper[], topic: string) {
  const formatted = formatPapersForExport(papers);
  const worksheet = XLSX.utils.json_to_sheet(formatted);

  // Set column widths
  const colWidths = [
    { wch: 4 },   // #
    { wch: 35 },  // Title
    { wch: 8 },   // Year
    { wch: 25 },  // Authors
    { wch: 20 },  // Venue
    { wch: 12 },  // Relevance
    { wch: 30 },  // Triage Rationale
    { wch: 35 },  // Core Problem
    { wch: 35 },  // Methodology
    { wch: 40 },  // Key Findings
    { wch: 35 },  // Research Gaps
    { wch: 35 },  // Critical Remarks
    { wch: 20 },  // Open Access
    { wch: 35 },  // DOI
    { wch: 12 },  // Source
  ];
  worksheet['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Literature Review');

  const sanitizedTopic = topic.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 30);
  const fileName = `LitBuddy_${sanitizedTopic || 'Review'}_${new Date().toISOString().slice(0, 10)}.xlsx`;

  try {
    // SheetJS writeFile handles browser/native WebView download triggers reliably
    XLSX.writeFile(workbook, fileName);
  } catch (err) {
    console.warn('XLSX.writeFile fallback to Blob download:', err);
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 1000);
  }
}

export function exportToCSV(papers: ReviewPaper[], topic: string) {
  const formatted = formatPapersForExport(papers);
  const worksheet = XLSX.utils.json_to_sheet(formatted);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Literature Review');

  const sanitizedTopic = topic.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 30);
  const fileName = `LitBuddy_${sanitizedTopic || 'Review'}_${new Date().toISOString().slice(0, 10)}.csv`;

  try {
    XLSX.writeFile(workbook, fileName, { bookType: 'csv' });
  } catch (err) {
    console.warn('XLSX.writeFile CSV fallback:', err);
    const csvOutput = XLSX.utils.sheet_to_csv(worksheet);
    const blob = new Blob([csvOutput], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 1000);
  }
}
