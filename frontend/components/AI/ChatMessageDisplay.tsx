'use client';

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { ChatMessage } from '../../lib/ai-utils';

interface ChatMessageDisplayProps {
  message: ChatMessage;
  isStreaming?: boolean;
  className?: string;
}

const ChatMessageDisplay: React.FC<ChatMessageDisplayProps> = ({ 
  message, 
  isStreaming = false, 
  className = '' 
}) => {
  const [showThinking, setShowThinking] = useState(false);

  // Format timestamp
  const formatTimestamp = (timestamp?: Date) => {
    if (!timestamp) return '';
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(timestamp);
  };

  // For system messages
  if (message.role === 'system') {
    return (
      <div className={`flex justify-start ${className}`}>
        <div className="max-w-[80%] py-2 px-4 rounded-lg bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
          <div className="flex items-center mb-1 text-sm font-medium text-gray-500 dark:text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            System
          </div>
          <div className="whitespace-pre-wrap">{message.content}</div>
        </div>
      </div>
    );
  }

  // For user messages
  if (message.role === 'user') {
    return (
      <div className={`flex justify-end ${className}`}>
        <div className="max-w-[80%] py-2 px-4 rounded-lg bg-blue-600 text-white">
          <div className="whitespace-pre-wrap">{message.content}</div>
          {message.timestamp && (
            <div className="text-xs mt-1 text-right text-blue-200">
              {formatTimestamp(message.timestamp)}
            </div>
          )}
        </div>
      </div>
    );
  }

  // For AI assistant messages with think/answer separation
  const hasThinking = message.think && message.think.trim().length > 0;

  return (
    <div className={`flex justify-start ${className}`}>
      <div className="max-w-[85%] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
        {/* Header */}
        <div className="p-3 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 rounded-full bg-blue-100 dark:bg-blue-900/30">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-white">AI Assistant</h4>
                {isStreaming && (
                  <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                    <span>Responding...</span>
                  </div>
                )}
              </div>
            </div>
            
            {hasThinking && !isStreaming && (
              <button
                onClick={() => setShowThinking(!showThinking)}
                className="flex items-center space-x-1 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-3 w-3 transition-transform ${showThinking ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
                <span>{showThinking ? 'Hide' : 'Show'} AI Reasoning</span>
              </button>
            )}
          </div>
        </div>

        {/* Thinking Section (Collapsible) */}
        {hasThinking && (showThinking || isStreaming) && (
          <div className="p-3 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-start space-x-2">
              <div className="flex-shrink-0">
                <div className="p-1 rounded-full bg-yellow-100 dark:bg-yellow-900/30">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-yellow-600 dark:text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="flex-1">
                <h5 className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">AI Reasoning Process</h5>
                <div className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap bg-white dark:bg-gray-800 rounded-md p-2 border border-gray-200 dark:border-gray-600">
                  {message.think}
                  {isStreaming && (
                    <span className="inline-block w-2 h-4 bg-yellow-500 animate-pulse ml-1"></span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Answer Section */}
        <div className="p-3">
          <div className="flex items-start space-x-2">
            <div className="flex-shrink-0">
              <div className="p-1 rounded-full bg-green-100 dark:bg-green-900/30">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="flex-1">
              <h5 className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Response</h5>
              <div className="text-gray-900 dark:text-white prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown>{message.content}</ReactMarkdown>
                {isStreaming && (
                  <span className="inline-block w-2 h-4 bg-green-500 animate-pulse ml-1"></span>
                )}
              </div>
            </div>
          </div>
          
          {message.timestamp && !isStreaming && (
            <div className="text-xs mt-2 text-right text-gray-400 dark:text-gray-500">
              {formatTimestamp(message.timestamp)}
            </div>
          )}
        </div>

        {/* Actions */}
        {!isStreaming && (
          <div className="px-3 py-2 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
            <button
              onClick={() => navigator.clipboard.writeText(message.content)}
              className="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Copy Response
            </button>
            {hasThinking && (
              <button
                onClick={() => navigator.clipboard.writeText(`${message.think}\n\n${message.content}`)}
                className="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Copy Full
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessageDisplay;
