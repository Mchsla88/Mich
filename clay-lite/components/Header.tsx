'use client';

import { useState } from 'react';
import { Upload, Download, RefreshCw, Settings, Sparkles } from 'lucide-react';
import { Lead } from '@/types';
import { ImportModal } from './ImportModal';
import { SettingsModal } from './SettingsModal';
import { exportToCSV } from '@/lib/csv';

interface HeaderProps {
  leads: Lead[];
  setLeads: (leads: Lead[]) => void;
  selectedLeads: string[];
}

export function Header({ leads, setLeads, selectedLeads }: HeaderProps) {
  const [showImport, setShowImport] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [enriching, setEnriching] = useState(false);

  const handleEnrichSelected = async () => {
    if (selectedLeads.length === 0) {
      alert('Please select leads to enrich');
      return;
    }

    setEnriching(true);

    // Update status to enriching for selected leads
    setLeads(
      leads.map((lead) =>
        selectedLeads.includes(lead.id)
          ? { ...lead, enrichmentStatus: 'enriching' as const }
          : lead
      )
    );

    try {
      const leadsToEnrich = leads.filter((lead) =>
        selectedLeads.includes(lead.id)
      );

      const response = await fetch('/api/enrich', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadIds: selectedLeads,
          leads: leadsToEnrich,
        }),
      });

      if (response.ok) {
        const enrichedLeads = await response.json();
        setLeads(
          leads.map((lead) =>
            selectedLeads.includes(lead.id)
              ? enrichedLeads.find((el: Lead) => el.id === lead.id) || lead
              : lead
          )
        );
      } else {
        // Mark as failed
        setLeads(
          leads.map((lead) =>
            selectedLeads.includes(lead.id)
              ? { ...lead, enrichmentStatus: 'failed' as const }
              : lead
          )
        );
        alert('Enrichment failed. Please check your API keys in Settings.');
      }
    } catch (error) {
      console.error('Enrichment failed:', error);
      setLeads(
        leads.map((lead) =>
          selectedLeads.includes(lead.id)
            ? { ...lead, enrichmentStatus: 'failed' as const }
            : lead
        )
      );
      alert('Enrichment failed. Please try again.');
    } finally {
      setEnriching(false);
    }
  };

  const handleExport = () => {
    exportToCSV(leads, 'leads-export.csv');
  };

  return (
    <>
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Sparkles className="w-7 h-7 text-purple-600" />
              Clay LITE
            </h1>
            <p className="text-sm text-gray-500">
              {leads.length} leads • {selectedLeads.length} selected
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowImport(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Upload className="w-4 h-4" />
              Import
            </button>

            <button
              onClick={handleExport}
              disabled={leads.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              Export
            </button>

            <button
              onClick={handleEnrichSelected}
              disabled={selectedLeads.length === 0 || enriching}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-4 h-4 ${enriching ? 'animate-spin' : ''}`} />
              {enriching ? 'Enriching...' : 'Enrich Selected'}
            </button>

            <button
              onClick={() => setShowSettings(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {showImport && (
        <ImportModal
          onClose={() => setShowImport(false)}
          onImport={(newLeads) => {
            setLeads([...leads, ...newLeads]);
            setShowImport(false);
          }}
        />
      )}

      {showSettings && (
        <SettingsModal onClose={() => setShowSettings(false)} />
      )}
    </>
  );
}
