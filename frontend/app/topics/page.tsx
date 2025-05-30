'use client';
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

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
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [topicToDelete, setTopicToDelete] = useState<number | null>(null);
  const [updatedTopicName, setUpdatedTopicName] = useState('');
  const [updatedDescription, setUpdatedDescription] = useState('');
  const router = useRouter();
<<<<<<< HEAD
=======

>>>>>>> 00b0240d4273d4346006ba2961f144846d8474c3
  useEffect(() => {
    if (!user) return;

    const fetchTopics = async () => {
      try {
<<<<<<< HEAD
        console.log('Fetching topics with authentication...');
        // Make sure the token is included in the request header
        const token = localStorage.getItem('token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        
        // First try to access with authentication
        const res = await api.get('/topics', { headers });
=======
        const res = await api.get('/topics');
>>>>>>> 00b0240d4273d4346006ba2961f144846d8474c3
        setTopics(res.data);
        console.log('Topics fetched successfully:', res.data);
      } catch (err) {
        console.error('Error fetching topics:', err);
        
        // If authentication fails, try the public endpoint as a fallback
        try {
          console.log('Trying public topics endpoint as fallback...');
          const publicRes = await api.get('/topics/public');
          setTopics(publicRes.data);
          console.log('Public topics fetched successfully:', publicRes.data);
        } catch (fallbackErr) {
          console.error('Error fetching public topics:', fallbackErr);
          setError('Failed to load topics. Please try logging in again.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchTopics();
  }, [user]);

  const openEditModal = (topic: Topic) => {
    setEditingTopic(topic);
    setUpdatedTopicName(topic.topic_name);
    setUpdatedDescription(topic.description || '');
    setIsEditing(true);
  };

  const closeEditModal = () => {
    setIsEditing(false);
    setEditingTopic(null);
  };

  const openDeleteModal = (topicId: number) => {
    setTopicToDelete(topicId);
    setIsDeleting(true);
  };

  const closeDeleteModal = () => {
    setIsDeleting(false);
    setTopicToDelete(null);
  };

  const handleUpdateTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTopic) return;

    try {
      const response = await api.put(`/topics/${editingTopic.topic_id}`, {
        topic_name: updatedTopicName,
        description: updatedDescription,
      });

      setTopics((prevTopics) =>
        prevTopics.map((t) =>
          t.topic_id === editingTopic.topic_id
            ? { ...t, topic_name: updatedTopicName, description: updatedDescription }
            : t
        )
      );

      closeEditModal();
    } catch (err) {
      console.error('Error updating topic:', err);
      alert('Failed to update topic. Please try again.');
    }
  };

  const handleDeleteTopic = async () => {
    if (!topicToDelete) return;

    try {
      await api.delete(`/topics/${topicToDelete}`);

      setTopics((prevTopics) => prevTopics.filter((t) => t.topic_id !== topicToDelete));

      closeDeleteModal();
    } catch (err) {
      console.error('Error deleting topic:', err);
      alert('Failed to delete topic. Please try again.');
    }
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <div className="card p-8 max-w-md w-full text-center bg-white dark:bg-gray-800 shadow-lg rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-full mx-auto w-16 h-16 mb-4 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-500 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Sign In Required</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">Please log in to view and manage your topics.</p>
          <Link href="/login" className="btn btn-primary inline-block px-8 py-2.5 text-lg">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="animate-pulse h-10 w-40 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="animate-pulse h-12 w-40 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card animate-pulse bg-white dark:bg-gray-800 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <div className="animate-pulse h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 mr-3"></div>
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                </div>
                <div className="flex justify-between items-center mt-6">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                  <div className="flex space-x-2">
                    <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  </div>
                </div>
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
        <div className="card p-6 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 rounded-xl">
          <div className="flex items-center mb-4">
            <div className="p-2 rounded-full bg-red-100 dark:bg-red-900/30 mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-red-600 dark:text-red-400">Error Loading Topics</h2>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 btn btn-primary flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Topics</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Organize your journal entries by topics</p>
        </div>
        <Link
          href="/topics/new"
          className="btn btn-primary flex items-center justify-center gap-2 sm:justify-start px-6 py-2.5 shadow-md hover:shadow-lg transition-all"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Create New Topic
        </Link>
      </div>

      {topics.length === 0 ? (
        <div className="card p-10 text-center bg-white dark:bg-gray-800 shadow-md rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex flex-col items-center">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-full mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 text-blue-500 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">No Topics Yet</h2>
            <p className="text-gray-500 dark:text-gray-400 text-lg mb-8 max-w-md">
              Topics help you organize your journal entries. Create your first topic to get started.
            </p>
            <Link
              href="/topics/new"
              className="btn btn-primary px-8 py-3 text-lg shadow-md hover:shadow-lg transition-all"
            >
              Create Your First Topic
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">          {topics.map((topic) => (
            <div key={topic.topic_id} className="card topic-card hover:shadow-lg transition-all duration-300 bg-white dark:bg-gray-800 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700">
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30 mr-3 topic-icon-container">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">{topic.topic_name}</h2>
                </div>
                <div className="h-20 overflow-hidden mb-4">
                  <p className="text-gray-600 dark:text-gray-400 line-clamp-3">
                    {topic.description || 'No description provided.'}
                  </p>
                </div>

                <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                  <Link
                    href={`/topics/${topic.topic_id}/entries`}
                    className="flex items-center text-blue-600 dark:text-blue-400 hover:underline font-medium"
                  >
                    View Entries
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </Link>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => openEditModal(topic)}
                      className="p-2 rounded-full text-gray-600 hover:text-blue-600 hover:bg-blue-50 dark:text-gray-400 dark:hover:text-blue-400 dark:hover:bg-blue-900/20 transition-colors"
                      title="Edit Topic"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => openDeleteModal(topic.topic_id)}
                      className="p-2 rounded-full text-gray-600 hover:text-red-600 hover:bg-red-50 dark:text-gray-400 dark:hover:text-red-400 dark:hover:bg-red-900/20 transition-colors"
                      title="Delete Topic"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Topic Modal */}
      {isEditing && editingTopic && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Edit Topic</h3>
              <button
                onClick={closeEditModal}
                className="p-1 rounded-full text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleUpdateTopic} className="p-6">
              <div className="mb-4">
                <label htmlFor="topicName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Topic Name</label>
                <input
                  id="topicName"
                  type="text"
                  value={updatedTopicName}
                  onChange={(e) => setUpdatedTopicName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>
              <div className="mb-6">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <textarea
                  id="description"
                  value={updatedDescription}
                  onChange={(e) => setUpdatedDescription(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Tab') {
                      e.preventDefault();

                      const textarea = e.currentTarget;
                      const start = textarea.selectionStart;
                      const end = textarea.selectionEnd;

                      const newContent =
                        updatedDescription.substring(0, start) +
                        '\t' +
                        updatedDescription.substring(end);

                      setUpdatedDescription(newContent);

                      setTimeout(() => {
                        textarea.selectionStart = textarea.selectionEnd = start + 1;
                      }, 0);
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  rows={4}
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleting && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md border border-gray-200 dark:border-gray-700">
            <div className="flex items-center p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="p-2 rounded-full bg-red-100 dark:bg-red-900/20 mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Delete Topic</h3>
            </div>
            <div className="p-6">
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Are you sure you want to delete this topic? This action will permanently remove the topic and all its entries. This cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={closeDeleteModal}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteTopic}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TopicsPage;