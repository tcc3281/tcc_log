'use client';

import React, { useState, useEffect, useRef, KeyboardEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { getAvailableModels, sendChatMessageStream, ChatMessage, ChatStreamData } from '../../lib/ai-utils';
import { ChevronRightIcon, PaperAirplaneIcon, ExclamationCircleIcon } from '@heroicons/react/24/solid';
import ChatMessageDisplay from '../../components/AI/ChatMessageDisplay';

const AIPage: React.FC = () => {
  const { user } = useAuth();
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'system', content: 'Welcome to AI Assistant! How can I help you today?' }
  ]);
  const [input, setInput] = useState<string>('');
  const [models, setModels] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [streamingMessageId, setStreamingMessageId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  // Fetch available models
  useEffect(() => {
    if (!user) return;

    const fetchModels = async () => {
      try {
        const modelList = await getAvailableModels();
        setModels(modelList);
        if (modelList.length > 0) {
          setSelectedModel(modelList[0]);
        }
      } catch (err) {
        console.error('Error fetching models:', err);
      }
    };

    fetchModels();
  }, [user]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-resize textarea based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);
  const handleSendMessage = async () => {
    if (!input.trim()) return;
    
    // Add user message to chat
    const userMessage: ChatMessage = { role: 'user', content: input, timestamp: new Date() };
    setMessages(prevMessages => [...prevMessages, userMessage]);
    
    // Clear input
    setInput('');
    
    try {
      // Show AI is streaming
      setIsStreaming(true);
      setIsTyping(true);
      setError(null);
      
      // Create placeholder for AI response
      const aiMessageId = Date.now();
      setStreamingMessageId(aiMessageId);
      
      // Add initial empty AI message
      const initialAiMessage: ChatMessage = {
        role: 'assistant',
        content: '',
        think: '',
        timestamp: new Date()
      };
      
      setMessages(prevMessages => [...prevMessages, initialAiMessage]);
      
      // Filter out system welcome message for the API call
      const historyForApi = messages.filter(m => m.role !== 'system');
      
      let thinkingContent = '';
      let answerContent = '';
      
      // Stream the response
      await sendChatMessageStream(
        input,
        historyForApi,
        selectedModel,
        undefined,
        (streamData: ChatStreamData) => {
          if (streamData.type === 'thinking') {
            thinkingContent += streamData.content;
            // Update the streaming message with thinking content
            setMessages(prevMessages => {
              const newMessages = [...prevMessages];
              const lastMessage = newMessages[newMessages.length - 1];
              if (lastMessage.role === 'assistant') {
                lastMessage.think = thinkingContent;
              }
              return newMessages;
            });
          } else if (streamData.type === 'answer') {
            answerContent += streamData.content;
            // Update the streaming message with answer content
            setMessages(prevMessages => {
              const newMessages = [...prevMessages];
              const lastMessage = newMessages[newMessages.length - 1];
              if (lastMessage.role === 'assistant') {
                lastMessage.content = answerContent;
              }
              return newMessages;
            });
          } else if (streamData.type === 'done') {
            // Finalize the message
            setMessages(prevMessages => {
              const newMessages = [...prevMessages];
              const lastMessage = newMessages[newMessages.length - 1];
              if (lastMessage.role === 'assistant') {
                lastMessage.content = answerContent;
                lastMessage.think = thinkingContent;
                lastMessage.timestamp = new Date();
              }
              return newMessages;
            });
          } else if (streamData.type === 'error') {
            setError('Error in streaming response: ' + streamData.content);
          }
        }
      );
      
    } catch (err: any) {
      console.error('Error sending message:', err);
      setError(err.message || 'Failed to send message. Please try again.');
      
      // Remove the empty AI message on error
      setMessages(prevMessages => prevMessages.slice(0, -1));
    } finally {
      setIsStreaming(false);
      setIsTyping(false);
      setStreamingMessageId(null);
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Format timestamp
  const formatTimestamp = (timestamp?: Date) => {
    if (!timestamp) return '';
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(timestamp);
  };

  if (!user) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="container mx-auto px-4 py-8 h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">AI Chat</h1>
        
        {/* Model selection */}
        <div className="flex items-center space-x-4">
          {models.length > 0 && (
            <div className="relative">
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="block appearance-none bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md py-2 px-3 pr-8 text-gray-900 dark:text-gray-100 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {models.map((model, index) => (
                  <option key={index} value={model}>
                    {model.split('/').pop()}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-300">
                <ChevronRightIcon className="h-4 w-4 transform rotate-90" />
              </div>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg text-sm">
          <div className="flex items-center">
            <ExclamationCircleIcon className="h-5 w-5 mr-2" />
            {error}
          </div>
        </div>
      )}      {/* Chat Messages Area */}
      <div className="flex-1 overflow-y-auto mb-4 bg-gray-50 dark:bg-gray-900 rounded-lg p-4 shadow-inner">
        <div className="space-y-4">
          {messages.map((message, index) => (
            <ChatMessageDisplay
              key={index}
              message={message}
              isStreaming={isStreaming && index === messages.length - 1 && message.role === 'assistant'}
            />
          ))}

          {/* "AI is typing" indicator - only show when not streaming but still typing */}
          {isTyping && !isStreaming && (
            <div className="flex justify-start">
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 py-2 px-4 rounded-lg text-gray-700 dark:text-gray-300">
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          )}
          
          {/* Scroll anchor */}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg flex items-end">
        <textarea 
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Type a message..."
          rows={1}
          className="flex-1 py-3 px-4 bg-transparent text-gray-900 dark:text-gray-100 outline-none resize-none max-h-32"
          disabled={isTyping}
        />        <button
          onClick={handleSendMessage}
          disabled={!input.trim() || isTyping}
          className={`p-3 mx-2 my-2 rounded-full focus:outline-none ${
            !input.trim() || isTyping
              ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
              : 'text-blue-600 hover:bg-blue-50 dark:hover:bg-gray-700'
          }`}
        >
          <PaperAirplaneIcon className="h-5 w-5" />
        </button>
      </div>      {/* Information text */}
      <div className="mt-2 text-xs text-center text-gray-500 dark:text-gray-400">
        Press Enter to send, Shift+Enter for new line • {isStreaming ? 'Streaming AI response...' : 'AI Chat with Think/Answer Separation'}
      </div>
    </div>
  );
};

export default AIPage;
