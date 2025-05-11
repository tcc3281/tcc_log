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
    await api.post(
      '/entries',
      { title, content, entry_date: entryDate, location, mood, weather, is_public: isPublic },
      { params: { user_id: user.user_id, topic_id: Number(topicId) } }
    );
    router.push(`/topics/${topicId}/entries`);
  };

  return (
    <main className="container mx-auto max-w-md mt-10">
      <h1 className="text-2xl font-bold mb-4">New Entry</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
          className="border p-2"
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
        <button type="submit" className="bg-blue-500 text-white p-2 rounded">
          Save Entry
        </button>
      </form>
    </main>
  );
};

export default NewEntryPage; 