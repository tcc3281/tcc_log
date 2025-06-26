'use client';
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import api from '../../../../lib/api';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import '../../../styles/topic-styles.css';
import '../../../styles/topic-styles.css';

interface Entry {
  entry_id: number;
  title: string;
  entry_date: string;
  is_public: boolean;
  content?: string;
  topic_id: number;
  location?: string;
  weather?: string;
  mood?: string;
}

// Define unique filter options
interface FilterOptions {
  locations: string[];
  weathers: string[];
  moods: string[];
}

interface Topic {
  topic_id: number;
  topic_name: string;
  description?: string;
}

/* This file has been updated with our enhanced implementation */
const EntriesPage = () => {
  const { user } = useAuth();
  const params = useParams();
  const router = useRouter();
  const topicId = params?.topicId;
  const [entries, setEntries] = useState<Entry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [topic, setTopic] = useState<Topic | null>(null);
  
  // Filter states
  const [filterTitle, setFilterTitle] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterLocation, setFilterLocation] = useState('');
  const [filterWeather, setFilterWeather] = useState('');
  const [filterMood, setFilterMood] = useState('');
  const [filterVisibility, setFilterVisibility] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    locations: [],
    weathers: [],
    moods: []
  });

  useEffect(() => {
    if (!user || !topicId) return;

    const fetchTopicAndEntries = async () => {
      setLoading(true);
      try {
        // Fetch the topic details
        const topicResponse = await api.get(`/topics/${topicId}`);
        setTopic(topicResponse.data);        // Fetch all entries for this topic
        const entriesResponse = await api.get(`/topics/${topicId}/entries`);
        // Log the API request for debugging
        console.log(`Fetching entries from: /topics/${topicId}/entries`);
        
        const entriesData = entriesResponse.data;
        setEntries(entriesData);
        setFilteredEntries(entriesData);

        // Extract unique filter options
        const locations = [...new Set(entriesData.map((entry: Entry) => entry.location).filter(Boolean))].map(String);
        const weathers = [...new Set(entriesData.map((entry: Entry) => entry.weather).filter(Boolean))].map(String);
        const moods = [...new Set(entriesData.map((entry: Entry) => entry.mood).filter(Boolean))].map(String);
        
        setFilterOptions({
          locations,
          weathers,
          moods
        });
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load entries. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchTopicAndEntries();
  }, [user, topicId]);

  // Apply filters whenever filter values change
  useEffect(() => {
    if (!entries.length) return;

    const filtered = entries.filter(entry => {
      // Filter by title
      if (filterTitle && !entry.title.toLowerCase().includes(filterTitle.toLowerCase())) {
        return false;
      }
      
      // Filter by date range
      if (filterStartDate && new Date(entry.entry_date) < new Date(filterStartDate)) {
        return false;
      }
      if (filterEndDate && new Date(entry.entry_date) > new Date(filterEndDate)) {
        return false;
      }
      
      // Filter by location
      if (filterLocation && entry.location !== filterLocation) {
        return false;
      }
      
      // Filter by weather
      if (filterWeather && entry.weather !== filterWeather) {
        return false;
      }
        // Filter by mood
      if (filterMood && entry.mood !== filterMood) {
        return false;
      }
      
      // Filter by visibility (public/private)
      if (filterVisibility) {
        if (filterVisibility === 'public' && !entry.is_public) {
          return false;
        }
        if (filterVisibility === 'private' && entry.is_public) {
          return false;
        }
      }
      
      return true;
    });
    
    setFilteredEntries(filtered);
  }, [entries, filterTitle, filterStartDate, filterEndDate, filterLocation, filterWeather, filterMood, filterVisibility]);
  const resetFilters = () => {
    setFilterTitle('');
    setFilterStartDate('');
    setFilterEndDate('');
    setFilterLocation('');
    setFilterWeather('');
    setFilterMood('');
    setFilterVisibility('');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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
          <p className="text-gray-600 dark:text-gray-400 mb-6">Please log in to view entries in this topic.</p>
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
        <div className="animate-pulse h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded mb-6"></div>
        <div className="flex items-center justify-between mb-6">
          <div className="animate-pulse h-10 w-60 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="animate-pulse h-10 w-40 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
        <div className="space-y-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card animate-pulse bg-white dark:bg-gray-800 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 p-6">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-6"></div>
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-4/6"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !topic) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="card p-6 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 rounded-xl">
          <div className="flex items-center mb-4">
            <div className="p-2 rounded-full bg-red-100 dark:bg-red-900/30 mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-red-600 dark:text-red-400">Error Loading Entries</h2>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error || 'Topic not found'}</p>
          <div className="flex gap-4">
            <button 
              onClick={() => window.location.reload()} 
              className="btn btn-primary flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Try Again
            </button>
            <Link href="/topics" className="btn btn-secondary">
              Back to Topics
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link 
          href="/topics" 
          className="flex items-center text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 mb-4"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          Back to Topics
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{topic.topic_name}</h1>
            {topic.description && (
              <p className="text-gray-600 dark:text-gray-400 text-lg">{topic.description}</p>
            )}
          </div>
          <Link 
            href={`/topics/${topicId}/entries/new`} 
            className="btn btn-primary flex items-center justify-center gap-2 sm:justify-start px-6 py-2.5 shadow-md hover:shadow-lg transition-all whitespace-nowrap"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            New Entry
          </Link>
        </div>
      </div>

      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input 
              type="text" 
              placeholder="Search entries by title..."
              value={filterTitle}
              onChange={(e) => setFilterTitle(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setShowFilters(!showFilters)}              className={`flex items-center gap-2 px-4 py-2 rounded-lg border filter-btn-active ${
                showFilters 
                  ? 'border-blue-500 text-blue-600 dark:border-blue-400 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20' 
                  : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Filters              {(filterStartDate || filterEndDate || filterLocation || filterWeather || filterMood || filterVisibility) && (
                <span className="bg-blue-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center badge-pulse">
                  {(filterStartDate ? 1 : 0) + 
                  (filterEndDate ? 1 : 0) + 
                  (filterLocation ? 1 : 0) + 
                  (filterWeather ? 1 : 0) + 
                  (filterMood ? 1 : 0) + 
                  (filterVisibility ? 1 : 0)}
                </span>
              )}
            </button>
            {(filterTitle || filterStartDate || filterEndDate || filterLocation || filterWeather || filterMood || filterVisibility) && (
              <button 
                onClick={resetFilters}
                className="flex items-center gap-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                title="Clear all filters"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Clear
              </button>
            )}
          </div>
        </div>
        
        {/* Advanced filters panel */}
        {showFilters && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-4 border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">              <div>
                <label htmlFor="filter-start-date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Date Range
                </label>
                <div className="flex gap-2 items-center">
                  <input 
                    id="filter-start-date"
                    type="date" 
                    value={filterStartDate}
                    onChange={(e) => setFilterStartDate(e.target.value)}
                    className="w-full px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    aria-label="Filter start date"
                  />
                  <span className="text-gray-500 dark:text-gray-400">to</span>
                  <input 
                    id="filter-end-date"
                    type="date" 
                    value={filterEndDate}
                    onChange={(e) => setFilterEndDate(e.target.value)}
                    className="w-full px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    aria-label="Filter end date"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="visibility" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Visibility
                </label>
                <select
                  id="visibility"
                  value={filterVisibility}
                  onChange={(e) => setFilterVisibility(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">All Entries</option>
                  <option value="public">Public Only</option>
                  <option value="private">Private Only</option>
                </select>
              </div>
              
              {filterOptions.locations.length > 0 && (
                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Location
                  </label>
                  <select
                    id="location"
                    value={filterLocation}
                    onChange={(e) => setFilterLocation(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">All Locations</option>
                    {filterOptions.locations.map((loc, index) => (
                      <option key={index} value={loc}>{loc}</option>
                    ))}
                  </select>
                </div>
              )}
              
              {filterOptions.weathers.length > 0 && (
                <div>
                  <label htmlFor="weather" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Weather
                  </label>
                  <select
                    id="weather"
                    value={filterWeather}
                    onChange={(e) => setFilterWeather(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">All Weather</option>
                    {filterOptions.weathers.map((weather, index) => (
                      <option key={index} value={weather}>{weather}</option>
                    ))}
                  </select>
                </div>
              )}
              
              {filterOptions.moods.length > 0 && (
                <div>
                  <label htmlFor="mood" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Mood
                  </label>
                  <select
                    id="mood"
                    value={filterMood}
                    onChange={(e) => setFilterMood(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">All Moods</option>
                    {filterOptions.moods.map((mood, index) => (
                      <option key={index} value={mood}>{mood}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      {filteredEntries.length === 0 ? (
        <div className="card p-8 text-center bg-white dark:bg-gray-800 shadow-md rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex flex-col items-center">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-full mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-blue-500 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
              {entries.length === 0 ? 'No Entries Yet' : 'No Matching Entries'}
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-lg mb-8 max-w-md">
              {entries.length === 0 
                ? `Start capturing your thoughts and ideas in this topic.` 
                : `Try adjusting your filters to find what you're looking for.`}
            </p>
            {entries.length === 0 ? (
              <Link 
                href={`/topics/${topicId}/entries/new`} 
                className="btn btn-primary px-8 py-3 text-lg shadow-md hover:shadow-lg transition-all"
              >
                Create Your First Entry
              </Link>
            ) : (
              <button 
                onClick={resetFilters}
                className="btn btn-primary px-8 py-3 text-lg shadow-md hover:shadow-lg transition-all"
              >
                Clear All Filters
              </button>
            )}
          </div>
        </div>
      ) : (
        <>
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Showing {filteredEntries.length} {filteredEntries.length === 1 ? 'entry' : 'entries'}
            {filteredEntries.length !== entries.length && ` (filtered from ${entries.length})`}
          </div>          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEntries.map((entry) => (
              <div 
                key={entry.entry_id} 
                className="card entry-item topic-card entry-card bg-white dark:bg-gray-800 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-300"
              ><div className="p-6">
                  <Link href={`/topics/${topicId}/entries/${entry.entry_id}`} className="block">
                    <div className="flex items-center mb-4">
                      <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30 mr-3 topic-icon-container">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        {entry.title}
                      </h2>
                    </div>                    <div className="h-20 overflow-hidden mb-4">
                      <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 dark:text-gray-400">                        <span className="flex items-center entry-metadata-tag">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {formatDate(entry.entry_date)}
                        </span>{entry.location && (
                        <span className="flex items-center entry-metadata-tag">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {entry.location}
                        </span>
                      )}                      {entry.weather && (
                        <span className="flex items-center entry-metadata-tag">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                          </svg>
                          {entry.weather}
                        </span>
                      )}                      {entry.mood && (
                        <span className="flex items-center entry-metadata-tag">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {entry.mood}
                        </span>
                      )}                      <span className="flex items-center ml-auto entry-metadata-tag">
                        <span className={`w-2 h-2 rounded-full mr-1 ${entry.is_public ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                        {entry.is_public ? 'Public' : 'Private'}
                      </span>
                      </div>
                    </div>
                  </Link>                  <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                    <Link 
                      href={`/topics/${topicId}/entries/${entry.entry_id}`} 
                      className="flex items-center text-blue-600 dark:text-blue-400 hover:underline font-medium"
                    >
                      Read Entry
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default EntriesPage;