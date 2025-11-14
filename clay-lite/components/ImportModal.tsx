'use client';

import { useState, useRef } from 'react';
import { X, Upload, FileText } from 'lucide-react';
import { Lead } from '@/types';
import { parseCSV } from '@/lib/csv';
import { generateId } from '@/lib/utils';

interface ImportModalProps {
  onClose: () => void;
  onImport: (leads: Lead[]) => void;
}

export function ImportModal({ onClose, onImport }: ImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setLoading(true);

    try {
      const data = await parseCSV(selectedFile);
      setPreview(data.slice(0, 5)); // Show first 5 rows
    } catch (error) {
      alert('Error parsing CSV file');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!file) return;

    setLoading(true);
    try {
      const data = await parseCSV(file);
      const leads: Lead[] = data.map((row: any) => ({
        id: generateId(),
        firstName: row.firstName || row.first_name || row['First Name'] || '',
        lastName: row.lastName || row.last_name || row['Last Name'] || '',
        email: row.email || row.Email || '',
        company: row.company || row.Company || '',
        domain: row.domain || row.Domain || '',
        title: row.title || row.Title || row.position || '',
        phone: row.phone || row.Phone || '',
        linkedin: row.linkedin || row.LinkedIn || '',
        createdAt: new Date(),
        updatedAt: new Date(),
        enrichmentStatus: 'pending',
      }));

      onImport(leads);
    } catch (error) {
      alert('Error importing leads');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Import Leads</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {!file ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center cursor-pointer hover:border-purple-400 transition-colors"
            >
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Upload CSV File
              </h3>
              <p className="text-gray-500 mb-4">
                Click to browse or drag and drop your CSV file here
              </p>
              <p className="text-sm text-gray-400">
                Supported columns: firstName, lastName, email, company, domain,
                title, phone, linkedin
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-3 mb-4 p-4 bg-green-50 rounded-lg">
                <FileText className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-medium text-gray-900">{file.name}</p>
                  <p className="text-sm text-gray-500">
                    {(file.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              </div>

              {preview.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">
                    Preview (first 5 rows)
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border border-gray-200 rounded">
                      <thead className="bg-gray-50">
                        <tr>
                          {Object.keys(preview[0]).map((key) => (
                            <th
                              key={key}
                              className="px-4 py-2 text-left font-medium text-gray-600 border-b"
                            >
                              {key}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {preview.map((row, idx) => (
                          <tr key={idx} className="border-b last:border-b-0">
                            {Object.values(row).map((val: any, i) => (
                              <td key={i} className="px-4 py-2 text-gray-700">
                                {val}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:text-gray-900"
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={!file || loading}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Importing...' : 'Import Leads'}
          </button>
        </div>
      </div>
    </div>
  );
}
