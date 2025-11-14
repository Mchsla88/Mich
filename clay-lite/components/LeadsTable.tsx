'use client';

import { useState } from 'react';
import { Lead } from '@/types';
import { CheckSquare, Square, Sparkles, Mail, Building2, User, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LeadsTableProps {
  leads: Lead[];
  setLeads: (leads: Lead[]) => void;
  selectedLeads: string[];
  setSelectedLeads: (ids: string[]) => void;
}

export function LeadsTable({
  leads,
  setLeads,
  selectedLeads,
  setSelectedLeads,
}: LeadsTableProps) {
  const [sortBy, setSortBy] = useState<keyof Lead>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const toggleSelect = (id: string) => {
    if (selectedLeads.includes(id)) {
      setSelectedLeads(selectedLeads.filter((lid) => lid !== id));
    } else {
      setSelectedLeads([...selectedLeads, id]);
    }
  };

  const toggleSelectAll = () => {
    if (selectedLeads.length === leads.length) {
      setSelectedLeads([]);
    } else {
      setSelectedLeads(leads.map((l) => l.id));
    }
  };

  const getLeadScoreColor = (score?: number) => {
    if (!score) return 'bg-gray-100 text-gray-600';
    if (score >= 80) return 'bg-green-100 text-green-700';
    if (score >= 60) return 'bg-blue-100 text-blue-700';
    if (score >= 40) return 'bg-yellow-100 text-yellow-700';
    return 'bg-red-100 text-red-700';
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'completed':
        return '✓';
      case 'enriching':
        return '⟳';
      case 'failed':
        return '✗';
      default:
        return '-';
    }
  };

  if (leads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 bg-white rounded-lg border-2 border-dashed border-gray-300">
        <Database className="w-16 h-16 text-gray-400 mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No leads yet</h3>
        <p className="text-gray-500 mb-6">Import a CSV file to get started</p>
        <button className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
          Import Leads
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="w-12 px-4 py-3 text-left">
                <button onClick={toggleSelectAll}>
                  {selectedLeads.length === leads.length ? (
                    <CheckSquare className="w-5 h-5 text-purple-600" />
                  ) : (
                    <Square className="w-5 h-5 text-gray-400" />
                  )}
                </button>
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Email
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Company
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Title
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Score
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {leads.map((lead) => (
              <tr
                key={lead.id}
                className={cn(
                  'hover:bg-gray-50 transition-colors',
                  selectedLeads.includes(lead.id) && 'bg-purple-50'
                )}
              >
                <td className="px-4 py-4">
                  <button onClick={() => toggleSelect(lead.id)}>
                    {selectedLeads.includes(lead.id) ? (
                      <CheckSquare className="w-5 h-5 text-purple-600" />
                    ) : (
                      <Square className="w-5 h-5 text-gray-400" />
                    )}
                  </button>
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="font-medium text-gray-900">
                      {lead.firstName} {lead.lastName}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-700">{lead.email || '-'}</span>
                    {lead.emailValid && (
                      <span className="text-green-600 text-xs">✓</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-2">
                    {lead.companyLogo ? (
                      <img
                        src={lead.companyLogo}
                        alt={lead.company}
                        className="w-5 h-5 rounded"
                      />
                    ) : (
                      <Building2 className="w-4 h-4 text-gray-400" />
                    )}
                    <span className="text-gray-700">{lead.company || '-'}</span>
                  </div>
                </td>
                <td className="px-4 py-4 text-gray-700">{lead.title || '-'}</td>
                <td className="px-4 py-4">
                  {lead.leadScore ? (
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium',
                        getLeadScoreColor(lead.leadScore)
                      )}
                    >
                      <Trophy className="w-3 h-3" />
                      {lead.leadScore}
                    </span>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
                <td className="px-4 py-4">
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium',
                      lead.enrichmentStatus === 'completed' &&
                        'bg-green-100 text-green-700',
                      lead.enrichmentStatus === 'enriching' &&
                        'bg-blue-100 text-blue-700',
                      lead.enrichmentStatus === 'failed' &&
                        'bg-red-100 text-red-700',
                      !lead.enrichmentStatus && 'bg-gray-100 text-gray-600'
                    )}
                  >
                    {getStatusIcon(lead.enrichmentStatus)}
                    {lead.enrichmentStatus || 'pending'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Database({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 7v10c0 2 2 4 8 4s8-2 8-4V7M4 7c0 2 2 4 8 4s8-2 8-4M4 7c0-2 2-4 8-4s8 2 8 4m0 5c0 2-2 4-8 4s-8-2-8-4"
      />
    </svg>
  );
}
