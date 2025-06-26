'use client';

import React, { useState, useEffect, useRef, KeyboardEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { getAvailableModels, sendChatMessageStream, ChatMessage, ChatStreamData } from '../../lib/ai-utils';
import { ChevronRightIcon, PaperAirplaneIcon, ExclamationCircleIcon, StopIcon } from '@heroicons/react/24/solid';
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
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [useAgent, setUseAgent] = useState<boolean>(false); // Thêm state cho chế độ Agent

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
  
  // Function to stop the completion
  const handleStopCompletion = () => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
      setIsStreaming(false);
      setIsTyping(false);
      setStreamingMessageId(null);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;
    
    const currentInput = input.trim();
    
    // Add user message to chat
    const userMessage: ChatMessage = { role: 'user', content: currentInput, timestamp: new Date() };
    setMessages(prevMessages => [...prevMessages, userMessage]);
    
    // Clear input
    setInput('');
    
    // Create a new AbortController for this request
    const controller = new AbortController();
    setAbortController(controller);
    
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
      
      // Prepare conversation history INCLUDING the user message we just added
      // Get all messages except system messages, and include the current user message
      const allMessages = [...messages, userMessage].filter(m => m.role !== 'system');
      
      // Convert to API format and exclude the current message (last one) from history
      const historyForApi = allMessages.slice(0, -1).map(msg => ({
        role: msg.role,
        content: msg.content || ''
      }));
      
      console.log('Sending to AI:', { 
        currentMessage: currentInput, 
        historyLength: historyForApi.length,
        history: historyForApi 
      });
      
      let thinkingContent = '';
      let answerContent = '';
      
      // Stream the response with the abort signal
      await sendChatMessageStream(
        currentInput,
        historyForApi,
        selectedModel,
        undefined,
        (streamData: ChatStreamData) => {
          // Check for timeout errors and display a more user-friendly message
          if (streamData.type === 'error' && streamData.content.includes('too long to respond')) {
            const friendlyError = 'The AI model took too long to generate a response. Try a shorter message or a different model.';
            setError(friendlyError);
            return;
          }
          
          // Check for stats that might be embedded in content
          if (streamData.type === 'answer' && typeof streamData.content === 'string') {
            const statsMatch = /\{"type":"stats".*\}$/i.exec(streamData.content);
            if (statsMatch) {
              try {
                // Extract stats from content
                const statsJson = statsMatch[0];
                // Clean the content by removing the stats
                const cleanContent = streamData.content.slice(0, statsMatch.index);
                
                // Parse the stats
                const statsData = JSON.parse(statsJson);
                
                // Update the content to be clean
                streamData.content = cleanContent;
                
                // Process stats separately
                setMessages(prevMessages => {
                  const newMessages = [...prevMessages];
                  const lastMessage = newMessages[newMessages.length - 1];
                  if (lastMessage.role === 'assistant') {
                    lastMessage.inference_time = statsData.inference_time;
                    lastMessage.tokens_per_second = statsData.tokens_per_second;
                  }
                  return newMessages;
                });
              } catch (err) {
                console.error('Error parsing embedded stats:', err);
              }
            }
          }
          
          // Regular processing of stream data
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
          } else if (streamData.type === 'stats') {
            // Update message with inference stats
            setMessages(prevMessages => {
              const newMessages = [...prevMessages];
              const lastMessage = newMessages[newMessages.length - 1];
              if (lastMessage.role === 'assistant') {
                lastMessage.inference_time = streamData.inference_time;
                lastMessage.tokens_per_second = streamData.tokens_per_second;
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
                // Make sure inference stats are preserved if they were set
                if (streamData.inference_time) {
                  lastMessage.inference_time = streamData.inference_time;
                }
                if (streamData.tokens_per_second) {
                  lastMessage.tokens_per_second = streamData.tokens_per_second;
                }
              }
              return newMessages;
            });
          } else if (streamData.type === 'error') {
            setError('Error in streaming response: ' + streamData.content);
            // Remove the last message if it's an error and empty
            setMessages(prevMessages => {
              const lastMessage = prevMessages[prevMessages.length - 1];
              // Only remove if it's the assistant message and empty
              if (lastMessage.role === 'assistant' && !lastMessage.content) {
                return prevMessages.slice(0, -1);
              }
              return prevMessages;
            });
          }
        },
        controller.signal,
        useAgent  // Truyền tham số useAgent
      );
      
    } catch (err: any) {
      console.error('Error sending message:', err);
      
      // Special handling for timeout errors
      if (err.message && err.message.includes('timeout') || err.message.includes('too long')) {
        setError('The AI model took too long to respond. Try a shorter message or selecting a different model.');
      }
      // Don't show abort errors as they are intentional
      else if (err.name !== 'AbortError') {
        setError(err.message || 'Failed to send message. Please try again.');
      } else {
        console.log('Request was aborted by user');
      }
      
      // Remove the empty AI message on error or abort
      setMessages(prevMessages => {
        // Only remove the last message if it's an assistant message with empty or minimal content
        const lastMessage = prevMessages[prevMessages.length - 1];
        if (lastMessage && lastMessage.role === 'assistant' && 
            (!lastMessage.content || lastMessage.content.trim().length === 0)) {
          return prevMessages.slice(0, -1);
        }
        return prevMessages;
      });
    } finally {
      setIsStreaming(false);
      setIsTyping(false);
      setStreamingMessageId(null);
      setAbortController(null);
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
        <div className="flex items-center space-x-4">          {/* Mode selection */}
          <div className="relative">
            <select
              value={useAgent ? "agent" : "ask"}
              onChange={(e) => setUseAgent(e.target.value === "agent")}
              aria-label="Select AI mode"
              title="Choose between Ask mode for simple questions or Agent mode for complex queries"
              className="block appearance-none bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md py-2 px-3 pr-8 text-gray-900 dark:text-gray-100 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="ask">Ask</option>
              <option value="agent">Agent</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-300">
              <ChevronRightIcon className="h-4 w-4 transform rotate-90" />
            </div>
          </div>
          
          {models.length > 0 && (            <div className="relative">
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                aria-label="Select AI model"
                title="Choose which AI model to use for responses"
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
      )}
      
      {/* Chat Messages Area */}
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
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 py-2 px-4 rounded-lg text-gray-700 dark:text-gray-300">                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]"></div>
                </div>
              </div>
            </div>
          )}
          
          {/* Scroll anchor */}
          <div ref={messagesEndRef} />
        </div>
      </div>
      
      {/* Input Area */}
      <div className="flex items-end bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
        <textarea 
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Type a message..."
          rows={1}
          className="flex-1 py-3 px-4 bg-transparent text-gray-900 dark:text-gray-100 outline-none resize-none max-h-32"
          disabled={isTyping}
        />
        
        {/* Character and word count */}
        <div className="px-4 py-2 text-xs text-gray-500 dark:text-gray-400">
          {input.length} characters, {input.split(/\s+/).filter(Boolean).length} words
        </div>
        
        {/* Stop button - only show when streaming */}
        {isStreaming && (
          <button
            onClick={handleStopCompletion}
            title="Stop generating"
            className="p-2 mx-1 my-2 rounded-full text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 focus:outline-none"
            aria-label="Stop generating"
          >
            <StopIcon className="h-5 w-5" />
          </button>
        )}
          <button
          onClick={handleSendMessage}
          disabled={!input.trim() || isTyping}
          aria-label="Send message"
          title="Send your message to the AI"
          className={`p-3 mx-2 my-2 rounded-full focus:outline-none ${
            !input.trim() || isTyping
              ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
              : 'text-blue-600 hover:bg-blue-50 dark:hover:bg-gray-700'
          }`}
        >
          <PaperAirplaneIcon className="h-5 w-5" />
        </button>
      </div>
      
      {/* Information text */}
      <div className="mt-2 text-xs text-center text-gray-500 dark:text-gray-400">
        Press Enter to send, Shift+Enter for new line • {
          isStreaming 
            ? 'Streaming AI response... (Click stop button to cancel)' 
            : `AI Chat (Mode: ${useAgent ? 'Agent' : 'Ask'}) with Think/Answer Separation`
        }
      </div>
    </div>
  );
};

export default AIPage;