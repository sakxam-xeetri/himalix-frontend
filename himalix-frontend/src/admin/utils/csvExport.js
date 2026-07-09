/**
 * Client-side utility for exporting dynamic data arrays into standard CSV format.
 *
 * @param {Array<Object>} data The data rows to export
 * @param {Array<Object>} columns Array of columns config: { header: string, key: string|Function }
 * @param {string} filename Base filename for the download
 */
export function exportToCsv(data, columns, filename = 'export') {
  if (!data || data.length === 0) return;

  const headers = columns.map(c => `"${String(c.header).replace(/"/g, '""')}"`).join(',');
  
  const rows = data.map(row => {
    return columns.map(col => {
      let value = '';
      if (typeof col.key === 'function') {
        value = col.key(row);
      } else {
        value = row[col.key];
      }
      if (value === null || value === undefined) {
        value = '';
      }
      return `"${String(value).replace(/"/g, '""')}"`;
    }).join(',');
  });

  const csvContent = '\uFEFF' + [headers, ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  const dateSuffix = new Date().toISOString().slice(0, 10);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${dateSuffix}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
