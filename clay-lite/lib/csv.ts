import Papa from 'papaparse';
import { Lead } from '@/types';

export function parseCSV(file: File): Promise<any[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        resolve(results.data);
      },
      error: (error) => {
        reject(error);
      },
    });
  });
}

export function exportToCSV(leads: Lead[], filename: string) {
  const csv = Papa.unparse(leads, {
    columns: [
      'firstName',
      'lastName',
      'email',
      'company',
      'domain',
      'title',
      'phone',
      'linkedin',
      'twitter',
      'companySize',
      'industry',
      'companyDescription',
      'companyLocation',
      'emailValid',
      'leadScore',
      'leadGrade',
      'enrichmentStatus',
      'enrichmentSource',
    ],
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
