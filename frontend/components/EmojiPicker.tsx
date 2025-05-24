"use client";

import React, { useRef, useState, useEffect } from 'react';
import emojiUtils from '../lib/emoji-utils';

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

const EmojiPicker: React.FC<EmojiPickerProps> = ({ onSelect, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('frequently-used');
  const pickerRef = useRef<HTMLDivElement>(null);

  // Common emoji categories
  const categories = [
    { id: 'frequently-used', name: 'Frequently Used', icon: '⭐' },
    { id: 'smileys', name: 'Smileys & Emotion', icon: '😊' },
    { id: 'people', name: 'People & Body', icon: '👋' },
    { id: 'animals', name: 'Animals & Nature', icon: '🐶' },
    { id: 'food', name: 'Food & Drink', icon: '🍔' },
    { id: 'travel', name: 'Travel & Places', icon: '✈️' },
    { id: 'activities', name: 'Activities', icon: '⚽' },
    { id: 'objects', name: 'Objects', icon: '💡' },
    { id: 'symbols', name: 'Symbols', icon: '❤️' },
    { id: 'flags', name: 'Flags', icon: '🏳️' },
  ];

  // Frequently used emojis
  const frequentlyUsed = [
    '😊', '😂', '❤️', '👍', '👋', '👏', '🙌', '🤔',
    '👀', '🎉', '✅', '💯', '⭐', '🔥', '💪', '👉'
  ];

  // Emoji collections by category
  const emojisByCategory: Record<string, string[]> = {
    'frequently-used': frequentlyUsed,
    'smileys': ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇', '😍', '🥰', '😘'],
    'people': ['👋', '🤚', '🖐️', '✋', '👌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇'],
    'animals': ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔'],
    'food': ['🍏', '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝'],
    'travel': ['✈️', '🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐', '🚚', '🚛', '🚜', '🛴', '🚲'],
    'activities': ['⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🪀', '🏓', '🥊', '🥋', '🎣', '🥌'],
    'objects': ['⌚', '📱', '💻', '⌨️', '🖥️', '🖨️', '🖱️', '🖲️', '💽', '💾', '💿', '📀', '📼', '📷', '📸', '📹'],
    'symbols': ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖'],
    'flags': ['🏳️', '🏴', '🏁', '🚩', '🏳️‍🌈', '🏳️‍⚧️', '🇦🇫', '🇦🇱', '🇩🇿', '🇦🇸', '🇦🇩', '🇦🇴', '🇦🇮', '🇦🇶', '🇦🇬', '🇦🇷'],
  };

  // Handle click outside to close picker
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        onClose();
      }
    }

    // Bind the event listener
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      // Unbind the event listener on clean up
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  // Filter emojis based on search term
  const filteredEmojis = searchTerm.trim() 
    ? Object.values(emojisByCategory).flat().filter(emoji => 
        emojiUtils.getShortname(emoji).toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  return (
    <div 
      ref={pickerRef}
      className="emoji-picker absolute z-50 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-300 dark:border-gray-600 w-64 max-h-80"
    >
      <div className="p-2 border-b border-gray-300 dark:border-gray-600">
        <input 
          type="text"
          placeholder="Search emoji..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-1 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white text-sm"
        />
      </div>
      
      {searchTerm ? (
        <div className="emoji-search-results p-2 overflow-y-auto max-h-60">
          <h3 className="text-sm text-gray-500 dark:text-gray-400 mb-2">Search Results</h3>
          <div className="grid grid-cols-6 gap-1">
            {filteredEmojis.length > 0 ? filteredEmojis.map((emoji, index) => (
              <button 
                key={`search-emoji-${index}`}
                onClick={() => onSelect(emoji)}
                className="emoji-btn hover:bg-gray-100 dark:hover:bg-gray-700 p-1 rounded-sm text-xl"
                title={emojiUtils.getShortname(emoji)}
              >
                {emoji}
              </button>
            )) : <p className="text-sm text-gray-500 dark:text-gray-400 col-span-6">No emojis found</p>}
          </div>
        </div>
      ) : (
        <>
          <div className="emoji-categories flex overflow-x-auto p-1 border-b border-gray-300 dark:border-gray-600">
            {categories.map(category => (
              <button 
                key={category.id}
                className={`p-2 mr-1 text-lg rounded-md flex-shrink-0 ${activeCategory === category.id ? 'bg-gray-200 dark:bg-gray-700' : ''}`}
                onClick={() => setActiveCategory(category.id)}
                title={category.name}
              >
                {category.icon}
              </button>
            ))}
          </div>
          
          <div className="emoji-list p-2 overflow-y-auto max-h-48">
            <div className="grid grid-cols-6 gap-1">
              {(emojisByCategory[activeCategory] || []).map((emoji, index) => (
                <button 
                  key={`cat-emoji-${index}`}
                  onClick={() => onSelect(emoji)}
                  className="emoji-btn hover:bg-gray-100 dark:hover:bg-gray-700 p-1 rounded-sm text-xl"
                  title={emojiUtils.getShortname(emoji)}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default EmojiPicker;
