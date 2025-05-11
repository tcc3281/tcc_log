'use client';
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';
import Link from 'next/link';

interface Topic {
  topic_id: number;
  topic_name: string;
  description?: string;
}

const TopicsPage = () => {
  const { user } = useAuth();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    
    const fetchTopics = async () => {
      try {
        // Remove the params object with user_id
        const res = await api.get('/topics');
        setTopics(res.data);
      } catch (err) {
        console.error('Error fetching topics:', err);
        setError('Failed to load topics');
      } finally {
        setLoading(false);
      }
    };
    
    fetchTopics();
  }, [user]);

  if (!user) return <p className="text-center p-4">Please log in to view topics.</p>;
  if (loading) return <p className="text-center p-4">Loading...</p>;
  if (error) return <p className="text-center p-4 text-red-500">{error}</p>;

  return (
    <main className="container mx-auto mt-10">
      <h1 className="text-2xl font-bold mb-4">Topics</h1>
      <Link href="/topics/new" className="bg-green-500 text-white p-2 rounded hover:bg-green-600">
        Create New Topic
      </Link>
      
      {topics.length === 0 ? (
        <p className="mt-4 text-gray-500 text-center py-8">
          You haven't created any topics yet. Click "Create New Topic" to get started.
        </p>
      ) : (
        <ul className="mt-4 flex flex-col gap-2">
          {topics.map((topic) => (
            <li key={topic.topic_id} className="border p-4 flex justify-between">
              <div>
                <h2 className="text-lg font-semibold">{topic.topic_name}</h2>
                <p>{topic.description}</p>
              </div>
              <Link href={`/topics/${topic.topic_id}/entries`} className="text-blue-500">
                View Entries
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
};

export default TopicsPage;