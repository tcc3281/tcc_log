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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !topicId) return;
    try {
      await api.post('/entries', {
        user_id: user.user_id,
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
    } catch (error) {
      console.error('Error creating entry:', error);
    }
  };

  return (
    <main className="container mx-auto mt-10">
      <h1 className="text-2xl font-bold mb-4">New Entry</h1>
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
          <button type="submit" className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600">
            Save Entry
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