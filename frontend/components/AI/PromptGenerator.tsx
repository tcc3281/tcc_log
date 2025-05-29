'use client';

import React, { useState } from 'react';
import { generatePrompts } from '../../lib/ai-utils';

interface PromptGeneratorProps {
  onSelectPrompt?: (prompt: string) => void;
}

const PromptGenerator: React.FC<PromptGeneratorProps> = ({ onSelectPrompt }) => {
  const [topic, setTopic] = useState<string>('');
  const [theme, setTheme] = useState<string>('');
  const [count, setCount] = useState<number>(5);
  const [prompts, setPrompts] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<boolean>(false);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);

    try {
      const generatedPrompts = await generatePrompts({
        topic,
        theme,
        count
      });
      setPrompts(generatedPrompts);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'An error occurred while generating prompts');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPrompt = (prompt: string) => {
    if (onSelectPrompt) {
      onSelectPrompt(prompt);
    }
  };

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Journal Writing Prompts</h3>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        >
          {expanded ? 'Collapse' : 'Expand'}
        </button>
      </div>

      {expanded && (
        <>
          <div className="space-y-4 mb-4">
            <div>
              <label htmlFor="topic" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Topic (optional):
              </label>
              <input
                id="topic"
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., gratitude, personal goals..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label htmlFor="theme" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Theme (optional):
              </label>
              <input
                id="theme"
                type="text"
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                placeholder="e.g., reflection, creativity..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label htmlFor="count" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Number of prompts:
              </label>
              <input
                id="count"
                type="number"
                min={1}
                max={10}
                value={count}
                onChange={(e) => setCount(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Generating prompts...' : 'Generate Prompts'}
          </button>

          {error && (
            <div className="mt-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-md">
              {error}
            </div>
          )}

          {prompts.length > 0 && (
            <div className="mt-4">
              <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-2">Prompts:</h4>
              <ul className="space-y-2">
                {prompts.map((prompt, index) => (
                  <li key={index} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md">
                    <div className="flex items-start">
                      <div className="flex-1 text-gray-800 dark:text-gray-200">{prompt}</div>
                      {onSelectPrompt && (
                        <button
                          onClick={() => handleSelectPrompt(prompt)}
                          className="ml-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PromptGenerator;
