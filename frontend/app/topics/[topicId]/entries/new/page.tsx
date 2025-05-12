'use client';
import React, { useState } from 'react';
import { useAuth } from '../../../../../context/AuthContext';
import api from '../../../../../lib/api';
import { useRouter, useParams } from 'next/navigation';

const NewEntryPage = () => {
  const { user } = useAuth();
  const params = useParams();
  const topicId = params.topicId;
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [entryDate, setEntryDate] = useState('');
  const [location, setLocation] = useState('');
  const [mood, setMood] = useState('');
  const [weather, setWeather] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      
      // The API endpoint needs topic_id but not user_id (it comes from auth token)
      const response = await api.post('/entries', {
        topic_id: Number(topicId),
        title,
        content,
        entry_date: entryDate,
        location,
        mood,
        weather,
        is_public: isPublic,
      });
      
      router.push(`/topics/${topicId}/entries`);
    } catch (err) {
      console.error('Error creating entry:', err);
      setError('Failed to create entry. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return <p>Please log in to create entries</p>;

  return (
    <main className="container mx-auto mt-10">
      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="mb-4 bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300"
      >
        Back
      </button>

      <h1 className="text-2xl font-bold mb-4">New Entry</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="flex gap-8">
        {/* Left Pane */}
        <div className="w-1/3 flex flex-col gap-4 border-r pr-4">
          <input
            type="text"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="border p-2"
            required
          />
          <input
            type="date"
            value={entryDate}
            onChange={(e) => setEntryDate(e.target.value)}
            className="border p-2"
            required
          />
          <div>
            <label className="block mb-2">Location</label>
            <input
              type="text"
              placeholder="Enter or select location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="border p-2 w-full"
            />
          </div>
          <div>
            <label className="block mb-2">Mood</label>
            <input
              type="text"
              placeholder="Enter or select mood"
              value={mood}
              onChange={(e) => setMood(e.target.value)}
              className="border p-2 w-full"
            />
          </div>
          <div>
            <label className="block mb-2">Weather</label>
            <input
              type="text"
              placeholder="Enter or select weather"
              value={weather}
              onChange={(e) => setWeather(e.target.value)}
              className="border p-2 w-full"
            />
          </div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
            />
            Public
          </label>
          <button 
            type="submit" 
            className={`${loading ? 'bg-blue-300' : 'bg-blue-500 hover:bg-blue-600'} text-white p-2 rounded`}
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save Entry'}
          </button>
        </div>

        {/* Right Pane */}
        <div className="w-2/3">
          <textarea
            placeholder="Write your content here..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="border p-2 w-full h-[400px]"
          />
        </div>
      </form>
    </main>
  );
};

export default NewEntryPage;