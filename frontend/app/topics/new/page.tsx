'use client';
import React, { useState } from 'react';
import { useAuth, User } from '../../../context/AuthContext';
import api from '../../../lib/api';
import { useRouter } from 'next/navigation';

const NewTopicPage = () => {
  const { user } = useAuth();
  const [topicName, setTopicName] = useState('');
  const [description, setDescription] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    await api.post('/topics', { topic_name: topicName, description }, { params: { user_id: user.user_id } });
    router.push('/topics');
  };

  return (
    <main className="container mx-auto max-w-md mt-10">
      <h1 className="text-2xl font-bold mb-4">Create Topic</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="text"
          placeholder="Topic Name"
          value={topicName}
          onChange={(e) => setTopicName(e.target.value)}
          className="border p-2"
          required
        />
        <textarea
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="border p-2"
        />
        <button type="submit" className="bg-blue-500 text-white p-2 rounded">
          Create
        </button>
      </form>
    </main>
  );
};

export default NewTopicPage; 