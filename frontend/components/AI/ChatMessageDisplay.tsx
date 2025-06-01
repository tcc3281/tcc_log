'use client';

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Components } from 'react-markdown';
import { ChatMessage } from '../../lib/ai-utils';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import remarkMath from 'remark-math';
import 'katex/dist/katex.min.css';
import { 
  UserCircleIcon, 
  ComputerDesktopIcon, 
  ClockIcon, 
  BoltIcon, 
  ChevronDownIcon, 
  ChevronUpIcon, 
  ClipboardIcon, 
  CheckIcon 
} from '@heroicons/react/24/solid';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
// Use esm version to avoid TypeScript errors
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import katex from 'katex';

// Process LaTeX content before rendering
// Improved LaTeX content processing function
// Improved LaTeX content processing function
// Improved LaTeX content processing function
const processLatexContent = (content: string): string => {
  if (!content) return '';

  let processed = content;

  // First, preserve existing properly formatted math expressions
  const preservedMath: string[] = [];
  
  // Preserve display math ($$...$$)
  processed = processed.replace(/\$\$([^$]+?)\$\$/g, (match, math) => {
    const index = preservedMath.length;
    preservedMath.push(match);
    return `__PRESERVED_DISPLAY_${index}__`;
  });
  
  // Preserve inline math ($...$)
  processed = processed.replace(/\$([^$\n]+?)\$/g, (match, math) => {
    const index = preservedMath.length;
    preservedMath.push(match);
    return `__PRESERVED_INLINE_${index}__`;
  });

  // Fix malformed expressions like "A = $\begin{bmatrix}..." (missing closing $)
  processed = processed.replace(/\$\$\\begin\{([^}]+)\}([^$]*?)\\end\{\1\}(?!\$)/g, (match, env, content) => {
    const cleanContent = content.replace(/\s*\\\\\s*/g, ' \\\\ ').trim();
    return `$$\\begin{${env}}${cleanContent}\\end{${env}}$$`;
  });

  // Convert \[ ... \] to $$ ... $$ (display math)
  processed = processed.replace(/\\\[\s*([\s\S]*?)\s*\\\]/g, (match, math) => {
    const cleanMath = math
      .replace(/\s*\\\\\s*/g, ' \\\\ ') // Normalize line breaks
      .replace(/\s+/g, ' ') // Normalize spaces
      .trim();
    return `$$${cleanMath}$$`;
  });

  // Convert \( ... \) to $ ... $ (inline math)
  processed = processed.replace(/\\\(\s*([\s\S]*?)\s*\\\)/g, (match, math) => {
    const cleanMath = math.trim();
    return `$${cleanMath}$`;
  });

  // Handle standalone matrix environments that aren't already in math mode
  processed = processed.replace(/(?<!\$)\\begin\{([^}]+)\}([\s\S]*?)\\end\{\1\}(?!\$)/g, (match, env, content) => {
    const cleanContent = content
      .replace(/\s*\\\\\s*/g, ' \\\\ ') // Normalize line breaks
      .replace(/\s+/g, ' ') // Normalize spaces
      .trim();
    return `$$\\begin{${env}}${cleanContent}\\end{${env}}$$`;
  });

  // Handle complex expressions with \frac that contain matrix environments
  processed = processed.replace(/\\frac\{([^}]+)\}\{([^}]+)\}\s*\\begin\{([^}]+)\}([\s\S]*?)\\end\{\3\}/g, (match, num, den, env, content) => {
    const cleanContent = content
      .replace(/\s*\\\\\s*/g, ' \\\\ ')
      .replace(/\s+/g, ' ')
      .trim();
    return `$$\\frac{${num}}{${den}} \\begin{${env}}${cleanContent}\\end{${env}}$$`;
  });

  // Clean up whitespace around math delimiters
  processed = processed.replace(/\$\s+/g, '$');
  processed = processed.replace(/\s+\$/g, '$');
  processed = processed.replace(/\$\$\s+/g, '$$');
  processed = processed.replace(/\s+\$\$/g, '$$');

  // Restore preserved math expressions
  preservedMath.forEach((math, index) => {
    processed = processed.replace(`__PRESERVED_DISPLAY_${index}__`, math);
    processed = processed.replace(`__PRESERVED_INLINE_${index}__`, math);
  });

  // Final cleanup - normalize multiple dollar signs to display math
  processed = processed.replace(/\$\$\$+/g, '$$');

  return processed;
};

// Custom math component
const MathComponent = ({ math, display }: { math: string; display: boolean }) => {
  const Delimiter = display ? '$$' : '$';
  return <span>{`${Delimiter}${math}${Delimiter}`}</span>;
};

// Configure markdown components
const markdownComponents: Components = {
  code({ node, className, children, ...props }) {
    const match = /language-(\w+)/.exec(className || '');
    const isInline = !match;
    const content = String(children).replace(/\n$/, '');
    
    // Check if this is a LaTeX code block
    if (match && match[1] === 'latex') {
      // Process the LaTeX content
      const processedContent = processLatexContent(content);
      
      return (
        <div className="my-4">
          <ReactMarkdown
            remarkPlugins={[remarkGfm, remarkMath]}
            rehypePlugins={[rehypeKatex]}
            components={{
              // Override code component to prevent double rendering
              code: ({ node, ...props }) => <span {...props} />,
              // Override paragraph to handle math blocks
              p: ({ node, children, ...props }) => {
                const content = React.Children.toArray(children).join('');
                if (content.startsWith('$$') && content.endsWith('$$')) {
                  return <div className="math-block overflow-x-auto" {...props}>{children}</div>;
                }
                return <p {...props}>{children}</p>;
              }
            }}
          >
            {processedContent}
          </ReactMarkdown>
        </div>
      );
    }
    
    return !isInline ? (
      <SyntaxHighlighter
        style={vscDarkPlus as any}
        language={match ? match[1] : 'text'}
        PreTag="div"
        className="rounded"
        {...props}
      >
        {content}
      </SyntaxHighlighter>
    ) : (
      <code className={`${className} bg-gray-200 dark:bg-gray-800 px-1 py-0.5 rounded text-sm`} {...props}>
        {children}
      </code>
    );
  },
  // Add paragraph component to handle math blocks in both think and response
  p: ({ node, children, ...props }) => {
    const content = React.Children.toArray(children).join('');
    if (content.startsWith('$$') && content.endsWith('$$')) {
      return <div className="math-block overflow-x-auto" {...props}>{children}</div>;
    }
    return <p {...props}>{children}</p>;
  },
  // Add list components
  ol: ({ children }) => <ol className="list-decimal pl-5 my-3 space-y-1">{children}</ol>,
  ul: ({ children }) => <ul className="list-disc pl-5 my-3 space-y-1">{children}</ul>,
  li: ({ children }) => <li className="mb-1">{children}</li>,
  // Handle tables, blockquotes, and other elements with better styling
  table: ({ children }) => <table className="border-collapse border-2 border-gray-300 dark:border-gray-600 my-4 w-full">{children}</table>,
  tr: ({ children }) => <tr className="border-b-2 border-gray-300 dark:border-gray-600">{children}</tr>,
  th: ({ children }) => <th className="border-2 border-gray-300 dark:border-gray-600 px-4 py-2 bg-gray-100 dark:bg-gray-800 font-semibold">{children}</th>,
  td: ({ children }) => <td className="border-2 border-gray-300 dark:border-gray-600 px-4 py-2">{children}</td>,
  blockquote: ({ children }) => <blockquote className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 italic my-4">{children}</blockquote>,
  img: (props) => <img {...props} className="max-w-full rounded my-4" alt={props.alt || "Image"} />
};

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
  const [copyStatus, setCopyStatus] = useState<Record<string, 'idle' | 'copied'>>({
    user: 'idle',
    assistant: 'idle',
    think: 'idle'
  });

  // Handle copy button click
  const handleCopy = (text: string, role: 'user' | 'assistant' | 'think') => {
    navigator.clipboard.writeText(text).then(() => {
      setCopyStatus(prev => ({ ...prev, [role]: 'copied' }));
      setTimeout(() => setCopyStatus(prev => ({ ...prev, [role]: 'idle' })), 2000);
    });
  };

  // Format stats for display
  const formatStats = () => {
    if (!message.inference_time && !message.tokens_per_second) return null;

    // Estimate total tokens based on content length (approximate)
    const totalTokens = Math.round((message.content?.length || 0) / 4);

    return (
      <div className="flex items-center gap-2">
        {message.inference_time && (
          <div className="flex items-center">
            <ClockIcon className="h-3 w-3 mr-1 text-gray-400" />
            <span>{(message.inference_time / 1000).toFixed(2)}s</span>
          </div>
        )}
        
        {message.tokens_per_second && (
          <div className="flex items-center">
            <BoltIcon className="h-3 w-3 mr-1 text-gray-400" />
            <span>{message.tokens_per_second.toFixed(1)} t/s</span>
            <span className="mx-1">|</span>
            <span>{totalTokens} tokens</span>
          </div>
        )}
      </div>
    );
  };

  // Format timestamp
  const formatTime = (timestamp?: Date) => {
    if (!timestamp) return '';
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(timestamp);
  };

  // For system messages
  if (message.role === 'system') {
    return (
      <div className="flex justify-center my-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 p-3 rounded-lg max-w-md text-sm">
          {message.content}
        </div>
      </div>
    );
  }

  const isUser = message.role === 'user';

  // Process content with LaTeX
  const processedContent = processLatexContent(message.content);
  const processedThink = message.think ? processLatexContent(message.think) : '';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`flex items-start max-w-3xl ${isUser ? 'flex-row-reverse' : ''}`}>
        {/* Avatar */}
        <div className={`flex-shrink-0 ${isUser ? 'ml-3' : 'mr-3'}`}>
          {isUser ? (
            <UserCircleIcon className="h-8 w-8 text-blue-500 dark:text-blue-400" />
          ) : (
            <ComputerDesktopIcon className="h-8 w-8 text-green-500 dark:text-green-400" />
          )}
        </div>

        {/* Message Content */}
        <div className="flex flex-col relative w-full">          
          <div
            className={`p-3 rounded-lg ${
              isUser
                ? 'bg-blue-100 dark:bg-blue-800/60 text-gray-800 dark:text-gray-100'
                : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100'
            }`}
          >
            {/* Thinking Section - Collapsible */}
            {message.think && message.role === 'assistant' && (
              <div className="mb-3">
                <div 
                  className="mb-1 flex items-center justify-between cursor-pointer select-none"
                  onClick={() => setShowThinking(!showThinking)}
                >
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center">
                    {showThinking ? (
                      <ChevronUpIcon className="h-3 w-3 mr-1" />
                    ) : (
                      <ChevronDownIcon className="h-3 w-3 mr-1" />
                    )}
                    Thinking process
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopy(message.think || '', 'think');
                    }}
                    className="flex items-center hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                    title="Copy thinking process"
                    aria-label="Copy thinking process"
                  >
                    {copyStatus.think === 'copied' ? (
                      <CheckIcon className="h-3 w-3 mr-1 text-green-500" />
                    ) : (
                      <ClipboardIcon className="h-3 w-3 mr-1" />
                    )}
                    <span className="text-xs">{copyStatus.think === 'copied' ? "Copied" : "Copy"}</span>
                  </button>
                </div>
                
                {showThinking && (
                  <div className="p-2 bg-gray-100 dark:bg-gray-900/50 rounded border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-sm">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm, remarkMath]}
                      rehypePlugins={[rehypeKatex]}
                      components={markdownComponents}
                    >
                      {processedThink}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
            )}

            {/* Main Content */}
            {message.content ? (
              <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkMath]}
                rehypePlugins={[rehypeKatex]}
                components={markdownComponents}
              >
                {processedContent}
              </ReactMarkdown>
            ) : (
              isStreaming && (
                <div className="flex space-x-2 items-center h-6">
                  <div className="w-2 h-2 rounded-full bg-gray-300 animate-pulse"></div>
                  <div className="w-2 h-2 rounded-full bg-gray-300 animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 rounded-full bg-gray-300 animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                </div>
              )
            )}
          </div>

          {/* Timestamp, Stats, and Copy Button Row */}
          <div className={`flex mt-1 text-xs text-gray-500 dark:text-gray-400 ${isUser ? 'justify-end' : 'justify-start'}`}>
            <div className="flex items-center gap-3">
              {/* Character and word count for user messages */}
              {isUser && message.content && (
                <>
                  <span>{message.content.length} characters</span>
                  <span className="text-gray-300 dark:text-gray-600">|</span>
                  <span>{message.content.split(/\s+/).filter(Boolean).length} words</span>
                  <span className="text-gray-300 dark:text-gray-600">|</span>
                </>
              )}
              
              {/* Copy button */}
              {message.content && (
                <button
                  onClick={() => handleCopy(message.content, isUser ? 'user' : 'assistant')}
                  className="flex items-center hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                  title={isUser ? "Copy prompt" : "Copy response"}
                  aria-label={isUser ? "Copy prompt" : "Copy response"}
                >
                  {copyStatus[isUser ? 'user' : 'assistant'] === 'copied' ? (
                    <CheckIcon className="h-3 w-3 mr-1 text-green-500" />
                  ) : (
                    <ClipboardIcon className="h-3 w-3 mr-1" />
                  )}
                  <span>{copyStatus[isUser ? 'user' : 'assistant'] === 'copied' ? "Copied" : "Copy"}</span>
                </button>
              )}
              
              {/* Vertical separator if both copy button and timestamp exist */}
              {message.content && message.timestamp && (
                <span className="text-gray-300 dark:text-gray-600">|</span>
              )}
              
              {/* Timestamp with clock icon */}
              {message.timestamp && (
                <div className="flex items-center">
                  <ClockIcon className="h-3 w-3 mr-1" />
                  <span>{formatTime(message.timestamp)}</span>
                </div>
              )}
              
              {/* Stats display */}
              {(message.inference_time || message.tokens_per_second) && (
                <>
                  {message.timestamp && (
                    <span className="text-gray-300 dark:text-gray-600">|</span>
                  )}
                  {formatStats()}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatMessageDisplay;

