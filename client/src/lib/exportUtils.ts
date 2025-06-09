/**
 * Utility functions for exporting data in various formats
 */

/**
 * Convert a JS object array to CSV string
 */
export function objectsToCSV(data: any[]): string {
  if (!data || !data.length) return '';
  
  // Get headers
  const headers = Object.keys(data[0]);
  
  // Create CSV rows
  const headerRow = headers.join(',');
  const rows = data.map(obj => 
    headers.map(header => {
      let cell = obj[header];
      
      // Format dates
      if (cell instanceof Date) {
        cell = cell.toISOString().split('T')[0];
      }
      
      // Handle numbers
      if (typeof cell === 'number') {
        return cell;
      }
      
      // Handle strings (escape quotes and commas)
      if (typeof cell === 'string') {
        if (cell.includes(',') || cell.includes('"') || cell.includes('\n')) {
          return `"${cell.replace(/"/g, '""')}"`;
        }
        return cell;
      }
      
      // Handle null/undefined
      if (cell === null || cell === undefined) {
        return '';
      }
      
      // Handle objects by stringifying
      if (typeof cell === 'object') {
        return `"${JSON.stringify(cell).replace(/"/g, '""')}"`;
      }
      
      return cell;
    }).join(',')
  );
  
  return [headerRow, ...rows].join('\n');
}

/**
 * Export data as CSV file
 */
export function exportToCSV(data: any[], filename: string): void {
  const csv = objectsToCSV(data);
  downloadFile(csv, filename, 'text/csv');
}

/**
 * Export data as Excel-compatible CSV file
 */
export function exportToExcel(data: any[], filename: string): void {
  const csv = objectsToCSV(data);
  downloadFile('\ufeff' + csv, filename, 'text/csv;charset=utf-8');  // BOM for Excel UTF-8
}

/**
 * Export data as JSON file
 */
export function exportToJSON(data: any[], filename: string): void {
  const json = JSON.stringify(data, null, 2);
  downloadFile(json, filename, 'application/json');
}

/**
 * Helper function to download a file
 */
function downloadFile(content: string, filename: string, contentType: string): void {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  
  // Clean up
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 100);
}