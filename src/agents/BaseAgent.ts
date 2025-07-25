import OpenAI from 'openai';
import { AgentType, AgentMessage } from '../types';

export abstract class BaseAgent {
  protected openai: OpenAI;
  protected agentType: AgentType;
  protected model: string;
  protected systemPrompt: string;

  constructor(agentType: AgentType, model: string, systemPrompt: string) {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    this.agentType = agentType;
    this.model = model;
    this.systemPrompt = systemPrompt;
  }

  /**
   * Process a task - to be implemented by each agent
   */
  abstract processTask(taskData: any): Promise<any>;

  /**
   * Handle chat requests - to be implemented by each agent
   */
  abstract processChat(data: {
    message: string;
    topicId?: string;
    context?: any;
    userId: string;
    sessionId: string;
  }): Promise<any>;

  /**
   * Generate a response using OpenAI
   */
  protected async generateResponse(
    messages: AgentMessage[],
    options?: {
      temperature?: number;
      maxTokens?: number;
      functions?: any[];
    }
  ): Promise<{
    content: string;
    tokensUsed: number;
    cost: number;
    functionCall?: any;
  }> {
    try {
      const openaiMessages = [
        { role: 'system' as const, content: this.systemPrompt },
        ...messages.map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content
        }))
      ];

      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: openaiMessages,
        temperature: options?.temperature || 0.7,
        max_tokens: options?.maxTokens || 1000,
        functions: options?.functions
      });

      const choice = response.choices[0];
      const tokensUsed = response.usage?.total_tokens || 0;
      const cost = this.calculateCost(tokensUsed);

      return {
        content: choice.message.content || '',
        tokensUsed,
        cost,
        functionCall: choice.message.function_call
      };
    } catch (error) {
      console.error(`❌ Error generating response for ${this.agentType}:`, error);
      throw new Error(`AI response generation failed: ${error.message}`);
    }
  }

  /**
   * Calculate the cost of API usage
   */
  private calculateCost(tokens: number): number {
    const costPer1kTokens = this.getCostPer1kTokens();
    return (tokens / 1000) * costPer1kTokens;
  }

  /**
   * Get cost per 1k tokens based on model
   */
  private getCostPer1kTokens(): number {
    const costs: Record<string, number> = {
      'gpt-3.5-turbo': 0.002,
      'gpt-4': 0.03,
      'gpt-4-turbo': 0.01
    };
    
    return costs[this.model] || 0.002;
  }

  /**
   * Validate required fields in data
   */
  protected validateRequired(data: any, fields: string[]): void {
    for (const field of fields) {
      if (!data[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }
  }

  /**
   * Create a standard error response
   */
  protected createErrorResponse(error: string): any {
    return {
      success: false,
      error,
      agentType: this.agentType,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Create a standard success response
   */
  protected createSuccessResponse(data: any): any {
    return {
      success: true,
      data,
      agentType: this.agentType,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Log agent activity
   */
  protected log(level: 'info' | 'warn' | 'error', message: string, data?: any): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      agent: this.agentType,
      level,
      message,
      data
    };

    console.log(`[${level.toUpperCase()}] ${this.agentType}: ${message}`, data || '');
  }

  /**
   * Retry a function with exponential backoff
   */
  protected async retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === maxRetries - 1) {
          break;
        }

        const delay = baseDelay * Math.pow(2, attempt);
        this.log('warn', `Attempt ${attempt + 1} failed, retrying in ${delay}ms`, error.message);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError!;
  }

  /**
   * Extract key information from text using a simple prompt
   */
  protected async extractInformation(
    text: string,
    extractionPrompt: string
  ): Promise<any> {
    const messages: AgentMessage[] = [
      {
        id: 'extract_' + Date.now(),
        role: 'user',
        content: `${extractionPrompt}\n\nText to analyze:\n${text}`,
        timestamp: new Date()
      }
    ];

    const response = await this.generateResponse(messages, {
      temperature: 0.3,
      maxTokens: 1500
    });

    try {
      // Try to parse as JSON first
      return JSON.parse(response.content);
    } catch {
      // If not JSON, return as text
      return { content: response.content };
    }
  }

  /**
   * Get agent capabilities and description
   */
  abstract getCapabilities(): {
    name: string;
    description: string;
    capabilities: string[];
    limitations: string[];
  };
}