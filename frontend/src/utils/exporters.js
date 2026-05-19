const escapeCell = (cell) => String(cell ?? '').replaceAll('"', '""');
const escapeHtml = (cell) =>
  String(cell ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

export const exportCsv = (filename, headers, rows) => {
  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${escapeCell(cell)}"`).join(','))
    .join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(url);
};

export const exportExcel = (filename, title, headers, rows) => {
  const tableRows = [headers, ...rows]
    .map(
      (row, index) =>
        `<tr>${row
          .map((cell) => `<${index === 0 ? 'th' : 'td'}>${escapeHtml(cell)}</${index === 0 ? 'th' : 'td'}>`)
          .join('')}</tr>`,
    )
    .join('');
  const html = `
    <html>
      <head><meta charset="UTF-8" /></head>
      <body>
        <h2>${escapeHtml(title)}</h2>
        <table border="1">${tableRows}</table>
      </body>
    </html>
  `;
  const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.xls`;
  link.click();
  URL.revokeObjectURL(url);
};

export const exportPdf = (title, headers, rows) => {
  const printWindow = window.open('', '_blank');
  const tableRows = rows
    .map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`)
    .join('');

  printWindow.document.write(`
    <html>
      <head>
        <title>${escapeHtml(title)}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 32px; color: #17211d; }
          h1 { color: #0f766e; margin-bottom: 18px; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; }
          th, td { border: 1px solid #dedbd0; padding: 8px; text-align: left; }
          th { background: #f6f5ef; }
        </style>
      </head>
      <body>
        <h1>${escapeHtml(title)}</h1>
        <table>
          <thead><tr>${headers.map((header) => `<th>${escapeHtml(header)}</th>`).join('')}</tr></thead>
          <tbody>${tableRows}</tbody>
        </table>
        <script>setTimeout(() => window.print(), 300);</script>
      </body>
    </html>
  `);
  printWindow.document.close();
};
