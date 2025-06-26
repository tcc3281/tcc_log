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
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

// Improved LaTeX content processing function with better spacing and parsing
const processLatexContent = (content: string): string => {
  if (!content) return '';

  let processed = content;

  // First, preserve existing properly formatted math expressions
  const preservedMath: { placeholder: string; content: string }[] = [];
  
  // Helper function to add to preserved math with proper placeholders
  const preserveMath = (match: string, isDisplay: boolean, convertTo?: string) => {
    const mathContent = convertTo || match;
    const index = preservedMath.length;
    const placeholder = isDisplay ? 
      `__PRESERVED_DISPLAY_${index}__` : 
      `__PRESERVED_INLINE_${index}__`;
    
    preservedMath.push({
      placeholder,
      content: mathContent
    });
    
    return placeholder;
  };
  
  // Preserve display math ($$...$$) - handle multiline properly
  processed = processed.replace(/\$\$([^$]*(?:\$(?!\$)[^$]*)*)\$\$/g, (match) => {
    return preserveMath(match, true);
  });
    // Preserve \[ ... \] style display math - improved regex with lazy quantifier
  processed = processed.replace(/\\\\?\[([\s\S]*?)\\\\?\]/g, (match, math) => {
    // Mark explicitly as display math (block)
    return preserveMath(match, true, `\n\n$$${math}$$\n\n`);
  });
  // Preserve inline math ($...$) - be more careful with matching
  // Exclude cases like $10, $variable, etc. by requiring at least one math character
  processed = processed.replace(/(?<!\$)\$([\\\{\}\[\]\(\)a-zA-Z0-9\^\*\_\+\-\=\|\/\.,;:'"!@#%&<>? ]+?)\$(?!\$)/g, (match) => {
    return preserveMath(match, false);
  });

  // Preserve \( ... \) style inline math
  processed = processed.replace(/\\\\?\(([\s\S]*?)\\\\?\)/g, (match, math) => {
    return preserveMath(match, false, `$${math}$`);
  });
  // Handle complex math environments
  processed = processed.replace(/\\begin\{([^}]+)\}([\s\S]*?)\\end\{\1\}/g, (match, env, content) => {
    // If it's already wrapped in $$, preserve as is
    if (match.startsWith('$') && match.endsWith('$')) {
      return preserveMath(match, true);
    }
    
    // Otherwise wrap in $$
    const cleanContent = content
      .replace(/\s*\\\\\s*/g, ' \\\\ ')
      .replace(/\s+/g, ' ')
      .trim();
    const wrapped = `$$\\begin{${env}}${cleanContent}\\end{${env}}$$`;
    
    return preserveMath(match, true, wrapped);
  });
  // Add spaces around LaTeX expressions and ensure \[...\] displays as block
  preservedMath.forEach(item => {
    const placeholder = item.placeholder;
    let replacement = item.content;
    
    // Add spaces for inline math if not already present
    if (placeholder.includes('INLINE') && 
        !replacement.startsWith(' ') && 
        !replacement.endsWith(' ')) {
      // Check if it's a single dollar syntax or \( \) syntax
      if (replacement.startsWith('$') && replacement.endsWith('$')) {
        // Add spaces around single dollar inline math
        replacement = ` ${replacement} `;
      } else if (replacement.startsWith('\\(') && replacement.endsWith('\\)')) {
        // Add spaces around \( \) inline math
        replacement = ` ${replacement} `;
      }
    }
    
    // Ensure \[...\] is properly formatted as display math (block)
    if (replacement.startsWith('\\[') && replacement.endsWith('\\]')) {
      // Convert \[...\] to $$...$$ format to ensure proper block display
      replacement = `\n\n$$${replacement.slice(2, -2)}$$\n\n`;
    }
    
    processed = processed.replace(placeholder, replacement);
  });

  return processed;
};

// Configure markdown components
const markdownComponents: Components = {
  code({ node, className, children, ...props }) {
    const match = /language-(\w+)/.exec(className || '');
    const isInline = !match;
    let content = String(children).replace(/\n$/, '');
    
    // Handle SQL code blocks specifically
    if (match && match[1] === 'sql') {
      // Add newline if SQL keyword starts immediately after language declaration
      if (content.match(/^(SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP)/i)) {
        content = '\n' + content;
      }

      // Fix SQL formatting with proper spacing and newlines
      content = content
        .replace(/\bFROM\b/gi, '\nFROM')
        .replace(/\bJOIN\b/gi, '\nJOIN') 
        .replace(/\bLEFT JOIN\b/gi, '\nLEFT JOIN')
        .replace(/\bRIGHT JOIN\b/gi, '\nRIGHT JOIN')
        .replace(/\bINNER JOIN\b/gi, '\nINNER JOIN')
        .replace(/\bWHERE\b/gi, '\nWHERE')
        .replace(/\bORDER\s+BY\b/gi, '\nORDER BY')
        .replace(/\bGROUP\s+BY\b/gi, '\nGROUP BY') // Fixed typo: was GROB BY
        .replace(/\bHAVING\b/gi, '\nHAVING')
        .replace(/\bLIMIT\b/gi, '\nLIMIT')
        .replace(/\bOFFSET\b/gi, '\nOFFSET')
        .replace(/^\s+/gm, '  ') // Indent continued lines
        .trim();
    }
    
    return !isInline ? (
      <SyntaxHighlighter
        style={vscDarkPlus as any}
        language={match ? match[1] : 'text'}
        PreTag="div"
        className="rounded my-2"
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
  // Enhanced paragraph component to handle math blocks properly
  p: ({ node, children, ...props }) => {
    const content = React.Children.toArray(children).join('');
    const trimmedContent = content.trim();
    
    // Check for display math with more accurate pattern 
    // (needs to start and end with $$ to be considered a block)
    if (
      (trimmedContent.startsWith('$$') && trimmedContent.endsWith('$$')) ||
      (trimmedContent.startsWith('\\[') && trimmedContent.endsWith('\\]'))
    ) {
      return (
        <div className="math-display my-6 overflow-x-auto py-2 px-1 bg-gray-50 dark:bg-gray-900/30 rounded" {...props}>
          {children}
        </div>
      );
    }
    
    // Check if this paragraph contains a markdown table
    if (trimmedContent.includes('|') && trimmedContent.includes('---')) {
      // Let the default markdown processor handle it as a table
      return <div className="table-wrapper my-4" {...props}>{children}</div>;
    }
    
    return <p className="mb-3" {...props}>{children}</p>;
  },
  // Enhanced list components with better spacing
  ol: ({ children }) => <ol className="list-decimal pl-6 my-4 space-y-2">{children}</ol>,
  ul: ({ children }) => <ul className="list-disc pl-6 my-4 space-y-2">{children}</ul>,
  li: ({ children }) => <li className="mb-1 leading-relaxed">{children}</li>,
  // Better table styling
  table: ({ children }) => (
    <div className="overflow-x-auto my-4">
      <table className="border-collapse border-2 border-gray-300 dark:border-gray-600 w-full">
        {children}
      </table>
    </div>
  ),
  tr: ({ children }) => <tr className="border-b-2 border-gray-300 dark:border-gray-600">{children}</tr>,
  th: ({ children }) => (
    <th className="border-2 border-gray-300 dark:border-gray-600 px-4 py-2 bg-gray-100 dark:bg-gray-800 font-semibold text-left">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border-2 border-gray-300 dark:border-gray-600 px-4 py-2">
      {children}
    </td>
  ),
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-blue-400 dark:border-blue-500 pl-4 py-2 my-4 bg-blue-50 dark:bg-blue-900/20 italic">
      {children}
    </blockquote>
  ),
  img: (props) => <img {...props} className="max-w-full rounded my-4" alt={props.alt || "Image"} />,
  // Better heading styles
  h1: ({ children }) => <h1 className="text-2xl font-bold mb-4 mt-6">{children}</h1>,
  h2: ({ children }) => <h2 className="text-xl font-bold mb-3 mt-5">{children}</h2>,
  h3: ({ children }) => <h3 className="text-lg font-bold mb-2 mt-4">{children}</h3>,
  h4: ({ children }) => <h4 className="text-base font-bold mb-2 mt-3">{children}</h4>,
  // Enhanced strong/em styling
  strong: ({ children }) => <strong className="font-bold text-gray-900 dark:text-gray-100">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
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

  // Process content with improved LaTeX handling and table detection
  let processedContent = processLatexContent(message.content);
  
  // Special handling for SQL results with tables
  if (processedContent.includes('**✅ REAL Results:**') && processedContent.includes('|')) {
    // Ensure proper spacing around tables
    processedContent = processedContent.replace(/(\*\*✅ REAL Results:\*\*[^\n]*\n\n)/, '$1\n');
  }
  
  const processedThink = message.think ? processLatexContent(message.think) : '';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-6 ${className}`}>
      <div className={`flex items-start max-w-4xl ${isUser ? 'flex-row-reverse' : ''}`}>
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
            className={`p-4 rounded-lg ${
              isUser
                ? 'bg-blue-100 dark:bg-blue-800/60 text-gray-800 dark:text-gray-100'
                : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 shadow-sm'
            }`}
          >
            {/* Thinking Section - Collapsible */}
            {message.think && message.role === 'assistant' && (
              <div className="mb-4">
                <div 
                  className="mb-2 flex items-center justify-between cursor-pointer select-none p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
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
                    className="flex items-center hover:text-gray-700 dark:hover:text-gray-200 transition-colors text-xs"
                    title="Copy thinking process"
                    aria-label="Copy thinking process"
                  >
                    {copyStatus.think === 'copied' ? (
                      <CheckIcon className="h-3 w-3 mr-1 text-green-500" />
                    ) : (
                      <ClipboardIcon className="h-3 w-3 mr-1" />
                    )}
                    <span>{copyStatus.think === 'copied' ? "Copied" : "Copy"}</span>
                  </button>
                </div>
                
                {showThinking && (
                  <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-sm">
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
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm, remarkMath]}
                  rehypePlugins={[rehypeKatex]}
                  components={markdownComponents}
                >
                  {processedContent}
                </ReactMarkdown>
              </div>
            ) : (
              isStreaming && (
                <div className="flex space-x-2 items-center h-6">
                  <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse"></div>
                  <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                </div>
              )
            )}
          </div>

          {/* Timestamp, Stats, and Copy Button Row */}
          <div className={`flex mt-2 text-xs text-gray-500 dark:text-gray-400 ${isUser ? 'justify-end' : 'justify-start'}`}>
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
              
              {/* Vertical separator */}
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