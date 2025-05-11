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

  useEffect(() => {
    if (!user || !topicId) return;
    const fetchEntries = async () => {
      const res = await api.get('/entries', {
        params: { user_id: user.user_id, topic_id: Number(topicId) },
      });
      setEntries(res.data);
    };
    fetchEntries();
  }, [user, topicId]);

  if (!user) return <p>Loading...</p>;

  return (
    <main className="container mx-auto mt-10">
      <h1 className="text-2xl font-bold mb-4">Entries</h1>
      <Link
        href={`/topics/${topicId}/entries/new`}
        className="bg-green-500 text-white p-2 rounded"
      >
        Create New Entry
      </Link>
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
    </main>
  );
};

export default EntriesPage; 