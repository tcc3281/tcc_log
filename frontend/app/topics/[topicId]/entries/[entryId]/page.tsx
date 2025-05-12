'use client';
import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '../../../../../context/AuthContext';
import api from '../../../../../lib/api';

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
  const entryId = params?.entryId || null;
  const router = useRouter();

  const [entry, setEntry] = useState<Entry | null>(null);
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

  useEffect(() => {
    const fetchEntry = async () => {
      if (!user || !topicId || !entryId) return;
      try {
        setLoading(true);
        const response = await api.get(`/entries/${entryId}`);
        const data = response.data;
        setEntry(data);
        setTitle(data.title);
        setContent(data.content || '');
        setEntryDate(data.entry_date);
        setLocation(data.location || '');
        setMood(data.mood || '');
        setWeather(data.weather || '');
        setIsPublic(data.is_public);
        setError(null);
      } catch (err) {
        console.error('Error fetching entry:', err);
        setError('Failed to load entry details. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchEntry();
  }, [user, topicId, entryId]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !topicId || !entryId) return;
    
    try {
      setIsSubmitting(true);
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
  };

  if (!user) return <p>Please log in to view entries</p>;
  if (loading) return <p>Loading entry details...</p>;
  if (error) return <p className="text-red-500">{error}</p>;
  if (!entry) return <p>Entry not found</p>;

  return (
    <main className="container mx-auto mt-10">
      <button
        onClick={() => router.back()}
        className="mb-4 bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300"
      >
        Back
      </button>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {isEditing ? (
        <form onSubmit={handleUpdate} className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="border p-2"
            required
          />
          <textarea
            placeholder="Content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="border p-2 h-40"
          />
          <input
            type="date"
            value={entryDate}
            onChange={(e) => setEntryDate(e.target.value)}
            className="border p-2"
            required
          />
          <input
            type="text"
            placeholder="Location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="border p-2"
          />
          <input
            type="text"
            placeholder="Mood"
            value={mood}
            onChange={(e) => setMood(e.target.value)}
            className="border p-2"
          />
          <input
            type="text"
            placeholder="Weather"
            value={weather}
            onChange={(e) => setWeather(e.target.value)}
            className="border p-2"
          />
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
            />
            Public
          </label>
          <div className="flex gap-2">
            <button
              type="submit"
              className={`${isSubmitting ? 'bg-blue-300' : 'bg-blue-500 hover:bg-blue-600'} text-white px-4 py-2 rounded`}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300"
              disabled={isSubmitting}
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div>
          <h1 className="text-2xl font-bold">{entry.title}</h1>
          <p className="my-4 whitespace-pre-wrap">{entry.content}</p>
          <div className="grid grid-cols-2 gap-2 mt-4 text-sm text-gray-600">
            <p><span className="font-semibold">Date:</span> {entry.entry_date}</p>
            <p><span className="font-semibold">Location:</span> {entry.location || 'Not specified'}</p>
            <p><span className="font-semibold">Mood:</span> {entry.mood || 'Not specified'}</p>
            <p><span className="font-semibold">Weather:</span> {entry.weather || 'Not specified'}</p>
            <p><span className="font-semibold">Public:</span> {entry.is_public ? 'Yes' : 'No'}</p>
          </div>
          <div className="mt-6 flex gap-2">
            <button
              onClick={() => setIsEditing(true)}
              className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
            >
              Edit
            </button>
            <button
              onClick={handleDelete}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      )}
    </main>
  );
};

export default EntryDetailPage;
