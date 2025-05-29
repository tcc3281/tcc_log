'use client';

import React, { useState, useEffect } from 'react';
import { improveWriting, getWritingSuggestions, getAvailableModels, WritingImprovementResponse, WritingSuggestionsResponse } from '../../lib/ai-utils';
import AnalysisDisplay from './AnalysisDisplay';

interface WritingImproverProps {
  onImprovedText?: (improvedText: string) => void;
  className?: string;
}

const WritingImprover: React.FC<WritingImproverProps> = ({ onImprovedText, className = '' }) => {
  const [inputText, setInputText] = useState('');
  const [improvementResult, setImprovementResult] = useState<WritingImprovementResponse | null>(null);
  const [suggestionsResult, setSuggestionsResult] = useState<WritingSuggestionsResponse | null>(null);
  const [improvementType, setImprovementType] = useState<'grammar' | 'style' | 'vocabulary' | 'complete'>('complete');
  const [loading, setLoading] = useState(false);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'improve' | 'suggestions'>('improve');
  const [models, setModels] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('');

  useEffect(() => {
    // Fetch available models when component mounts
    const fetchModels = async () => {
      try {
        const availableModels = await getAvailableModels();
        setModels(availableModels);
        if (availableModels.length > 0) {
          // Select first non-embedding model by default
          const defaultModel = availableModels.find(model => !model.toLowerCase().includes('embedding')) || availableModels[0];
          setSelectedModel(defaultModel);
        }
      } catch (err) {
        console.error('Failed to fetch models:', err);
      }
    };
    fetchModels();
  }, []);

  const handleImprove = async () => {
    if (!inputText.trim()) {
      setError('Please enter some text to improve');
      return;
    }

    if (inputText.length < 10) {
      setError('Text must be at least 10 characters long');
      return;
    }

    setLoading(true);
    setError(null);
    setImprovementResult(null);

    try {
      const response = await improveWriting(inputText, improvementType, selectedModel);
      setImprovementResult(response);
      
      if (onImprovedText) {
        onImprovedText(response.improved_text);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to improve text. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGetSuggestions = async () => {
    if (!inputText.trim()) {
      setError('Please enter some text to analyze');
      return;
    }

    if (inputText.length < 10) {
      setError('Text must be at least 10 characters long');
      return;
    }

    setSuggestionsLoading(true);
    setError(null);
    setSuggestionsResult(null);

    try {
      const response = await getWritingSuggestions(inputText, selectedModel);
      setSuggestionsResult(response);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to get suggestions. Please try again.');
    } finally {
      setSuggestionsLoading(false);
    }
  };

  const useImprovedText = () => {
    if (improvementResult) {
      setInputText(improvementResult.improved_text);
      setImprovementResult(null);
    }
  };

  // Convert improvement result to analysis format for display
  const getAnalysisFromImprovement = (result: WritingImprovementResponse) => ({
    entry_id: 0,
    title: `${result.improvement_type.charAt(0).toUpperCase() + result.improvement_type.slice(1)} Improvement`,
    think: result.think,
    answer: result.improved_text,
    raw_content: result.raw_content,
    analysis_type: result.improvement_type
  });

  // Convert suggestions result to analysis format for display
  const getAnalysisFromSuggestions = (result: WritingSuggestionsResponse) => ({
    entry_id: 0,
    title: 'Writing Suggestions',
    think: result.think,
    answer: result.suggestions,
    raw_content: result.raw_content,
    analysis_type: 'suggestions'
  });

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 ${className}`}>
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">AI Writing Assistant</h3>
          </div>
          
          {/* Tab Navigation */}
          <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('improve')}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                activeTab === 'improve'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Improve
            </button>
            <button
              onClick={() => setActiveTab('suggestions')}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                activeTab === 'suggestions'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Suggestions
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Model Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            AI Model
          </label>
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          >
            {models.map((model) => (
              <option key={model} value={model}>
                {model}
              </option>
            ))}
          </select>
        </div>

        {/* Input Text Area */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Your English Text
          </label>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Enter your English text here to improve grammar, style, and vocabulary..."
            className="w-full h-32 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white resize-none"
            maxLength={5000}
          />
          <div className="flex justify-between items-center mt-1">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {inputText.length}/5000 characters
            </span>
            {inputText.length > 0 && (
              <button
                onClick={() => setInputText('')}
                className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Improvement Type Selection (only for improve tab) */}
        {activeTab === 'improve' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Improvement Type
            </label>
            <select
              value={improvementType}
              onChange={(e) => setImprovementType(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="complete">Complete Enhancement (Grammar + Style + Vocabulary)</option>
              <option value="grammar">Grammar & Punctuation Only</option>
              <option value="style">Style & Flow Improvement</option>
              <option value="vocabulary">Vocabulary Enhancement</option>
            </select>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-3">
          {activeTab === 'improve' ? (
            <button
              onClick={handleImprove}
              disabled={loading || !inputText.trim()}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Improving...
                </>
              ) : (
                'Improve Writing'
              )}
            </button>
          ) : (
            <button
              onClick={handleGetSuggestions}
              disabled={suggestionsLoading || !inputText.trim()}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {suggestionsLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Analyzing...
                </>
              ) : (
                'Get Suggestions'
              )}
            </button>
          )}
          
          {/* Use Improved Text Button */}
          {activeTab === 'improve' && improvementResult && (
            <button
              onClick={useImprovedText}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              Use Improved Text
            </button>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}
      </div>

      {/* Results using AnalysisDisplay */}
      {activeTab === 'improve' && improvementResult && (
        <div className="p-4 pt-0">
          <AnalysisDisplay analysis={getAnalysisFromImprovement(improvementResult)} />
        </div>
      )}

      {activeTab === 'suggestions' && suggestionsResult && (
        <div className="p-4 pt-0">
          <AnalysisDisplay analysis={getAnalysisFromSuggestions(suggestionsResult)} />
        </div>
      )}
    </div>
  );
};

export default WritingImprover; 