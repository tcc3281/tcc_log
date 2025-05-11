'use client';
import React, { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../lib/api';
import { useRouter } from 'next/navigation';

const NewTopicPage = () => {
  const { user } = useAuth();
  const [topicName, setTopicName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    try {
      // Remove the params object with user_id, as the API identifies the user from the token
      await api.post('/topics', { 
        topic_name: topicName, 
        description 
      });
      router.push('/topics');
    } catch (err) {
      console.error('Error creating topic:', err);
      setError('Failed to create topic. Please try again.');
    }
  };

  return (
    <main className="container mx-auto max-w-md mt-10">
      <h1 className="text-2xl font-bold mb-4">Create Topic</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
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
        <button type="submit" className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600">
          Create
        </button>
      </form>
    </main>
  );
};

export default NewTopicPage;