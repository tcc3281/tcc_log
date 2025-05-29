'use client';

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { EntryAnalysisResponse } from '../../lib/ai-utils';

interface AnalysisDisplayProps {
  analysis: EntryAnalysisResponse;
  className?: string;
}

const AnalysisDisplay: React.FC<AnalysisDisplayProps> = ({ analysis, className = '' }) => {
  const [showThinking, setShowThinking] = useState(false);

  // Debug log
  console.log('AnalysisDisplay received analysis:', analysis);

  const getAnalysisTypeLabel = (type: string) => {
    const labels = {
      general: 'General Analysis',
      mood: 'Mood Analysis',
      summary: 'Summary',
      insights: 'Insights',
      grammar: 'Grammar Improvement',
      style: 'Style Improvement',
      vocabulary: 'Vocabulary Improvement',
      complete: 'Complete Improvement',
      suggestions: 'Writing Suggestions'
    };
    return labels[type as keyof typeof labels] || 'Analysis';
  };
  const getAnalysisTypeColor = (type: string) => {
    const colors = {
      general: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      mood: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
      summary: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      insights: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
      grammar: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
      style: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400',
      vocabulary: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400',
      complete: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      suggestions: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">AI Analysis</h3>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getAnalysisTypeColor(analysis.analysis_type)}`}>
                {getAnalysisTypeLabel(analysis.analysis_type)}
              </span>
            </div>
          </div>
          
          {analysis.think && (
            <button
              onClick={() => setShowThinking(!showThinking)}
              className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform ${showThinking ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
              <span>{showThinking ? 'Hide' : 'Show'} AI Reasoning</span>
            </button>
          )}
        </div>
      </div>

      {/* Thinking Section (Collapsible) */}
      {analysis.think && showThinking && (
        <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="p-1.5 rounded-full bg-yellow-100 dark:bg-yellow-900/30">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-yellow-600 dark:text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">AI Reasoning Process</h4>
              <div className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
                {analysis.think}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Answer Section */}
      <div className="p-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <div className="p-1.5 rounded-full bg-green-100 dark:bg-green-900/30">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Analysis Result</h4>
            <div className="text-gray-900 dark:text-white prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown>{analysis.answer}</ReactMarkdown>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
        <button
          onClick={() => navigator.clipboard.writeText(analysis.answer)}
          className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          Copy Answer
        </button>
        {analysis.think && (
          <button
            onClick={() => navigator.clipboard.writeText(analysis.raw_content)}
            className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            Copy Full Response
          </button>
        )}
      </div>
    </div>
  );
};

export default AnalysisDisplay; 