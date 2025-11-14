'use client';

import { useState } from 'react';
import { LeadsTable } from '@/components/LeadsTable';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { Lead } from '@/types';

export default function Home() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          leads={leads}
          setLeads={setLeads}
          selectedLeads={selectedLeads}
        />
        <main className="flex-1 overflow-auto p-6">
          <LeadsTable
            leads={leads}
            setLeads={setLeads}
            selectedLeads={selectedLeads}
            setSelectedLeads={setSelectedLeads}
          />
        </main>
      </div>
    </div>
  );
}
