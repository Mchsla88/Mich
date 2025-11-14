'use client';

import { Database, Zap, Award, BarChart3, FileText } from 'lucide-react';

export function Sidebar() {
  return (
    <aside className="w-64 bg-white border-r border-gray-200 p-6">
      <nav className="space-y-2">
        <a
          href="#"
          className="flex items-center gap-3 px-4 py-3 text-purple-600 bg-purple-50 rounded-lg font-medium"
        >
          <Database className="w-5 h-5" />
          All Leads
        </a>

        <a
          href="#"
          className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
        >
          <Zap className="w-5 h-5" />
          Workflows
        </a>

        <a
          href="#"
          className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
        >
          <Award className="w-5 h-5" />
          Lead Scoring
        </a>

        <a
          href="#"
          className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
        >
          <BarChart3 className="w-5 h-5" />
          Analytics
        </a>

        <a
          href="#"
          className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
        >
          <FileText className="w-5 h-5" />
          Reports
        </a>
      </nav>

      <div className="mt-8 p-4 bg-purple-50 rounded-lg">
        <h3 className="font-semibold text-gray-900 mb-2">Free Tier</h3>
        <p className="text-sm text-gray-600 mb-3">
          500 Clearbit lookups/month
          <br />
          25 Hunter verifications/month
        </p>
        <button className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors">
          Upgrade
        </button>
      </div>
    </aside>
  );
}
