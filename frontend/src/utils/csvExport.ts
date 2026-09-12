import { Job } from '../types';
import { CurrencyCode, getCurrencyMeta } from './tableStorage';

/**
 * Escapes a field for standard CSV formatting (RFC 4180)
 */
const escapeCsvField = (value: any): string => {
  if (value === null || value === undefined) {
    return '""';
  }
  const str = String(value);
  // If the value contains commas, double-quotes, or newlines, wrap in quotes and escape internal quotes
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
};

/**
 * Generates and triggers download of a CSV file from a list of job applications
 */
export const exportJobsToCsv = (
  jobs: Job[],
  filenamePrefix = 'job_applications',
  currencyCode: CurrencyCode = 'INR'
): void => {
  if (!jobs || jobs.length === 0) {
    throw new Error('No job applications to export.');
  }

  const currencyMeta = getCurrencyMeta(currencyCode);

  const headers = [
    'Job Title',
    'Company',
    'Location',
    'Applied Date',
    'Status',
    'Current Round',
    `Salary (${currencyMeta.symbol})`,
    'Interview Date',
    'Offer Status',
    'Notes / Remarks',
  ];

  const rows = jobs.map((job) => [
    escapeCsvField(job.job_title),
    escapeCsvField(job.company),
    escapeCsvField(job.location || ''),
    escapeCsvField(job.applied_date || ''),
    escapeCsvField(job.status || 'Applied'),
    escapeCsvField(job.current_round ?? 1),
    escapeCsvField(job.salary !== null && job.salary !== undefined ? job.salary : ''),
    escapeCsvField(job.interview_date || ''),
    escapeCsvField(job.offer_status || 'None'),
    escapeCsvField(job.remarks || ''),
  ]);

  const csvContent = [
    headers.map((h) => `"${h}"`).join(','),
    ...rows.map((row) => row.join(',')),
  ].join('\r\n');

  // Add UTF-8 BOM so Excel opens accented and special characters correctly
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const dateStamp = new Date().toISOString().split('T')[0];
  const downloadLink = document.createElement('a');
  downloadLink.setAttribute('href', url);
  downloadLink.setAttribute('download', `${filenamePrefix}_${dateStamp}.csv`);
  downloadLink.style.visibility = 'hidden';

  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
  URL.revokeObjectURL(url);
};
