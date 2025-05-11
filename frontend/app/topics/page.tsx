'use client';
import React, { useEffect, useState } from 'react';
import { useAuth, User } from '../../context/AuthContext';
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

  useEffect(() => {
    if (!user) return;
    const fetchTopics = async () => {
      const res = await api.get('/topics', { params: { user_id: user.user_id } });
      setTopics(res.data);
    };
    fetchTopics();
  }, [user]);

  if (!user) return <p>Loading...</p>;

  return (
    <main className="container mx-auto mt-10">
      <h1 className="text-2xl font-bold mb-4">Topics</h1>
      <Link href="/topics/new" className="bg-green-500 text-white p-2 rounded">
        Create New Topic
      </Link>
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
    </main>
  );
};

export default TopicsPage; 