'use client';
import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '../../../../../context/AuthContext';
import api, { uploadFile } from '../../../../../lib/api';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import MarkdownEditor from '../../../../../components/MarkdownEditor';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, vs } from 'react-syntax-highlighter/dist/esm/styles/prism';
import mermaid from 'mermaid';
import 'katex/dist/katex.min.css';
import EntryAnalysis from '../../../../../components/AI/EntryAnalysis';

// Initialize mermaid
if (typeof window !== 'undefined') {
  mermaid.initialize({
    startOnLoad: true,
    theme: 'default',
    securityLevel: 'loose',
  });
}

// Define Entry interface
interface Entry {
  entry_id: number;
  title: string;
  content: string | null;
  entry_date: string;
  location: string | null;
  mood: string | null;
  weather: string | null;
  is_public: boolean;
  user_id: number;
  topic_id: number;
  created_at: string;
  updated_at: string;
}

const EntryDetailPage = () => {
  const { user } = useAuth();
  const params = useParams();
  const topicId = params?.topicId;
  const entryId = params?.entryId;
  const router = useRouter();

  const [entry, setEntry] = useState<Entry | null>(null);
  const [topicName, setTopicName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [entryDate, setEntryDate] = useState('');
  const [location, setLocation] = useState('');
  const [mood, setMood] = useState('');
  const [weather, setWeather] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  useEffect(() => {
    const fetchData = async () => {
      if (!user || !topicId || !entryId) {
        if (!user) {
          console.error('User not authenticated, redirecting to login');
          router.push('/login');
        }
        return;
      }
      try {
        setLoading(true);
        console.log(`Fetching entry with ID: ${entryId} for topic: ${topicId}`);
        
        // Fetch topic name
        let topicData;
        try {
          const topicRes = await api.get(`/topics/${topicId}`);
          topicData = topicRes.data;
          console.log('Topic data retrieved successfully:', topicData);
          setTopicName(topicData.topic_name);
        } catch (topicErr: any) {
          console.error(`Error fetching topic details: ${topicErr.message}`, topicErr.response?.data);
          // Continue with entry fetch even if topic fetch fails
        }
        
        // Fetch entry using multiple strategies if needed
        let entryData;
        try {
          // Primary approach: fetch through standard endpoint
          const entryRes = await api.get(`/entries/${entryId}`);
          entryData = entryRes.data;
          console.log('Entry data retrieved successfully:', entryData);
          
          // Verify that entry belongs to the correct topic
          if (entryData.topic_id !== undefined && 
              entryData.topic_id !== null && 
              Number(entryData.topic_id) !== Number(topicId)) {
            console.warn(`Entry belongs to topic ${entryData.topic_id}, not ${topicId}`);
            // Try to get entry through topic-specific endpoint as fallback
            const topicEntryRes = await api.get(`/topics/${topicId}/entries/${entryId}`);
            entryData = topicEntryRes.data;
          }
        } catch (entryErr: any) {
          console.error(`Error in primary entry fetch: ${entryErr.message}`);
          
          // Alternative approach: Get all entries for topic and filter
          try {
            const topicEntriesRes = await api.get(`/topics/${topicId}/entries`);
            const entries = topicEntriesRes.data;
            entryData = entries.find((e: any) => Number(e.entry_id) === Number(entryId));
            
            if (!entryData) {
              throw new Error('Entry not found in topic entries');
            }
          } catch (altErr) {
            console.error('Alternative entry fetch also failed:', altErr);
            throw entryErr; // Re-throw original error
          }
        }
        
        if (!entryData) {
          throw new Error('Entry data not found');
        }
        
        setEntry(entryData);
        setTitle(entryData.title);
        setContent(entryData.content || '');
        setEntryDate(entryData.entry_date);
        setLocation(entryData.location || '');
        setMood(entryData.mood || '');
        setWeather(entryData.weather || '');
        setIsPublic(entryData.is_public);
        setError(null);
      } catch (err: any) {
        console.error('Error fetching entry details:', err);
        setError(err.response?.data?.detail || 'Failed to load entry details. Please try again.');
        setEntry(null);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user, topicId, entryId]);

  // Effect to render mermaid diagrams when viewing an entry
  useEffect(() => {
    if (!isEditing && entry?.content) {
      // Use setTimeout to ensure the DOM is fully rendered
      setTimeout(() => {
        try {
          mermaid.init(undefined, document.querySelectorAll('.mermaid'));
        } catch (error) {
          console.error('Error rendering mermaid diagrams:', error);
        }
      }, 100);
    }
  }, [isEditing, entry?.content]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !topicId || !entryId) return;
    
    try {
      setIsSubmitting(true);
      setError(null);
      
      await api.put(`/entries/${entryId}`, {
        title,
        content,
        entry_date: entryDate,
        location,
        mood,
        weather,
        is_public: isPublic,
      });
      
      // Fetch the updated entry
      const response = await api.get(`/entries/${entryId}`);
      setEntry(response.data);
      setIsEditing(false);
    } catch (err) {
      console.error('Error updating entry:', err);
      setError('Failed to update entry. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!user || !topicId || !entryId) return;
    
    if (!confirm('Are you sure you want to delete this entry? This action cannot be undone.')) {
      return;
    }
    
    try {
      setIsSubmitting(true);
      await api.delete(`/entries/${entryId}`);
      router.push(`/topics/${topicId}/entries`);
    } catch (err) {
      console.error('Error deleting entry:', err);
      setError('Failed to delete entry. Please try again.');
      setIsSubmitting(false);
    }
  };  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0 || !entryId) return;
    
    try {
      setUploadingFile(true);
      setError(null);
      
      // Upload each file and add to content
      let newContent = content;
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const markdownLink = await uploadFile(file, Number(entryId));
        
        // Add markdown link to the content (at the end)
        newContent = newContent + "\n" + markdownLink + "\n";
      }
      
      setContent(newContent);
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      console.error('Error uploading file:', err);
      setError('Failed to upload file. Please try again.');
    } finally {
      setUploadingFile(false);
    }
  };
  // Simple wrapper for the file upload button
  const markdownButtons = [
    { label: '📎', 
      tooltip: 'Upload File/Image', 
      onClick: () => fileInputRef.current?.click() 
    },
  ];

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <div className="card p-8 max-w-md w-full text-center">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Sign In Required</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">Please log in to view entries.</p>
          <button onClick={() => router.push('/login')} className="btn btn-primary inline-block">
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6 max-w-4xl mx-auto">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-8"></div>
          <div className="h-36 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="card p-6 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 max-w-4xl mx-auto">
          <h2 className="text-red-600 dark:text-red-400 text-lg font-medium mb-2">Error Loading Entry</h2>
          <p>{error}</p>
          <div className="mt-4 flex gap-3">
            <button onClick={() => router.push(`/topics/${topicId}/entries`)} className="btn btn-secondary">
              Back to Entries
            </button>
            <button onClick={() => window.location.reload()} className="btn btn-primary">
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="card p-6 text-center max-w-4xl mx-auto">
          <h2 className="text-xl font-semibold mb-4">Entry Not Found</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">The entry you're looking for doesn't exist or has been removed.</p>
          <button onClick={() => router.push(`/topics/${topicId}/entries`)} className="btn btn-primary">
            Back to Entries
          </button>
        </div>
      </div>
    );
  }

  // Format date for display
  const formattedDate = new Date(entry.entry_date).toLocaleDateString('en-US', {
    year: 'numeric', 
    month: 'long', 
    day: 'numeric'
  });

  // Phần UI hiển thị nội dung chỉnh sửa và xem trước
  const renderEditForm = () => (
    <div className="card p-6">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Edit Entry</h2>
      
      {/* Hidden file input element */}
      <input 
        type="file" 
        ref={fileInputRef}
        onChange={handleFileUpload}
        multiple
        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
        className="hidden"
      />
      
      <form onSubmit={handleUpdate} className="space-y-6">
        <div>
          <label htmlFor="title" className="form-label">Title</label>
          <input
            id="title"
            type="text"
            placeholder="Entry Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="form-input"
            required
          />
        </div>
        
        <div>          <label htmlFor="content" className="form-label">Content</label>
              <div style={{minHeight: "70vh"}} className="flex flex-col">
            <MarkdownEditor 
              value={content}
              onChange={(value) => setContent(value)}
              height="100%"
              placeholder="Write your entry here... (Supports Markdown, MathJax, Mermaid diagrams, and more)"
              onFileUpload={() => fileInputRef.current?.click()}
            />
          </div>
          
          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 space-y-1">
            <p className="font-medium">Markdown Cheat Sheet:</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1">
              <p><code>**bold**</code> - <strong>bold text</strong></p>
              <p><code>*italic*</code> - <em>italic text</em></p>
              <p><code># Heading</code> - headings</p>
              <p><code>[link](url)</code> - <span className="text-blue-600">link</span></p>
              <p><code>- item</code> - bullet list</p>
              <p><code>1. item</code> - numbered list</p>
              <p><code>![alt](img-url)</code> - image</p>
              <p><code>{`>`} quote</code> - blockquote</p>
              <p><code>`code`</code> - <code>inline code</code></p>
            </div>
            <p>Click <span className="font-semibold">📎</span> to upload files/images.</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="entryDate" className="form-label">Date</label>
            <input
              id="entryDate"
              type="date"
              value={entryDate}
              onChange={(e) => setEntryDate(e.target.value)}
              className="form-input"
              required
            />
          </div>
          
          <div>
            <label htmlFor="location" className="form-label">Location</label>
            <input
              id="location"
              type="text"
              placeholder="Where were you?"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="form-input"
            />
          </div>
          
          <div>
            <label htmlFor="mood" className="form-label">Mood</label>
            <input
              id="mood"
              type="text"
              placeholder="How were you feeling?"
              value={mood}
              onChange={(e) => setMood(e.target.value)}
              className="form-input"
            />
          </div>
          
          <div>
            <label htmlFor="weather" className="form-label">Weather</label>
            <input
              id="weather"
              type="text"
              placeholder="What was the weather like?"
              value={weather}
              onChange={(e) => setWeather(e.target.value)}
              className="form-input"
            />
          </div>
        </div>
        
        <div className="flex items-center">
          <input
            id="isPublic"
            type="checkbox"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
            className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
          />
          <label htmlFor="isPublic" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
            Make this entry public
          </label>
        </div>
        
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => setIsEditing(false)}
            className="btn btn-secondary"
            disabled={isSubmitting || uploadingFile}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting || uploadingFile}
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </span>
            ) : uploadingFile ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Uploading...
              </span>
            ) : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
  
  // Render content with ReactMarkdown
  const renderEntryContent = () => (
    <div className="card p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{entry?.title}</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            {topicName && (
              <span>In <span className="font-medium">{topicName}</span> • </span>
            )}
            {formattedDate}
            {entry?.is_public && (
              <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                Public
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setIsEditing(true)}
            className="btn btn-secondary flex items-center gap-1 text-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
            </svg>
            Edit
          </button>
          <button
            onClick={handleDelete}
            className="btn btn-danger flex items-center gap-1 text-sm"
            disabled={isSubmitting}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {isSubmitting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
        <div className="prose dark:prose-invert max-w-none mb-8">
        {entry?.content ? (          <div>
            <ReactMarkdown 
              remarkPlugins={[remarkGfm]} 
              components={{
                code: ({className, children, ...props}) => {
                  const match = /language-(\w+)/.exec(className || '')
                  const language = match ? match[1] : ''
                  const isDarkMode = typeof window !== 'undefined' && 
                    window.matchMedia && 
                    window.matchMedia('(prefers-color-scheme: dark)').matches;
                  
                  // Handle mermaid diagrams
                  if (language === 'mermaid') {
                    return <div className="mermaid">{String(children).replace(/\n$/, '')}</div>
                  }
                  
                  // Regular code blocks with syntax highlighting
                  return match ? (
                    <SyntaxHighlighter
                      style={isDarkMode ? vscDarkPlus : vs}
                      language={language}
                      PreTag="div"
                      {...props}
                    >
                      {String(children).replace(/\n$/, '')}
                    </SyntaxHighlighter>
                  ) : (
                    <code className={className} {...props}>
                      {children}
                    </code>
                  )
                }              }}
            >
              {entry.content}
            </ReactMarkdown>
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400 italic">No content provided.</p>
        )}      </div>
      
      {/* AI Analysis Component */}
      {entry && (
        <div className="mt-6 mb-6">
          <EntryAnalysis entryId={entry.entry_id} entryTitle={entry.title} />
        </div>
      )}
      
      <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mt-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Entry Details</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6 text-sm">
          <div>
            <span className="text-gray-500 dark:text-gray-400">Date:</span>{' '}
            <span className="text-gray-900 dark:text-white">{formattedDate}</span>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">Location:</span>{' '}
            <span className="text-gray-900 dark:text-white">{entry?.location || 'Not specified'}</span>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">Mood:</span>{' '}
            <span className="text-gray-900 dark:text-white">{entry?.mood || 'Not specified'}</span>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">Weather:</span>{' '}
            <span className="text-gray-900 dark:text-white">{entry?.weather || 'Not specified'}</span>
          </div>
          <div className="sm:col-span-2">
            <span className="text-gray-500 dark:text-gray-400">Created:</span>{' '}
            <span className="text-gray-900 dark:text-white">
              {entry && new Date(entry.created_at).toLocaleString()}
            </span>
            {entry && entry.updated_at !== entry.created_at && (
              <span className="ml-4 text-gray-500 dark:text-gray-400">
                (Updated: {new Date(entry.updated_at).toLocaleString()})
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
        <button
          onClick={() => router.push(`/topics/${topicId}/entries`)}
          className="mr-4 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          Back to Entries
        </button>
      </div>
      
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-md mb-6 text-sm max-w-4xl mx-auto">
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        </div>
      )}
      
      <div className="max-w-4xl mx-auto">
        {isEditing ? renderEditForm() : renderEntryContent()}
      </div>
    </div>
  );
};

export default EntryDetailPage;
