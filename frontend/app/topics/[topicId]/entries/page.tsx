'use client';
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import api from '../../../../lib/api';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

interface Entry {
  entry_id: number;
  title: string;
  entry_date: string;
  is_public: boolean;
  content?: string;
  topic_id: number;
}

const EntriesPage = () => {
  const { user } = useAuth();
  const params = useParams();
  const router = useRouter();
  const topicId = params?.topicId;
  const [entries, setEntries] = useState<Entry[]>([]);
  const [topicName, setTopicName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !topicId) return;
    
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log(`Attempting to fetch topic with ID: ${topicId}`);
        
        // Fetch topic name
        let topicData;
        try {
          const topicRes = await api.get(`/topics/${topicId}`);
          topicData = topicRes.data;
          console.log('Topic data retrieved successfully:', topicData);
          setTopicName(topicData.topic_name);
        } catch (topicErr: any) {
          console.error(`Error fetching topic details: ${topicErr.message}`, topicErr.response?.data);
          // Continue with entries fetch even if topic fetch fails
        }
        
        // Thử 3 cách khác nhau để lấy entries theo topic_id
        try {
          console.log(`Fetching entries for topic ID: ${topicId}`);
          
          // Cách 1: Sử dụng endpoint trực tiếp với topic_id trong đường dẫn
          let entriesData;
          try {
            // Thử gọi API với đường dẫn trực tiếp
            const directRes = await api.get(`/topics/${topicId}/entries`);
            console.log('Direct API response:', directRes.data);
            entriesData = directRes.data;
          } catch (directErr) {
            console.log('Direct API call failed, trying with query params');
            
            // Cách 2: Sử dụng endpoint entries với query param
            const paramsRes = await api.get(`/entries`, {
              params: { topic_id: Number(topicId) }
            });
            console.log('Params API response:', paramsRes.data);
            entriesData = paramsRes.data;
            
            // Cách 3: Nếu backend không lọc đúng, lọc thủ công ở frontend
            if (Array.isArray(entriesData) && entriesData.some(entry => !entry.topic_id)) {
              console.log('Filtering entries manually on frontend');
              entriesData = entriesData.filter(entry => 
                entry.topic_id === Number(topicId)
              );
            }
          }
          
          // Đảm bảo entries thuộc về topic hiện tại
          if (Array.isArray(entriesData)) {
            const filteredEntries = entriesData.filter(entry => {
              // Nếu entry có topic_id, kiểm tra nó có khớp với topicId hiện tại
              if (entry.topic_id !== undefined) {
                return entry.topic_id === Number(topicId);
              }
              return true; // Nếu không có topic_id, giữ lại (backend đã lọc)
            });
            
            console.log(`Found ${filteredEntries.length} entries for topic ID ${topicId}`);
            setEntries(filteredEntries);
          } else {
            console.error('Entries data is not an array:', entriesData);
            setEntries([]);
          }
        } catch (entriesErr: any) {
          console.error(`Error fetching entries: ${entriesErr.message}`);
          if (entriesErr.response) {
            console.error('Error response:', entriesErr.response.status, entriesErr.response.data);
            setError(`Failed to load entries: ${entriesErr.response?.data?.detail || entriesErr.message}`);
          } else {
            setError(`Failed to load entries: ${entriesErr.message}`);
          }
          throw entriesErr; // Re-throw so we can set loading to false in finally
        }
      } catch (err: any) {
        console.error('Error in fetchData:', err);
        if (!error) { // Only set error if not already set
          setError('Failed to load entries. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [user, topicId]);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <div className="card p-8 max-w-md w-full text-center">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Sign In Required</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">Please log in to view entries.</p>
          <Link href="/login" className="btn btn-primary inline-block">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }
  
  if (!topicId) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="card p-6 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
          <h2 className="text-red-600 dark:text-red-400 text-lg font-medium mb-2">Invalid Topic</h2>
          <p>No topic ID was provided or the topic ID is invalid.</p>
          <button 
            onClick={() => router.push('/topics')} 
            className="mt-4 btn btn-primary"
          >
            Back to Topics
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="animate-pulse h-8 w-36 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="animate-pulse h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="p-4">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-3 w-3/4"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-4"></div>
                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mt-4"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="card p-6 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
          <h2 className="text-red-600 dark:text-red-400 text-lg font-medium mb-2">Error Loading Entries</h2>
          <p>{error}</p>
          <div className="mt-4 flex gap-3">
            <button 
              onClick={() => router.push('/topics')} 
              className="btn btn-secondary"
            >
              Back to Topics
            </button>
            <button 
              onClick={() => window.location.reload()} 
              className="btn btn-primary"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
        <button
          onClick={() => router.push(`/topics`)}
          className="mr-4 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          Back to Topics
        </button>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{topicName || 'Entries'}</h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            {entries.length} {entries.length === 1 ? 'entry' : 'entries'} found
          </p>
        </div>
        <Link 
          href={`/topics/${topicId}/entries/new`}
          className="btn btn-primary flex items-center justify-center gap-2 sm:justify-start"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Create New Entry
        </Link>
      </div>
      
      {entries.length === 0 ? (
        <div className="card p-8 text-center">
          <div className="flex flex-col items-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-300 dark:text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <p className="text-gray-500 dark:text-gray-400 text-lg mb-6">
              No entries found for this topic.
            </p>
            <Link 
              href={`/topics/${topicId}/entries/new`}
              className="btn btn-primary"
            >
              Create Your First Entry
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {entries.map((entry) => {
            // Format date for display
            const formattedDate = new Date(entry.entry_date).toLocaleDateString('en-US', {
              year: 'numeric', 
              month: 'short', 
              day: 'numeric'
            });
            
            return (
              <div key={entry.entry_id} className="card hover:shadow-lg transition-shadow">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{entry.title}</h2>
                    {entry.is_public && (
                      <span className="text-xs px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 rounded-full">
                        Public
                      </span>
                    )}
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 mb-4 text-sm">{formattedDate}</p>
                  
                  <Link 
                    href={`/topics/${topicId}/entries/${entry.entry_id}`}
                    className="flex items-center text-blue-600 dark:text-blue-400 hover:underline font-medium mt-2"
                  >
                    View Details
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default EntriesPage; 