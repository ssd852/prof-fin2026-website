import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';

export function exportPDF(title, cols, rows, cur) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  doc.setFont('helvetica');
  doc.setFontSize(14);
  doc.text(title, 148, 14, { align: 'center' });
  doc.setFontSize(8);
  doc.setTextColor(120);
  doc.text(`${cur} | ${new Date().toLocaleDateString('en')}`, 148, 20, { align: 'center' });

  const visibleCols = cols.filter((c) => !c.auto || c.currency);
  const startY = 26;
  const colWidth = 260 / visibleCols.length;

  doc.setFillColor(30, 41, 59);
  doc.rect(14, startY, 262, 7, 'F');
  doc.setFontSize(7);
  doc.setTextColor(200);
  visibleCols.forEach((col, i) => {
    doc.text(col.label, 14 + i * colWidth + colWidth / 2, startY + 5, { align: 'center' });
  });

  doc.setTextColor(170);
  rows.forEach((row, ri) => {
    const y = startY + 9 + ri * 6;
    if (y > 190) return;
    if (ri % 2 === 0) {
      doc.setFillColor(20, 28, 45);
      doc.rect(14, y - 2, 262, 6, 'F');
    }
    visibleCols.forEach((col, ci) => {
      const val = String(row[col.key] || '');
      doc.text(val.substring(0, 32), 14 + ci * colWidth + colWidth / 2, y + 2.5, { align: 'center' });
    });
  });

  doc.save(`${title}.pdf`);
}

export function exportExcel(title, cols, rows) {
  const visibleCols = cols.filter((c) => !c.auto || c.currency);
  const data = [
    visibleCols.map((c) => c.label),
    ...rows.map((r) => visibleCols.map((c) => r[c.key])),
  ];
  const ws = XLSX.utils.aoa_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, title.substring(0, 31));
  XLSX.writeFile(wb, `${title}.xlsx`);
}

export function exportCSV(title, cols, rows) {
  const visibleCols = cols.filter((c) => !c.auto || c.currency);
  const header = visibleCols.map((c) => c.label).join(',');
  const body = rows
    .map((r) =>
      visibleCols
        .map((c) => `"${String(r[c.key] || '').replace(/"/g, '""')}"`)
        .join(',')
    )
    .join('\n');
  const csv = '\uFEFF' + header + '\n' + body;
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${title}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
