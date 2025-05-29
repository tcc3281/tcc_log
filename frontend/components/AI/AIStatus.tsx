'use client';

import React, { useState, useEffect } from 'react';
import { checkAIStatus, AIStatusResponse } from '../../lib/ai-utils';

const AIStatus: React.FC = () => {
  const [status, setStatus] = useState<AIStatusResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const statusData = await checkAIStatus();
        setStatus(statusData);
      } catch (err: any) {
        setError('Unable to connect to AI service');
        console.error('Error checking AI status:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
  }, []);

  const getStatusColor = () => {
    if (!status) return 'bg-gray-300 dark:bg-gray-600';
    switch (status.status) {
      case 'available':
        return 'bg-green-500';
      case 'error':
        return 'bg-yellow-500';
      case 'unavailable':
        return 'bg-red-500';
      default:
        return 'bg-gray-300 dark:bg-gray-600';
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <div className={`w-3 h-3 rounded-full ${getStatusColor()}`}></div>
      <span className="text-sm text-gray-600 dark:text-gray-400">
        {loading ? 'Checking AI status...' : 
         error ? 'AI unavailable' : 
         status?.status === 'available' ? 'AI operational' : 'AI unavailable'}
      </span>
    </div>
  );
};

export default AIStatus;
