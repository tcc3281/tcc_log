import api from './api';

/**
 * Interface for entry analysis request
 */
export interface EntryAnalysisRequest {
  entry_id: number;
  analysis_type: 'general' | 'mood' | 'summary' | 'insights';
  model?: string;
}

/**
 * Interface for entry analysis response
 */
export interface EntryAnalysisResponse {
  entry_id: number;
  title: string;
  think?: string;
  answer: string;
  raw_content: string;
  analysis_type: string;
  model?: string;
}

/**
 * Interface for prompt generation request
 */
export interface PromptsRequest {
  topic?: string;
  theme?: string;
  count?: number;
  model?: string;
}

/**
 * Interface for prompt generation response
 */
export interface PromptsResponse {
  prompts: string[];
}

/**
 * Interface for AI status response
 */
export interface AIStatusResponse {
  status: string;
  message: string;
  base_url: string;
  model_count?: number;
  sample_model?: string;
}

/**
 * Interface for model list response
 */
export interface ModelListResponse {
  models: string[];
}

/**
 * Interface for writing improvement request
 */
export interface WritingImprovementRequest {
  text: string;
  improvement_type?: 'grammar' | 'style' | 'vocabulary' | 'complete';
  model?: string;
}

/**
 * Interface for writing improvement response
 */
export interface WritingImprovementResponse {
  original_text: string;
  think?: string;
  improved_text: string;
  raw_content: string;
  improvement_type: string;
}

/**
 * Interface for writing suggestions request
 */
export interface WritingSuggestionsRequest {
  text: string;
  model?: string;
}

/**
 * Interface for writing suggestions response
 */
export interface WritingSuggestionsResponse {
  original_text: string;
  think?: string;
  suggestions: string;
  raw_content: string;
}

/**
 * Check the status of the AI service
 */
export async function checkAIStatus(): Promise<AIStatusResponse> {
  try {
    const response = await api.get('/ai/status');
    return response.data;
  } catch (error) {
    console.error('Error checking AI status:', error);
    throw error;
  }
}

/**
 * Get a list of available AI models
 */
export async function getAvailableModels(): Promise<string[]> {
  try {
    const response = await api.get('/ai/models');
    return response.data.models || [];
  } catch (error) {
    console.error('Error fetching AI models:', error);
    return [];
  }
}

/**
 * Analyze a journal entry
 */
export async function analyzeEntry(
  entryId: number,
  analysisType: 'general' | 'mood' | 'summary' | 'insights' = 'general',
  model?: string
): Promise<EntryAnalysisResponse> {
  try {
    const response = await api.post<EntryAnalysisResponse>('/ai/analyze-entry', {
      entry_id: entryId,
      analysis_type: analysisType,
      model: model
    });
    return response.data;
  } catch (error) {
    console.error('Error analyzing entry:', error);
    throw error;
  }
}

/**
 * Generate journaling prompts
 */
export async function generatePrompts(
  options: PromptsRequest = {}
): Promise<string[]> {
  try {
    const response = await api.post<PromptsResponse>('/ai/generate-prompts', {
      topic: options.topic || '',
      theme: options.theme || '',
      count: options.count || 5,
      model: options.model
    });
    return response.data.prompts;
  } catch (error) {
    console.error('Error generating prompts:', error);
    return [];
  }
}

/**
 * Improve writing quality with AI
 */
export async function improveWriting(
  text: string,
  improvementType: 'grammar' | 'style' | 'vocabulary' | 'complete' = 'complete',
  model?: string
): Promise<WritingImprovementResponse> {
  try {
    const response = await api.post<WritingImprovementResponse>('/ai/improve-writing', {
      text,
      improvement_type: improvementType,
      model
    });
    return response.data;
  } catch (error) {
    console.error('Error improving writing:', error);
    throw error;
  }
}

/**
 * Get detailed writing improvement suggestions
 */
export async function getWritingSuggestions(
  text: string,
  model?: string
): Promise<WritingSuggestionsResponse> {
  try {
    console.log('Sending writing suggestions request with model:', model);
    const requestData = {
      text,
      model: model
    };
    console.log('Request data:', requestData);
    
    const response = await api.post<WritingSuggestionsResponse>('/ai/writing-suggestions', requestData);
    console.log('Writing suggestions API response:', response);
    return response.data;
  } catch (error: any) {
    console.error('Error getting writing suggestions:', error);
    console.error('Error response:', error.response);
    throw error;
  }
}

/**
 * Chat message structure
 */
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: Date;
  think?: string; // Add think field for AI responses
}

/**
 * Chat response structure
 */
export interface ChatResponse {
  content: string;
  model?: string;
  usage?: Record<string, number>;
  error?: boolean;
}

/**
 * Streaming chat data structure
 */
export interface ChatStreamData {
  type: 'chunk' | 'thinking' | 'answer' | 'done' | 'error';
  content: string;
  chunk_id?: number;
}

/**
 * Stream event callback
 */
export type StreamEventHandler = (data: ChatStreamData) => void;

/**
 * Send a streaming chat message
 */
export async function sendChatMessageStream(
  message: string,
  history: { role: string; content: string }[] = [], // Change type to match API
  model?: string,
  systemPrompt?: string,
  onEvent?: StreamEventHandler
): Promise<{ thinking: string; answer: string; fullContent: string }> {
  try {
    // Get the token from localStorage (same key as api.ts uses)
    const token = localStorage.getItem('token');
    const baseURL = 'http://localhost:8000'; // For development
    
    console.log('Sending chat stream request:', {
      message,
      historyLength: history.length,
      history: history,
      model,
      systemPrompt: systemPrompt?.substring(0, 50) + '...'
    });
    
    const response = await fetch(`${baseURL}/ai/chat-stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        message,
        history, // Send history as-is since it's already in correct format
        model,
        system_prompt: systemPrompt,
        stream: true
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error:', response.status, errorText);
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No reader available');
    }

    const decoder = new TextDecoder();
    let thinking = '';
    let answer = '';
    let fullContent = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const jsonStr = line.slice(6); // Remove 'data: ' prefix
              if (jsonStr.trim()) {
                const data: ChatStreamData = JSON.parse(jsonStr);
                
                if (data.type === 'thinking') {
                  thinking += data.content;
                } else if (data.type === 'answer') {
                  answer += data.content;
                }
                
                fullContent += data.content;
                
                // Call event handler if provided
                if (onEvent) {
                  onEvent(data);
                }
                
                // Break on done or error
                if (data.type === 'done' || data.type === 'error') {
                  return { thinking, answer, fullContent };
                }
              }
            } catch (parseError) {
              console.error('Error parsing SSE data:', parseError);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    return { thinking, answer, fullContent };
  } catch (error) {
    console.error('Error in streaming chat:', error);
    throw error;
  }
}

/**
 * Send a message to the chatbot
 */
export async function sendChatMessage(
  message: string,
  history: ChatMessage[] = [],
  model?: string,
  systemPrompt?: string
): Promise<ChatResponse> {
  try {
    const response = await api.post('/ai/chat', {
      message,
      history,
      model,
      system_prompt: systemPrompt
    });
    return response.data;
  } catch (error) {
    console.error('Error sending chat message:', error);
    throw error;
  }
}

export default {
  checkAIStatus,
  getAvailableModels,
  analyzeEntry,
  generatePrompts,
  improveWriting,
  getWritingSuggestions,
  sendChatMessage,
  sendChatMessageStream
};
