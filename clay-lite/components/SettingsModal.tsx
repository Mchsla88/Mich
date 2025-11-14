'use client';

import { useState, useEffect } from 'react';
import { X, Key, Save } from 'lucide-react';
import { ApiKeys } from '@/types';

interface SettingsModalProps {
  onClose: () => void;
}

export function SettingsModal({ onClose }: SettingsModalProps) {
  const [apiKeys, setApiKeys] = useState<ApiKeys>({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // Load saved API keys from localStorage
    const savedKeys = localStorage.getItem('apiKeys');
    if (savedKeys) {
      setApiKeys(JSON.parse(savedKeys));
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem('apiKeys', JSON.stringify(apiKeys));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Settings</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Key className="w-5 h-5" />
                API Keys
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Gemini API Key
                    <span className="text-red-500 ml-1">*</span>
                    <span className="text-gray-500 font-normal ml-2">
                      (Required for AI Research)
                    </span>
                  </label>
                  <input
                    type="password"
                    value={apiKeys.gemini || ''}
                    onChange={(e) =>
                      setApiKeys({ ...apiKeys, gemini: e.target.value })
                    }
                    placeholder="AIza..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Get your API key at{' '}
                    <a
                      href="https://makersuite.google.com/app/apikey"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-600 hover:underline"
                    >
                      Google AI Studio
                    </a>
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Clearbit API Key
                    <span className="text-gray-500 font-normal ml-2">
                      (500 lookups/month free)
                    </span>
                  </label>
                  <input
                    type="password"
                    value={apiKeys.clearbit || ''}
                    onChange={(e) =>
                      setApiKeys({ ...apiKeys, clearbit: e.target.value })
                    }
                    placeholder="sk_..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Sign up at{' '}
                    <a
                      href="https://clearbit.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-600 hover:underline"
                    >
                      clearbit.com
                    </a>
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hunter.io API Key
                    <span className="text-gray-500 font-normal ml-2">
                      (25 verifications/month free)
                    </span>
                  </label>
                  <input
                    type="password"
                    value={apiKeys.hunter || ''}
                    onChange={(e) =>
                      setApiKeys({ ...apiKeys, hunter: e.target.value })
                    }
                    placeholder="..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Get your API key at{' '}
                    <a
                      href="https://hunter.io/api"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-600 hover:underline"
                    >
                      hunter.io
                    </a>
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Google Custom Search API Key
                    <span className="text-gray-500 font-normal ml-2">
                      (100 queries/day free)
                    </span>
                  </label>
                  <input
                    type="password"
                    value={apiKeys.googleSearch || ''}
                    onChange={(e) =>
                      setApiKeys({ ...apiKeys, googleSearch: e.target.value })
                    }
                    placeholder="AIza..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Google Search Engine ID
                  </label>
                  <input
                    type="text"
                    value={apiKeys.googleSearchEngineId || ''}
                    onChange={(e) =>
                      setApiKeys({
                        ...apiKeys,
                        googleSearchEngineId: e.target.value,
                      })
                    }
                    placeholder="..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Create a custom search engine at{' '}
                    <a
                      href="https://programmablesearchengine.google.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-600 hover:underline"
                    >
                      Google CSE
                    </a>
                  </p>
                </div>
              </div>
            </div>

            {saved && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
                ✓ Settings saved successfully!
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:text-gray-900"
          >
            Close
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            <Save className="w-4 h-4" />
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}
