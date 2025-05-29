'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import AIStatus from '../../components/AI/AIStatus';
import PromptGenerator from '../../components/AI/PromptGenerator';
import { getAvailableModels, checkAIStatus } from '../../lib/ai-utils';
import api from '../../lib/api';

interface Topic {
  topic_id: number;
  topic_name: string;
  description?: string;
}

interface Entry {
  entry_id: number;
  title: string;
  entry_date: string;
  content?: string;
}

const AIPage: React.FC = () => {
  const { user } = useAuth();
  const router = useRouter();
  
  const [topics, setTopics] = useState<Topic[]>([]);
  const [recentEntries, setRecentEntries] = useState<Entry[]>([]);
  const [models, setModels] = useState<string[]>([]);
  
  const [topicLoading, setTopicLoading] = useState(true);
  const [entryLoading, setEntryLoading] = useState(true);
  const [modelsLoading, setModelsLoading] = useState(true);
  
  const [error, setError] = useState<string | null>(null);

  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  // Fetch topics
  useEffect(() => {
    if (!user) return;

    const fetchTopics = async () => {
      try {
        const res = await api.get('/topics');
        setTopics(res.data);
      } catch (err) {
        console.error('Error fetching topics:', err);
      } finally {
        setTopicLoading(false);
      }
    };

    fetchTopics();
  }, [user]);

  // Fetch recent entries
  useEffect(() => {
    if (!user) return;

    const fetchRecentEntries = async () => {
      try {
        // Get the first topic to show entries from
        if (topics.length > 0) {
          const res = await api.get(`/topics/${topics[0].topic_id}/entries`);
          // Get up to 5 most recent entries
          const entries = res.data.slice(0, 5);
          setRecentEntries(entries);
        }
      } catch (err) {
        console.error('Error fetching entries:', err);
      } finally {
        setEntryLoading(false);
      }
    };

    if (topics.length > 0) {
      fetchRecentEntries();
    }
  }, [user, topics]);

  // Fetch available models
  useEffect(() => {
    if (!user) return;

    const fetchModels = async () => {
      try {
        const modelList = await getAvailableModels();
        setModels(modelList);
      } catch (err) {
        console.error('Error fetching models:', err);
      } finally {
        setModelsLoading(false);
      }
    };

    fetchModels();
  }, [user]);

  // Handle prompt selection
  const handleSelectPrompt = (prompt: string) => {
    if (topics.length > 0) {
      // Create a new entry with the selected prompt as title
      router.push(`/topics/${topics[0].topic_id}/entries/new?title=${encodeURIComponent(prompt)}`);
    } else {
      setError('Bạn cần tạo một chủ đề trước khi có thể tạo bài nhật ký mới.');
    }
  };

  if (!user) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Tính năng AI</h1>
        <AIStatus />
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
            Gợi ý chủ đề viết nhật ký
          </h2>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              AI có thể gợi ý các chủ đề viết nhật ký giúp bạn có cảm hứng sáng tạo. Chọn một gợi ý để tạo bài viết mới.
            </p>
            <PromptGenerator onSelectPrompt={handleSelectPrompt} />
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
            Thông tin AI
          </h2>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Mô hình khả dụng:</h3>
            {modelsLoading ? (
              <div className="animate-pulse h-8 bg-gray-200 dark:bg-gray-700 rounded w-full mb-4"></div>
            ) : models.length > 0 ? (
              <ul className="list-disc list-inside mb-4 text-gray-600 dark:text-gray-300">
                {models.map((model, index) => (
                  <li key={index}>{model}</li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Không tìm thấy mô hình nào. Hãy đảm bảo LM Studio đang chạy và đã tải một mô hình.
              </p>
            )}

            <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Hướng dẫn:</h3>
            <ol className="list-decimal list-inside space-y-1 text-gray-600 dark:text-gray-300">
              <li>Tải và cài đặt <a href="https://lmstudio.ai/" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">LM Studio</a></li>
              <li>Tải một mô hình như Llama-3.1-8B-Instruct hoặc Qwen2.5-7B-Instruct</li>
              <li>Mở tab Developer và nhấn "Start Server"</li>
              <li>Làm mới trang này để sử dụng tính năng AI</li>
            </ol>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
          Nhật ký gần đây
        </h2>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          {entryLoading ? (
            <div className="p-6 space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                </div>
              ))}
            </div>
          ) : recentEntries.length > 0 ? (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {recentEntries.map((entry) => (
                <div key={entry.entry_id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                  <a
                    href={`/topics/${topics[0]?.topic_id}/entries/${entry.entry_id}`}
                    className="block"
                  >
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">
                      {entry.title}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(entry.entry_date).toLocaleDateString()}
                    </p>
                  </a>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center text-gray-500 dark:text-gray-400">
              <p>Không có bài nhật ký nào.</p>
              {topics.length > 0 && (
                <button 
                  onClick={() => router.push(`/topics/${topics[0].topic_id}/entries/new`)}
                  className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md shadow-sm transition-colors"
                >
                  Tạo bài nhật ký đầu tiên
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIPage;
