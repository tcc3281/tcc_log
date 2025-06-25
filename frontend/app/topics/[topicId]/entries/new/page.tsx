'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../../../../context/AuthContext';
import api, { uploadFile } from '../../../../../lib/api';
<<<<<<< HEAD
import { useRouter, useParams, useSearchParams } from 'next/navigation';
=======
import { useRouter, useParams } from 'next/navigation';
>>>>>>> 00b0240d4273d4346006ba2961f144846d8474c3
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import MarkdownEditor from '../../../../../components/MarkdownEditor';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, vs } from 'react-syntax-highlighter/dist/esm/styles/prism';
import Link from 'next/link';
<<<<<<< HEAD
import PromptGenerator from '../../../../../components/AI/PromptGenerator';
import WritingImprover from '../../../../../components/AI/WritingImprover';
=======
>>>>>>> 00b0240d4273d4346006ba2961f144846d8474c3

const NewEntryPage = () => {
  const { user } = useAuth();
  const params = useParams();
  const topicId = params?.topicId;
  const router = useRouter();
  const [topicName, setTopicName] = useState('');

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [entryDate, setEntryDate] = useState(() => {
    // Set current date as default
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [location, setLocation] = useState('');
  const [mood, setMood] = useState('');
  const [weather, setWeather] = useState('');
  const [isPublic, setIsPublic] = useState(false);  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user || !topicId) return;

    const fetchTopicName = async () => {
      try {
        const response = await api.get(`/topics/${topicId}`);
        setTopicName(response.data.topic_name);
      } catch (err) {
        console.error('Error fetching topic:', err);
        setError('Failed to load topic information.');
      } finally {
        setFetchLoading(false);
      }
    };

    fetchTopicName();
  }, [user, topicId]);

  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // New states for file upload functionality
  const [currentEntryId, setCurrentEntryId] = useState<number | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchParams = useSearchParams();
  
  useEffect(() => {
    if (!user || !topicId) return;

<<<<<<< HEAD
    const fetchTopicName = async () => {
      try {
        const response = await api.get(`/topics/${topicId}`);
        setTopicName(response.data.topic_name);
        
        // Check for title parameter in URL
        const titleParam = searchParams?.get('title');
        if (titleParam) {
          setTitle(decodeURIComponent(titleParam));
        }
      } catch (err) {
        console.error('Error fetching topic:', err);
        setError('Failed to load topic information.');
      } finally {
        setFetchLoading(false);
      }
    };

    fetchTopicName();
  }, [user, topicId, searchParams]);

  // Cleanup draft entry when navigating away
  useEffect(() => {
    const handleBeforeUnload = async () => {
      if (currentEntryId && (!title.trim() || title === 'Untitled Entry') && !content.trim()) {
        // Delete draft entry if it's empty
        try {
          await api.delete(`/entries/${currentEntryId}`);
        } catch (err) {
          console.error('Error cleaning up draft entry:', err);
        }
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        handleBeforeUnload();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [currentEntryId, title, content]);

  // Function to delete draft entry
  const deleteDraftEntry = async () => {
    if (currentEntryId) {
      try {
        await api.delete(`/entries/${currentEntryId}`);
        setCurrentEntryId(null);
      } catch (err) {
        console.error('Error deleting draft entry:', err);
      }
    }
  };

  // Handle cancel - delete draft if it's empty
  const handleCancel = async () => {
    if (currentEntryId && (!title.trim() || title === 'Untitled Entry') && !content.trim()) {
      await deleteDraftEntry();
    }
    router.push(`/topics/${topicId}/entries`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !topicId) return;

    try {
      setSaving(true);
      
      const entryData = {
        topic_id: topicId,
        title,
        content,
        entry_date: entryDate,
        location: location || null,
        mood: mood || null, 
        weather: weather || null,
        is_public: isPublic
      };

      let response;
      if (currentEntryId) {
        // Update existing draft entry
        response = await api.put(`/entries/${currentEntryId}`, entryData);      } else {
        // Create new entry
        response = await api.post(`/entries/`, entryData);
      }
      
      // Redirect to the new entry
      router.push(`/topics/${topicId}/entries/${response.data.entry_id}`);
    } catch (err) {
      console.error('Error creating entry:', err);
      setError('Failed to create entry. Please try again.');
      setSaving(false);
    }
  };

  // Create a draft entry to enable file uploads
  const createDraftEntry = async () => {
    if (!user || !topicId || currentEntryId) return;

    try {
      const draftData = {
        topic_id: topicId,
        title: title || 'Untitled Entry',
        content: content || '',
        entry_date: entryDate,
        location: location || null,
        mood: mood || null, 
        weather: weather || null,
        is_public: false // Always start as private for drafts
      };

      const response = await api.post(`/entries/`, draftData);
      setCurrentEntryId(response.data.entry_id);
      return response.data.entry_id;
    } catch (err) {
      console.error('Error creating draft entry:', err);
      setError('Failed to create draft entry for file upload.');
      return null;
    }
  };

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    try {
      setUploadingFile(true);
      setError(null);

      // Create draft entry if it doesn't exist
      let entryId = currentEntryId;
      if (!entryId) {
        entryId = await createDraftEntry();
        if (!entryId) return; // Failed to create draft
      }

      // Upload each file and add to content
      let newContent = content;
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const markdownLink = await uploadFile(file, entryId);
        
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

=======
    try {
      setSaving(true);
      
      const entryData = {
        topic_id: topicId,
        title,
        content,
        entry_date: entryDate,
        location: location || null,
        mood: mood || null, 
        weather: weather || null,
        is_public: isPublic
      };

      const response = await api.post(`/entries`, entryData);
      
      // Redirect to the new entry
      router.push(`/topics/${topicId}/entries/${response.data.entry_id}`);
    } catch (err) {
      console.error('Error creating entry:', err);
      setError('Failed to create entry. Please try again.');
      setSaving(false);
    }
  };

>>>>>>> 00b0240d4273d4346006ba2961f144846d8474c3
  if (fetchLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse flex space-x-4 mb-6">
          <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-4 w-36 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
        <div className="animate-pulse h-8 w-64 bg-gray-200 dark:bg-gray-700 rounded mb-6"></div>
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
<<<<<<< HEAD
    <div className="container mx-auto px-4 py-8 max-w-4xl">      <div className="mb-6">
=======
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
>>>>>>> 00b0240d4273d4346006ba2961f144846d8474c3
        <Link 
          href={`/topics/${topicId}/entries`} 
          className="flex items-center text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 mb-4"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          Back to {topicName || 'Topic'} Entries
        </Link>
        
        <div className="flex items-center mb-6">
          <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30 mr-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create New Entry in {topicName}</h1>
        </div>
<<<<<<< HEAD
        
        {/* AI Prompt Generator */}
        <div className="mb-6">
          <PromptGenerator onSelectPrompt={(prompt) => {
            setTitle(prompt);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }} />
        </div>
=======
>>>>>>> 00b0240d4273d4346006ba2961f144846d8474c3
      </div>
      
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg mb-6 flex items-start">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}

<<<<<<< HEAD
      {currentEntryId && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400 px-4 py-3 rounded-lg mb-6 flex items-start">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          Draft saved - You can now upload files and images using the 📎 button in the editor.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
            {/* Hidden file input element */}
          <input 
            id="new-entry-file-upload"
            type="file" 
            ref={fileInputRef}
            onChange={handleFileUpload}
            multiple
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
            className="hidden"
            aria-label="Upload files to new entry"
          />
          
=======
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
>>>>>>> 00b0240d4273d4346006ba2961f144846d8474c3
          <div className="mb-4">
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              id="title"
              type="text"
              placeholder="Give your entry a title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              required
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div>
              <label htmlFor="entryDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Date <span className="text-red-500">*</span>
              </label>
              <input
                id="entryDate"
                type="date"
                value={entryDate}
                onChange={(e) => setEntryDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                required
              />
            </div>
            
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Location <span className="text-gray-500 font-normal">(optional)</span>
              </label>
              <input
                id="location"
                type="text"
                placeholder="Where were you?"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
              <div>
              <label htmlFor="weather" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Weather <span className="text-gray-500 font-normal">(optional)</span>
              </label>
              <input
                id="weather"
                type="text"
                placeholder="What was the weather like?"
                value={weather}
                onChange={(e) => setWeather(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
              <div>
              <label htmlFor="mood" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Mood <span className="text-gray-500 font-normal">(optional)</span>
              </label>
              <input
                id="mood"
                type="text"
                placeholder="How were you feeling?"
                value={mood}
                onChange={(e) => setMood(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
          
          <div className="mb-4">
            <div className="flex justify-between items-center mb-1">
              <label htmlFor="content" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Content <span className="text-gray-500 font-normal">(supports Markdown)</span>
              </label>
              <div className="flex items-center">
                <button
                  type="button"
                  onClick={() => setPreviewMode(!previewMode)}
                  className={`text-xs px-3 py-1 rounded-lg ${
                    !previewMode 
                      ? 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300' 
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                  }`}
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewMode(!previewMode)}
                  className={`text-xs px-3 py-1 rounded-lg ml-2 ${
                    previewMode 
                      ? 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300' 
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                  }`}
                >
                  Preview
                </button>
              </div>
            </div>

<<<<<<< HEAD
            {/* AI Writing Assistant */}
            <details className="mb-4 bg-white dark:bg-gray-750 rounded-lg border border-gray-200 dark:border-gray-700">
              <summary className="flex items-center px-4 py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <div className="p-1 mr-2 rounded-full bg-blue-100 dark:bg-blue-900/30">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <span className="font-medium text-gray-900 dark:text-gray-100">AI Writing Assistant</span>
              </summary>
              <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Use AI to improve your writing with grammar corrections, style enhancements, and vocabulary suggestions.
                </p>
                <WritingImprover 
                  initialText={content}
                  onImprovedText={(improvedText) => {
                    setContent(improvedText);
                  }}
                />
              </div>
            </details>

=======
>>>>>>> 00b0240d4273d4346006ba2961f144846d8474c3
            {previewMode ? (
              <div className="min-h-[300px] border border-gray-300 dark:border-gray-600 rounded-lg p-4 prose prose-blue dark:prose-invert max-w-none bg-white dark:bg-gray-700">
                {content ? (
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 italic">Preview your content here...</p>
                )}
              </div>
            ) : (              <MarkdownEditor
                value={content}
                onChange={setContent}
<<<<<<< HEAD
                onFileUpload={() => fileInputRef.current?.click()}
=======
>>>>>>> 00b0240d4273d4346006ba2961f144846d8474c3
              />
            )}
          </div>
          
<<<<<<< HEAD
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
          
=======
>>>>>>> 00b0240d4273d4346006ba2961f144846d8474c3
          <div className="flex items-center mb-4">
            <input
              id="isPublic"
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
            />
            <label htmlFor="isPublic" className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              Make this entry public
            </label>
          </div>
        </div>
        
        <div className="flex justify-between items-center">
<<<<<<< HEAD
          <button
            type="button"
            onClick={handleCancel}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            disabled={saving || uploadingFile}
          >
            Cancel
          </button>
          
          <button
            type="submit"
            disabled={saving || uploadingFile || !title || !entryDate}
=======
          <Link 
            href={`/topics/${topicId}/entries`}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </Link>
          
          <button
            type="submit"
            disabled={saving || !title || !entryDate}
>>>>>>> 00b0240d4273d4346006ba2961f144846d8474c3
            className="px-8 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {saving ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </>
<<<<<<< HEAD
            ) : uploadingFile ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Uploading...
              </>
=======
>>>>>>> 00b0240d4273d4346006ba2961f144846d8474c3
            ) : (
              'Save Entry'
            )}
          </button>
        </div>
      </form>
      
      <div className="mt-8 bg-blue-50 dark:bg-blue-900/10 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
        <h3 className="text-lg font-medium text-blue-800 dark:text-blue-300 mb-2">Tips for journaling</h3>
        <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
          <li className="flex items-start">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Include specific details about your experience to make entries more meaningful
          </li>
          <li className="flex items-start">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Use Markdown for formatting: **bold**, *italic*, - lists, # headings
          </li>
          <li className="flex items-start">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Adding metadata like location, mood, and weather helps with filtering later
          </li>
        </ul>
      </div>
    </div>
  );
};

export default NewEntryPage;