'use client';

import React, { useState } from 'react';
import { analyzeEntry } from '../../lib/ai-utils';
import AnalysisDisplay from './AnalysisDisplay';

interface EntryAnalysisProps {
  entryId: number;
  entryTitle: string;
}

const EntryAnalysis: React.FC<EntryAnalysisProps> = ({ entryId, entryTitle }) => {
  const [analysis, setAnalysis] = useState<any>(null);
  const [analysisType, setAnalysisType] = useState<'general' | 'mood' | 'summary' | 'insights'>('general');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<boolean>(false);

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await analyzeEntry(entryId, analysisType);
      setAnalysis(response);
      setExpanded(true);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'An error occurred while analyzing the journal entry');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">AI Analysis</h3>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        >
          {expanded ? 'Collapse' : 'Expand'}
        </button>
      </div>

      {expanded && (
        <>
          <div className="mb-4">
            <label htmlFor="analysisType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Analysis Type:
            </label>
            <select
              id="analysisType"
              value={analysisType}
              onChange={(e) => setAnalysisType(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="general">General Overview</option>
              <option value="mood">Mood Analysis</option>
              <option value="summary">Summary</option>
              <option value="insights">Deep Insights</option>
            </select>
          </div>

          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Analyzing...' : 'Analyze'}
          </button>

          {error && (
            <div className="mt-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-md">
              {error}
            </div>
          )}

          {analysis && (
            <div className="mt-4">
              <AnalysisDisplay analysis={analysis} />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default EntryAnalysis;
