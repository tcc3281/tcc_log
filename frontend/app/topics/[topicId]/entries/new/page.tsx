'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../../../../context/AuthContext';
import api, { uploadFile } from '../../../../../lib/api';
import { useRouter, useParams } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

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
  const [isPublic, setIsPublic] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPreview, setIsPreview] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [tempEntryId, setTempEntryId] = useState<number | null>(null);

  useEffect(() => {
    if (!user || !topicId) return;
    
    const fetchTopicName = async () => {
      try {
        setFetchLoading(true);
        const res = await api.get(`/topics/${topicId}`);
        setTopicName(res.data.topic_name);
      } catch (err) {
        console.error('Error fetching topic:', err);
      } finally {
        setFetchLoading(false);
      }
    };
    
    fetchTopicName();
  }, [user, topicId]);

  // Nếu chưa có entry, tạo một entry tạm thời để lưu file
  const ensureTempEntryExists = async () => {
    if (tempEntryId) return tempEntryId;
    
    try {
      // Tạo một entry tạm thời để đính kèm file
      const response = await api.post('/entries', {
        topic_id: Number(topicId),
        title: 'Temporary Entry for File Upload',
        content: '',
        entry_date: new Date().toISOString().split('T')[0],
        is_public: false
      });
      
      const newEntryId = response.data.entry_id;
      setTempEntryId(newEntryId);
      return newEntryId;
    } catch (error) {
      console.error('Error creating temporary entry:', error);
      setError('Failed to prepare for file upload. Please try again.');
      throw error;
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    try {
      setUploadingFile(true);
      setError(null);
      
      // Đảm bảo có entry_id để lưu file
      const entryId = await ensureTempEntryExists();
      
      // Upload từng file và thêm vào nội dung
      let newContent = content;
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const markdownLink = await uploadFile(file, entryId);
        
        // Thêm file vào cuối nội dung hoặc tại vị trí con trỏ
        if (textareaRef.current) {
          const cursorPos = textareaRef.current.selectionStart;
          newContent = 
            newContent.substring(0, cursorPos) + 
            "\n" + markdownLink + "\n" + 
            newContent.substring(cursorPos);
        } else {
          newContent = newContent + "\n" + markdownLink + "\n";
        }
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !topicId) return;
    
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    
    if (!entryDate) {
      setError('Date is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Đảm bảo topic_id được đúng định dạng và có giá trị
      const numericTopicId = Number(topicId);
      
      console.log('Creating new entry with data:', {
        topic_id: numericTopicId,
        title,
        content: content.substring(0, 20) + '...',
        entry_date: entryDate,
      });
      
      // Nếu đã có entry tạm thời, cập nhật nó thay vì tạo mới
      if (tempEntryId) {
        await api.put(`/entries/${tempEntryId}`, {
          title,
          content,
          entry_date: entryDate,
          location,
          mood,
          weather,
          is_public: isPublic,
        });
        
        console.log('Updated temporary entry successfully, redirecting to entries list');
        router.push(`/topics/${topicId}/entries`);
        return;
      }
      
      // Nếu không có entry tạm thời, tạo entry mới
      try {
        // Cách 1: Tạo entry với endpoint trực tiếp
        await api.post(`/topics/${topicId}/entries`, {
          title,
          content,
          entry_date: entryDate,
          location,
          mood,
          weather,
          is_public: isPublic,
        });
      } catch (directErr) {
        console.log('Direct API creation failed, trying with standard endpoint');
        
        // Cách 2: Tạo entry với endpoint thông thường
        await api.post('/entries', {
          topic_id: numericTopicId,
          title,
          content,
          entry_date: entryDate,
          location,
          mood,
          weather,
          is_public: isPublic,
        });
      }
      
      console.log('Entry created successfully, redirecting to entries list');
      router.push(`/topics/${topicId}/entries`);
    } catch (err: any) {
      console.error('Error creating entry:', err);
      if (err.response) {
        setError(`Failed to create entry: ${err.response.data?.detail || 'Please try again.'}`);
      } else {
        setError('Failed to create entry. Please try again.');
      }
      setLoading(false);
    }
  };

  // Hàm hỗ trợ chèn định dạng Markdown vào vị trí con trỏ
  const insertMarkdown = (before: string, after: string = '') => {
    if (!textareaRef.current) return;
    
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    
    const newContent = 
      content.substring(0, start) + 
      before + 
      selectedText + 
      after + 
      content.substring(end);
    
    setContent(newContent);
    
    // Đặt lại con trỏ sau khi chèn
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + before.length,
        end + before.length
      );
    }, 0);
  };

  const markdownButtons = [
    { label: 'B', tooltip: 'Bold', onClick: () => insertMarkdown('**', '**') },
    { label: 'I', tooltip: 'Italic', onClick: () => insertMarkdown('*', '*') },
    { label: 'H2', tooltip: 'Heading', onClick: () => insertMarkdown('## ') },
    { label: 'H3', tooltip: 'Subheading', onClick: () => insertMarkdown('### ') },
    { label: '―', tooltip: 'Horizontal Rule', onClick: () => insertMarkdown('\n---\n') },
    { label: '✓', tooltip: 'Checklist', onClick: () => insertMarkdown('- [ ] ') },
    { label: '•', tooltip: 'Bullet List', onClick: () => insertMarkdown('- ') },
    { label: '1.', tooltip: 'Numbered List', onClick: () => insertMarkdown('1. ') },
    { label: '🔗', tooltip: 'Link', onClick: () => insertMarkdown('[', '](url)') },
    { label: '💬', tooltip: 'Blockquote', onClick: () => insertMarkdown('> ') },
    { label: '<>', tooltip: 'Code', onClick: () => insertMarkdown('`', '`') },
    { label: '```', tooltip: 'Code Block', onClick: () => insertMarkdown('```\n', '\n```') },
    { 
      label: '📎', 
      tooltip: 'Upload File/Image', 
      onClick: () => fileInputRef.current?.click() 
    },
  ];

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <div className="card p-8 max-w-md w-full text-center">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Sign In Required</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">Please log in to create entries.</p>
          <button onClick={() => router.push('/login')} className="btn btn-primary inline-block">
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (fetchLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="animate-pulse h-8 w-36 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-full max-w-lg"></div>
          <div className="h-60 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

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

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">New Entry</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Add a new entry to <span className="font-medium">{topicName}</span>
        </p>
      </div>
      
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-md mb-6 text-sm">
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        </div>
      )}
      
      {/* Hidden file input element */}
      <input 
        type="file" 
        ref={fileInputRef}
        onChange={handleFileUpload}
        multiple
        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
        className="hidden"
      />
      
      <form onSubmit={handleSubmit} className="card p-6">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-6">
          {/* Left Column - Metadata */}
          <div className="space-y-6">
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
          </div>
          
          {/* Right Column - Content */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="content" className="form-label">Content</label>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  className={`px-3 py-1 text-sm rounded ${!isPreview ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'}`}
                  onClick={() => setIsPreview(false)}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className={`px-3 py-1 text-sm rounded ${isPreview ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'}`}
                  onClick={() => setIsPreview(true)}
                >
                  Preview
                </button>
              </div>
            </div>
            
            {/* Markdown Toolbar */}
            {!isPreview && (
              <div className="flex flex-wrap gap-1 p-2 bg-gray-100 dark:bg-gray-800 rounded-t border border-gray-300 dark:border-gray-600 border-b-0">
                {markdownButtons.map((btn, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={btn.onClick}
                    title={btn.tooltip}
                    className="p-1.5 min-w-8 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                    disabled={uploadingFile && btn.tooltip === 'Upload File/Image'}
                  >
                    {uploadingFile && btn.tooltip === 'Upload File/Image' ? (
                      <span className="animate-pulse">⏳</span>
                    ) : (
                      btn.label
                    )}
                  </button>
                ))}
              </div>
            )}
            
            {isPreview ? (
              <div className="form-input min-h-[300px] overflow-auto prose dark:prose-invert">
                {content ? (
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {content}
                  </ReactMarkdown>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 italic">No content to preview</p>
                )}
              </div>
            ) : (              <textarea
                id="content"
                ref={textareaRef}
                placeholder="Write your entry here... (Supports Markdown)"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onKeyDown={(e) => {
                  // Bắt sự kiện Tab
                  if (e.key === 'Tab') {
                    e.preventDefault(); // Ngăn chặn hành vi mặc định (nhảy đến trường tiếp theo)
                    
                    const textarea = e.currentTarget;
                    const start = textarea.selectionStart;
                    const end = textarea.selectionEnd;
                    
                    // Chèn ký tự tab vào vị trí con trỏ
                    const newContent = 
                      content.substring(0, start) + 
                      '\t' + 
                      content.substring(end);
                    
                    setContent(newContent);
                    
                    // Đặt lại vị trí con trỏ sau khi chèn tab
                    setTimeout(() => {
                      textarea.selectionStart = textarea.selectionEnd = start + 1;
                    }, 0);
                  }
                }}
                className="form-input min-h-[300px] rounded-t-none"
                rows={12}
              />
            )}
            
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
        </div>
        
        <div className="mt-8 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => router.push(`/topics/${topicId}/entries`)}
            className="btn btn-secondary"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={loading || uploadingFile}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </span>
            ) : 'Save Entry'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default NewEntryPage;