import api from './api';

/**
 * Interface for entry analysis request
 */
export interface EntryAnalysisRequest {
  entry_id: number;
  analysis_type: 'general' | 'mood' | 'summary' | 'insights';
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
}

/**
 * Interface for prompt generation request
 */
export interface PromptsRequest {
  topic?: string;
  theme?: string;
  count?: number;
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
    const response = await api.get<ModelListResponse>('/ai/models');
    return response.data.models;
  } catch (error) {
    console.error('Error getting available models:', error);
    return [];
  }
}

/**
 * Analyze a journal entry
 */
export async function analyzeEntry(
  entryId: number,
  analysisType: 'general' | 'mood' | 'summary' | 'insights' = 'general'
): Promise<EntryAnalysisResponse> {
  try {
    const response = await api.post<EntryAnalysisResponse>('/ai/analyze-entry', {
      entry_id: entryId,
      analysis_type: analysisType
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
      count: options.count || 5
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
  improvementType: 'grammar' | 'style' | 'vocabulary' | 'complete' = 'complete'
): Promise<WritingImprovementResponse> {
  try {
    const response = await api.post<WritingImprovementResponse>('/ai/improve-writing', {
      text,
      improvement_type: improvementType
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
  text: string
): Promise<WritingSuggestionsResponse> {
  try {
    const response = await api.post<WritingSuggestionsResponse>('/ai/writing-suggestions', {
      text
    });
    return response.data;
  } catch (error) {
    console.error('Error getting writing suggestions:', error);
    throw error;
  }
}

export default {
  checkAIStatus,
  getAvailableModels,
  analyzeEntry,
  generatePrompts,
  improveWriting,
  getWritingSuggestions
};
