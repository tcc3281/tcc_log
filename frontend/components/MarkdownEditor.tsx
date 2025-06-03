"use client";

import React, { useState, useEffect, useRef } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus, vs } from "react-syntax-highlighter/dist/esm/styles/prism";
import remarkGfm from 'remark-gfm';
import ReactMarkdown from 'react-markdown';
import mermaid from 'mermaid';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import emojiUtils from '../lib/emoji-utils';
import styles from './MarkdownStyles.module.css';
import EmojiPicker from './EmojiPicker';

// Mermaid initialization with more robust configuration
// We'll initialize mermaid in the component to properly handle dark/light mode
const initializeMermaid = () => {
  mermaid.initialize({
    startOnLoad: false, // We'll manually initialize
    theme: 'default',
    securityLevel: 'loose',
    fontFamily: 'sans-serif',
    fontSize: 14,
    flowchart: {
      useMaxWidth: true,
      htmlLabels: true,
      curve: 'basis'
    },
    sequence: {
      useMaxWidth: true,
      wrap: true,
      showSequenceNumbers: false
    },
    gantt: {
      useMaxWidth: true
    },
    er: {
      useMaxWidth: true
    }
  });
};

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  height?: string;
  placeholder?: string;
  onFileUpload?: () => void;
}

interface ToolbarButton {
  icon: string | React.ReactNode;
  label: string;
  action: (e?: React.MouseEvent<HTMLButtonElement>) => void;
  className?: string;
}

const MarkdownEditor: React.FC<MarkdownEditorProps> = ({ 
  value, 
  onChange, 
  height = "300px",
  placeholder = "Write your markdown here...",
  onFileUpload
}) => {  const [isPreview, setIsPreview] = useState(false);
  const [splitView, setSplitView] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [emojiPickerAnchor, setEmojiPickerAnchor] = useState<{ top: number, left: number } | null>(null);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const [selectedText, setSelectedText] = useState({ start: 0, end: 0, text: "" });

  // Synchronize scrolling between editor and preview
  const handleEditorScroll = () => {
    if (!splitView || !editorRef.current || !previewRef.current) return;
    
    const editorPercent = editorRef.current.scrollTop / 
      (editorRef.current.scrollHeight - editorRef.current.clientHeight);
    
    previewRef.current.scrollTop = editorPercent * 
      (previewRef.current.scrollHeight - previewRef.current.clientHeight);
  };
  // Initialize mermaid when component mounts and handle dark mode changes
  useEffect(() => {
    // Initialize mermaid with proper configuration
    initializeMermaid();
    
    // Setup dark mode listener for mermaid theme
    const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    // Update mermaid theme when color scheme changes
    const handleColorSchemeChange = (e: MediaQueryListEvent) => {
      initializeMermaid();
      if (isPreview || splitView) {
        setTimeout(renderMermaidDiagrams, 100);
      }
    };
    
    // Add listener for color scheme changes
    darkModeMediaQuery.addEventListener('change', handleColorSchemeChange);
    
    // Cleanup on unmount
    return () => {
      darkModeMediaQuery.removeEventListener('change', handleColorSchemeChange);
    };
  }, []);
  
  // Process markdown for preview
  const processedMarkdown = React.useMemo(() => {
    let processed = value;

    // Process emoji shortcodes using our utility function
    processed = emojiUtils.shortnameToUnicode(processed);

    // Process LaTeX blocks
    processed = processed.replace(/\$\$(.*?)\$\$/g, (match, formula) => {
      try {
        const html = katex.renderToString(formula, { displayMode: true });
        return `<div class="katex-block">${html}</div>`;
      } catch (e) {
        console.error('LaTeX parsing error:', e);
        return match;
      }
    });

    // Process inline LaTeX
    processed = processed.replace(/\$(.*?)\$/g, (match, formula) => {
      try {
        const html = katex.renderToString(formula, { displayMode: false });
        return `<span class="katex-inline">${html}</span>`;
      } catch (e) {
        console.error('LaTeX parsing error:', e);
        return match;
      }
    });

    return processed;
  }, [value]);  // Function to safely re-initialize and render mermaid diagrams
  const renderMermaidDiagrams = React.useCallback(() => {
    // Only proceed if we're in preview or split mode and the preview container exists
    if ((isPreview || splitView) && previewRef.current) {
      try {
        // Step 1: Reset mermaid to a clean state first
        initializeMermaid();
        
        // Step 2: Clean up any existing mermaid diagrams so we can re-render them
        const existingDiagrams = previewRef.current.querySelectorAll('.mermaid');
        if (existingDiagrams.length > 0) {
          existingDiagrams.forEach(diagram => {
            if (diagram.getAttribute('data-processed') === 'true') {
              diagram.removeAttribute('data-processed');
              // Add a processing class for visual feedback
              diagram.classList.add('mermaid-reloading');
            }
          });
        }
        
        // Step 3: Find all mermaid code blocks that need conversion
        const mermaidBlocks = previewRef.current.querySelectorAll('pre[data-mermaid-container="true"] code.language-mermaid');
        
        if (mermaidBlocks && mermaidBlocks.length > 0) {
          // Step 4: Convert code blocks to mermaid containers
          mermaidBlocks.forEach((block, index) => {
            try {
              // Get ID from data attribute or generate a new one
              const id = block.getAttribute('data-diagram-id') || `mermaid-diagram-${index}-${Date.now()}`;
              const content = block.textContent?.trim() || '';
              
              // Skip if content is empty
              if (!content) return;
              
              // Get parent elements
              const preElement = block.closest('pre[data-mermaid-container="true"]');
              const parent = preElement?.parentNode;
              
              if (!preElement || !parent) return;
              
              // Check if this code block has already been converted
              const existingDiagram = parent.querySelector(`#${id}`);
              if (existingDiagram) {
                // Just ensure it's reprocessed
                existingDiagram.removeAttribute('data-processed');
                return;
              }
              
              // Create the mermaid container
              const container = document.createElement('div');
              container.id = id;
              container.className = 'mermaid mermaid-loading';
              container.textContent = content;
              container.setAttribute('data-source-line', block.getAttribute('data-source-line') || '');
              
              // Replace the pre block with the mermaid container
              parent.replaceChild(container, preElement);
            } catch (error) {
              console.error('Mermaid container creation error:', error);
            }
          });
          
          // Step 5: Render all mermaid diagrams with staggered timing to prevent browser freeze
          const renderAllMermaid = () => {
            try {
              // Remove loading indicators
              document.querySelectorAll('.mermaid-loading').forEach(el => {
                el.classList.remove('mermaid-loading');
              });
              
              // Process diagrams that haven't been processed yet
              mermaid.init(
                undefined, 
                document.querySelectorAll('.mermaid:not([data-processed="true"])')
              );
              
              // Remove reloading class from all diagrams
              document.querySelectorAll('.mermaid-reloading').forEach(el => {
                el.classList.remove('mermaid-reloading');
              });
            } catch (error) {
              console.error('Mermaid rendering error:', error);
              
              // Fallback: try one more time with a deeper reset
              try {
                console.log('Attempting fallback mermaid rendering...');
                
                // Force clean all diagrams
                document.querySelectorAll('.mermaid').forEach(element => {
                  element.removeAttribute('data-processed');
                });
                
                // Re-initialize with more forgiving options
                mermaid.initialize({
                  startOnLoad: false,
                  theme: 'default',
                  securityLevel: 'loose',
                  fontFamily: 'sans-serif',
                  flowchart: {
                    useMaxWidth: true,
                    htmlLabels: true
                  }
                });
                
                // Last attempt to render
                mermaid.init(undefined, document.querySelectorAll('.mermaid'));
              } catch (fallbackError) {
                console.error('Mermaid fallback rendering failed:', fallbackError);
              }
            }
          };
          
          // Give the DOM time to update before rendering diagrams
          setTimeout(renderAllMermaid, 100);
        }
      } catch (error) {
        console.error('Error in mermaid rendering process:', error);
      }
    }
  }, [isPreview, splitView, value]);
  
  // Effect for rendering Mermaid diagrams after markdown is rendered or view mode changes
  useEffect(() => {
    // Debounce the mermaid rendering to prevent too frequent updates
    const renderTimeout = setTimeout(() => {
      renderMermaidDiagrams();
    }, 300); // Add a 300ms delay for better performance
    
    // Clean up timeout when component unmounts or when dependencies change
    return () => {
      clearTimeout(renderTimeout);
    };
  }, [isPreview, splitView, value, renderMermaidDiagrams]);
    // Effect to re-render mermaid diagrams when view mode changes
  useEffect(() => {
    // This additional effect ensures that mermaid diagrams are re-rendered properly on view mode change
    if (isPreview || splitView) {
      // Use a slightly delayed execution to allow DOM to update fully
      const timer1 = setTimeout(() => {
        renderMermaidDiagrams();
      }, 100);
      
      // Add a second delayed rendering for complex diagrams that might need extra time
      const timer2 = setTimeout(() => {
        renderMermaidDiagrams();
      }, 500);
      
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    }
  }, [isPreview, splitView, renderMermaidDiagrams]);

  // Handle keyboard selection
  const handleSelect = () => {
    if (!editorRef.current) return;
    
    const start = editorRef.current.selectionStart;
    const end = editorRef.current.selectionEnd;
    const text = value.substring(start, end);
    
    setSelectedText({ start, end, text });
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Tab key for indentation
    if (e.key === 'Tab') {
      e.preventDefault();
      
      const start = editorRef.current?.selectionStart || 0;
      const end = editorRef.current?.selectionEnd || 0;
      
      // Insert tab at cursor position or for selected text
      const newValue = value.substring(0, start) + '  ' + value.substring(end);
      onChange(newValue);
      
      // Set cursor position after the tab
      setTimeout(() => {
        if (editorRef.current) {
          editorRef.current.selectionStart = editorRef.current.selectionEnd = start + 2;
        }
      }, 0);
    }
    
    // Ctrl+B for bold
    if (e.key === 'b' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleBold();
    }
    
    // Ctrl+I for italic
    if (e.key === 'i' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleItalic();
    }
    
    // Ctrl+K for link
    if (e.key === 'k' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleLink();
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    insertText(emoji);
    setShowEmojiPicker(false);
  };
  
  // Toolbar action handlers
  const handleBold = () => formatText('**', '**');
  const handleItalic = () => formatText('*', '*');
  const handleStrikethrough = () => formatText('~~', '~~');
  const handleLink = () => formatText('[', '](https://)');
  const handleImage = () => formatText('![Alt text](', ')');
  const handleCode = () => formatText('`', '`');
  const handleCodeBlock = () => formatText('```\n', '\n```');
  const handleBlockquote = () => formatBeginningOfLine('> ');
  const handleHeading1 = () => formatBeginningOfLine('# ');
  const handleHeading2 = () => formatBeginningOfLine('## ');
  const handleHeading3 = () => formatBeginningOfLine('### ');
  const handleUnorderedList = () => formatBeginningOfLine('- ');
  const handleOrderedList = () => formatBeginningOfLine('1. ');
  const handleTaskList = () => formatBeginningOfLine('- [ ] ');
  const handleTable = () => insertTableTemplate();
  const handleHorizontalRule = () => insertText('\n---\n');
    const handleMermaidDiagram = () => {
    insertText('\n```mermaid\ngraph TD;\n    A[Start] -->|Process| B[Step 1];\n    A -->|Alternative| C[Step 2];\n    B --> D[End];\n    C --> D;\n```\n');
  };
  
  const handleMathBlock = () => {
    insertText('\n$$\nx = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}\n$$\n');
  };
  
  const handleInlineMath = () => formatText('$', '$');
    const handleEmoji = (e?: React.MouseEvent<HTMLButtonElement>) => {
    if (!e) return;
    
    // Toggle emoji picker
    if (showEmojiPicker) {
      setShowEmojiPicker(false);
      return;
    }
    
    // Position the emoji picker near the button
    const buttonRect = e.currentTarget.getBoundingClientRect();
    setEmojiPickerAnchor({
      top: buttonRect.bottom + window.scrollY + 5,
      left: buttonRect.left + window.scrollX
    });
    setShowEmojiPicker(true);
  };

  // Helper functions for text formatting
  const formatText = (prefix: string, suffix: string) => {
    if (!editorRef.current) return;
    
    const start = editorRef.current.selectionStart;
    const end = editorRef.current.selectionEnd;
    
    if (start === end) {
      // No selection - insert placeholder
      const newText = `${value.substring(0, start)}${prefix}text${suffix}${value.substring(end)}`;
      onChange(newText);
      
      // Place cursor between the markers
      setTimeout(() => {
        if (editorRef.current) {
          const newCursorPos = start + prefix.length;
          editorRef.current.selectionStart = newCursorPos;
          editorRef.current.selectionEnd = newCursorPos + 4; // 'text' length
          editorRef.current.focus();
        }
      }, 0);
    } else {
      // Wrap selection
      const newText = `${value.substring(0, start)}${prefix}${value.substring(start, end)}${suffix}${value.substring(end)}`;
      onChange(newText);
      
      // Keep the selection
      setTimeout(() => {
        if (editorRef.current) {
          editorRef.current.selectionStart = start + prefix.length;
          editorRef.current.selectionEnd = end + prefix.length;
          editorRef.current.focus();
        }
      }, 0);
    }
  };
  
  const formatBeginningOfLine = (prefix: string) => {
    if (!editorRef.current) return;
    
    const start = editorRef.current.selectionStart;
    const end = editorRef.current.selectionEnd;
    
    // Find beginning of line
    let lineStart = start;
    while (lineStart > 0 && value[lineStart - 1] !== '\n') {
      lineStart--;
    }
    
    // Check if line already has the prefix
    const hasPrefix = value.substring(lineStart, lineStart + prefix.length) === prefix;
    
    if (!hasPrefix) {
      // Add prefix at the beginning of the line
      const newText = `${value.substring(0, lineStart)}${prefix}${value.substring(lineStart)}`;
      onChange(newText);
      
      // Adjust selection
      const offset = prefix.length;
      setTimeout(() => {
        if (editorRef.current) {
          editorRef.current.selectionStart = start + offset;
          editorRef.current.selectionEnd = end + offset;
          editorRef.current.focus();
        }
      }, 0);
    } else {
      // Remove prefix (toggle)
      const newText = `${value.substring(0, lineStart)}${value.substring(lineStart + prefix.length)}`;
      onChange(newText);
      
      // Adjust selection
      const offset = -prefix.length;
      setTimeout(() => {
        if (editorRef.current) {
          editorRef.current.selectionStart = Math.max(lineStart, start + offset);
          editorRef.current.selectionEnd = Math.max(lineStart, end + offset);
          editorRef.current.focus();
        }
      }, 0);
    }
  };
  
  const insertText = (text: string) => {
    if (!editorRef.current) return;
    
    const start = editorRef.current.selectionStart;
    const end = editorRef.current.selectionEnd;
    
    const newText = `${value.substring(0, start)}${text}${value.substring(end)}`;
    onChange(newText);
    
    setTimeout(() => {
      if (editorRef.current) {
        editorRef.current.selectionStart = editorRef.current.selectionEnd = start + text.length;
        editorRef.current.focus();
      }
    }, 0);
  };
  
  const insertTableTemplate = () => {
    const tableTemplate = `
| Header 1 | Header 2 | Header 3 |
|----------|----------|----------|
| Cell 1   | Cell 2   | Cell 3   |
| Cell 4   | Cell 5   | Cell 6   |
`;
    insertText(tableTemplate);
  };

  // Custom component to render code blocks with syntax highlighting
  const CodeBlock = ({ className, children, ...props }: any) => {
    const match = /language-(\w+)/.exec(className || '');
    const language = match ? match[1] : '';
    const isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (language === 'mermaid') {
      const diagramId = `mermaid-diagram-${Math.floor(Math.random() * 100000)}-${Date.now()}`;
      const diagramContent = String(children).trim();
      
      // Return the code with a data attribute to help with rendering
      return (
        <pre data-mermaid-container="true">
          <code 
            className={className} 
            data-diagram-id={diagramId}
            {...props}
          >
            {children}
          </code>
        </pre>
      );
    }
    
    return language ? (
      <SyntaxHighlighter
        style={isDarkMode ? vscDarkPlus : vs}
        language={language}
        PreTag="div"
      >
        {String(children).replace(/\n$/, '')}
      </SyntaxHighlighter>
    ) : (
      <code className={className} {...props}>
        {children}
      </code>
    );
  };
  // Define toolbar buttons with icons and actions
  const toolbarButtons: ToolbarButton[] = [
    { icon: "B", label: "Bold (Ctrl+B)", action: handleBold, className: "font-bold" },
    { icon: "I", label: "Italic (Ctrl+I)", action: handleItalic, className: "italic" },
    { icon: "S", label: "Strikethrough", action: handleStrikethrough, className: "line-through" },
    { icon: "H1", label: "Heading 1", action: handleHeading1 },
    { icon: "H2", label: "Heading 2", action: handleHeading2 },
    { icon: "H3", label: "Heading 3", action: handleHeading3 },
    { icon: "—", label: "Horizontal Rule", action: handleHorizontalRule },
    { icon: "🔗", label: "Link (Ctrl+K)", action: handleLink },
    { icon: "📷", label: "Image", action: handleImage },
    { icon: "📎", label: "Upload File", action: onFileUpload || handleImage },
    { icon: "📋", label: "Table", action: handleTable },
    { icon: ">", label: "Quote", action: handleBlockquote },
    { icon: "•", label: "Bullet List", action: handleUnorderedList },
    { icon: "1.", label: "Numbered List", action: handleOrderedList },
    { icon: "☑", label: "Task List", action: handleTaskList },
    { icon: "</>", label: "Code", action: handleCode },
    { icon: "```", label: "Code Block", action: handleCodeBlock },
    { icon: "📊", label: "Mermaid Diagram", action: handleMermaidDiagram },
    { icon: "∑", label: "Math Block", action: handleMathBlock },
    { icon: "𝑥", label: "Inline Math", action: handleInlineMath },
    { icon: "😊", label: "Emoji Picker", action: handleEmoji },
  ];  // Method to safely change view mode without triggering form submission
  const changeViewMode = (mode: 'edit' | 'preview' | 'split', e?: React.MouseEvent<HTMLButtonElement>) => {
    // Prevent any form submission
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    // Clean up any existing diagrams before changing mode
    try {
      document.querySelectorAll('.mermaid[data-processed="true"]').forEach(element => {
        element.removeAttribute('data-processed');
      });
    } catch (e) {
      // Ignore errors here
    }
    
    // Set the appropriate view mode
    if (mode === 'edit') {
      setIsPreview(false);
      setSplitView(false);
    } else if (mode === 'preview') {
      setIsPreview(true);
      setSplitView(false);
    } else if (mode === 'split') {
      setIsPreview(false);
      setSplitView(true);
    }
  };

  // Define view mode buttons
  const viewModeButtons: ToolbarButton[] = [
    { 
      icon: "Edit", 
      label: "Edit Mode", 
      action: (e) => changeViewMode('edit', e),
      className: !isPreview && !splitView ? "bg-blue-500 dark:bg-blue-700 text-white font-medium" : "bg-white dark:bg-gray-700"
    },
    { 
      icon: "Preview", 
      label: "Preview Mode", 
      action: (e) => changeViewMode('preview', e),
      className: isPreview && !splitView ? "bg-blue-500 dark:bg-blue-700 text-white font-medium" : "bg-white dark:bg-gray-700"
    },
    { 
      icon: "Split", 
      label: "Split View", 
      action: (e) => changeViewMode('split', e),
      className: splitView ? "bg-blue-500 dark:bg-blue-700 text-white font-medium" : "bg-white dark:bg-gray-700"
    }
  ];
  return (
    <div className="border border-gray-300 dark:border-gray-600 rounded-md overflow-hidden relative">
      {/* Emoji Picker */}      {showEmojiPicker && emojiPickerAnchor && (
        <div style={{ 
          position: 'fixed', 
          top: Math.min(emojiPickerAnchor.top, window.innerHeight - 350), 
          left: Math.min(emojiPickerAnchor.left, window.innerWidth - 280), 
          zIndex: 9999 
        }}>
          <EmojiPicker 
            onSelect={handleEmojiSelect} 
            onClose={() => setShowEmojiPicker(false)} 
          />
        </div>
      )}
      
      {/* View Mode Selector */}      <div className="flex justify-between items-center bg-gray-50 dark:bg-gray-800 border-b border-gray-300 dark:border-gray-600 px-3 py-2">
        <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Editor Mode:</div>
        <div className="inline-flex rounded-md shadow-sm" role="group">
          {viewModeButtons.map((btn, idx) => (            <button
              key={`view-${idx}`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                btn.action(e);
              }}
              className={`editor-view-button px-3 py-1.5 text-xs border border-gray-300 dark:border-gray-600 ${
                idx === 0 ? 'rounded-l-md' : idx === viewModeButtons.length - 1 ? 'rounded-r-md' : ''
              } ${btn.className} hover:bg-gray-200 dark:hover:bg-gray-700`}
              type="button" /* Explicitly set type to button */
              title={btn.label}
            >
              {btn.icon}
            </button>
          ))}
        </div>
      </div>
      
      {/* Editor Toolbar - only show in edit or split mode */}
      {(!isPreview || splitView) && (
        <div className="flex flex-wrap gap-1 p-1 bg-gray-50 dark:bg-gray-800 border-b border-gray-300 dark:border-gray-600">
          {toolbarButtons.map((btn, idx) => (            <button
              key={`tool-${idx}`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                btn.action(e);
              }}
              type="button"
              className={`toolbar-button p-1.5 min-w-8 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors ${btn.className || ''}`}
              title={btn.label}
            >
              {btn.icon}
            </button>
          ))}
        </div>
      )}
        {/* Editor and Preview Area */}
      <div className={`flex ${splitView ? 'flex-row' : 'flex-col'} flex-grow`} style={{ height: height, minHeight: '400px' }}>
        {/* Hide editor if in preview-only mode */}
        {(!isPreview || splitView) && (
          <div className={`${splitView ? 'w-1/2 border-r border-gray-300 dark:border-gray-600' : 'w-full'} flex flex-col`}>
            <textarea
              ref={editorRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onSelect={handleSelect}
              onKeyDown={handleKeyDown}
              onScroll={handleEditorScroll}
              placeholder={placeholder}
              className="w-full h-full p-3 resize-none focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-800 dark:text-white flex-grow"
              style={{ minHeight: splitView ? height : '400px' }}
            />
          </div>
        )}
          {/* Show preview if in preview-only or split mode */}        {(isPreview || splitView) && (
          <div 
            ref={previewRef}
            className={`${splitView ? 'w-1/2' : 'w-full'} overflow-auto p-4 prose dark:prose-invert max-w-none flex-grow markdown-preview`}
            style={{ minHeight: '400px', maxHeight: '100%' }}
            key={`preview-${isPreview ? "preview" : "split"}-${Date.now()}-${value.length}`} // Force re-render on view change and content change
          >
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code: CodeBlock,
                // Handle tables, blockquotes, and other elements with better styling
                table: ({ children }) => <table className="border-collapse border border-gray-300 dark:border-gray-700 my-4 w-full">{children}</table>,
                tr: ({ children }) => <tr className="border-b border-gray-300 dark:border-gray-700">{children}</tr>,
                th: ({ children }) => <th className="border border-gray-300 dark:border-gray-700 px-4 py-2 bg-gray-100 dark:bg-gray-800">{children}</th>,
                td: ({ children }) => <td className="border border-gray-300 dark:border-gray-700 px-4 py-2">{children}</td>,
                blockquote: ({ children }) => <blockquote className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 italic my-4">{children}</blockquote>,
                img: (props) => <img {...props} className="max-w-full rounded my-4" alt={props.alt || "Image"} />
              }}
            >
              {processedMarkdown}
            </ReactMarkdown>
            
            {!value && (
              <div className="text-gray-400 dark:text-gray-500 italic">
                Nothing to preview
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Character and word count */}
      <div className="flex justify-between border-t border-gray-300 dark:border-gray-600 p-2 bg-gray-50 dark:bg-gray-800 text-xs text-gray-500 dark:text-gray-400">
        <span>
          {value.length} characters
        </span>
        <span>
          {value.split(/\s+/).filter(Boolean).length} words
        </span>
      </div>
    </div>
  );
};

export default MarkdownEditor;