'use client';
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import api from '../../../../lib/api';
import Link from 'next/link';
import { useParams } from 'next/navigation';

interface Entry {
  entry_id: number;
  title: string;
  entry_date: string;
  is_public: boolean;
}

const EntriesPage = () => {
  const { user } = useAuth();
  const params = useParams();
  const topicId = params.topicId;
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !topicId) return;
    
    const fetchEntries = async () => {
      try {
        setLoading(true);
        // The backend API doesn't expect user_id and topic_id as query params
        // It gets user_id from the authentication token
        const res = await api.get(`/entries`, {
          params: { topic_id: Number(topicId) }
        });
        setEntries(res.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching entries:', err);
        setError('Failed to load entries. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchEntries();
  }, [user, topicId]);

  if (!user) return <p>Please log in to view entries</p>;
  if (loading) return <p>Loading entries...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <main className="container mx-auto mt-10">
      <h1 className="text-2xl font-bold mb-4">Entries</h1>
      <Link
        href={`/topics/${topicId}/entries/new`}
        className="bg-green-500 text-white p-2 rounded"
      >
        Create New Entry
      </Link>
      {entries.length === 0 ? (
        <p className="mt-4">No entries found for this topic.</p>
      ) : (
        <ul className="mt-4 flex flex-col gap-2">
          {entries.map((entry) => (
            <li
              key={entry.entry_id}
              className="border p-4 flex justify-between"
            >
              <div>
                <h2 className="text-lg font-semibold">{entry.title}</h2>
                <p>{entry.entry_date}</p>
              </div>
              <Link
                href={`/topics/${topicId}/entries/${entry.entry_id}`}
                className="text-blue-500"
              >
                View Details
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
};

export default EntriesPage; 