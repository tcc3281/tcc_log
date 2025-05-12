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

  useEffect(() => {
    if (!user) return;
    
    const fetchTopics = async () => {
      try {
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
        description: updatedDescription
      });

      // Cập nhật danh sách topics
      setTopics(prevTopics => 
        prevTopics.map(t => 
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
      
      // Cập nhật danh sách topics
      setTopics(prevTopics => prevTopics.filter(t => t.topic_id !== topicToDelete));
      
      closeDeleteModal();
    } catch (err) {
      console.error('Error deleting topic:', err);
      alert('Failed to delete topic. Please try again.');
    }
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <div className="card p-8 max-w-md w-full text-center">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Sign In Required</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">Please log in to view your topics.</p>
          <Link href="/login" className="btn btn-primary inline-block">
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
          <div className="animate-pulse h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="animate-pulse h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="p-4">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-3 w-3/4"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-4"></div>
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
          <h2 className="text-red-600 dark:text-red-400 text-lg font-medium mb-2">Error Loading Topics</h2>
          <p>{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 btn btn-primary"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Topics</h1>
        <Link 
          href="/topics/new" 
          className="btn btn-primary flex items-center justify-center gap-2 sm:justify-start"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Create New Topic
        </Link>
      </div>
      
      {topics.length === 0 ? (
        <div className="card p-8 text-center">
          <div className="flex flex-col items-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-300 dark:text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <p className="text-gray-500 dark:text-gray-400 text-lg mb-6">
              You haven't created any topics yet.
            </p>
            <Link 
              href="/topics/new" 
              className="btn btn-primary"
            >
              Create Your First Topic
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {topics.map((topic) => (
            <div key={topic.topic_id} className="card hover:shadow-lg transition-shadow">
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">{topic.topic_name}</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                  {topic.description || 'No description provided.'}
                </p>
                
                <div className="flex justify-between items-center mt-4">
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
                      className="p-1.5 text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
                      title="Edit Topic"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => openDeleteModal(topic.topic_id)}
                      className="p-1.5 text-gray-600 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
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
      
      {/* Modal chỉnh sửa topic */}
      {isEditing && editingTopic && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Edit Topic</h3>
              <form onSubmit={handleUpdateTopic}>
                <div className="mb-4">
                  <label htmlFor="topicName" className="form-label">Topic Name</label>
                  <input
                    id="topicName"
                    type="text"
                    value={updatedTopicName}
                    onChange={(e) => setUpdatedTopicName(e.target.value)}
                    className="form-input"
                    required
                  />
                </div>
                <div className="mb-6">
                  <label htmlFor="description" className="form-label">Description</label>
                  <textarea
                    id="description"
                    value={updatedDescription}
                    onChange={(e) => setUpdatedDescription(e.target.value)}
                    className="form-input"
                    rows={4}
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <button 
                    type="button" 
                    onClick={closeEditModal}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal xác nhận xóa */}
      {isDeleting && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Confirm Delete</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Are you sure you want to delete this topic? This will delete all entries associated with this topic. This action cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <button 
                  onClick={closeDeleteModal}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleDeleteTopic}
                  className="btn btn-danger"
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