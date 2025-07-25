import { AgentType, AgentTask, AgentSession, UserProfile, Topic, LearningPath } from '../types';
import Queue from 'bull';
import Redis from 'ioredis';

const { AgentSession: AgentSessionModel } = require('../../models');

export class AgentOrchestrator {
  private redis: Redis;
  private taskQueue: Queue.Queue;
  private agents: Map<AgentType, any> = new Map();

  constructor() {
    // Initialize Redis connection
    this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
    
    // Initialize task queue
    this.taskQueue = new Queue('agent-tasks', process.env.REDIS_URL || 'redis://localhost:6379');
    
    // Set up queue processing
    this.setupQueueProcessing();
  }

  /**
   * Register an agent with the orchestrator
   */
  registerAgent(type: AgentType, agent: any): void {
    this.agents.set(type, agent);
    console.log(`✅ Agent registered: ${type}`);
  }

  /**
   * Process a learning request by coordinating multiple agents
   */
  async processLearningRequest(
    userId: string, 
    request: {
      type: 'NEWSLETTER_PROCESSING' | 'LEARNING_PATH_GENERATION' | 'PRACTICE_SCENARIO' | 'RESEARCH_QUERY' | 'CHAT';
      data: any;
      priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    }
  ): Promise<any> {
    try {
      console.log(`🚀 Processing learning request: ${request.type} for user ${userId}`);

      switch (request.type) {
        case 'NEWSLETTER_PROCESSING':
          return await this.processNewsletter(userId, request.data);
        
        case 'LEARNING_PATH_GENERATION':
          return await this.generateLearningPath(userId, request.data);
        
        case 'PRACTICE_SCENARIO':
          return await this.generatePracticeScenario(userId, request.data);
        
        case 'RESEARCH_QUERY':
          return await this.processResearchQuery(userId, request.data);
        
        case 'CHAT':
          return await this.processChatRequest(userId, request.data);
        
        default:
          throw new Error(`Unknown request type: ${request.type}`);
      }
    } catch (error) {
      console.error(`❌ Error processing learning request:`, error);
      throw error;
    }
  }

  /**
   * Process newsletter content using Content Curator Agent
   */
  private async processNewsletter(userId: string, data: { content: string; source?: string }): Promise<Topic[]> {
    const sessionId = this.generateSessionId();
    
    const session = await this.createAgentSession({
      userId,
      agentType: 'CONTENT_CURATOR',
      sessionId,
      context: { source: data.source }
    });

    try {
      const curatorAgent = this.agents.get('CONTENT_CURATOR');
      if (!curatorAgent) {
        throw new Error('Content Curator Agent not available');
      }

      const topics = await curatorAgent.processContent(data.content, {
        userId,
        sessionId,
        source: data.source
      });

      await this.updateAgentSession(session.id, {
        status: 'COMPLETED',
        resultData: { topics },
        endTime: new Date()
      });

      return topics;
    } catch (error) {
      await this.updateAgentSession(session.id, {
        status: 'FAILED',
        errorMessage: error.message,
        endTime: new Date()
      });
      throw error;
    }
  }

  /**
   * Generate personalized learning path using Learning Strategist Agent
   */
  private async generateLearningPath(
    userId: string, 
    data: { 
      userProfile: UserProfile; 
      completedTopics: Topic[]; 
      targetRole?: string;
      timeframe?: number;
    }
  ): Promise<LearningPath> {
    const sessionId = this.generateSessionId();
    
    const session = await this.createAgentSession({
      userId,
      agentType: 'LEARNING_STRATEGIST',
      sessionId,
      context: { targetRole: data.targetRole, timeframe: data.timeframe }
    });

    try {
      const strategistAgent = this.agents.get('LEARNING_STRATEGIST');
      if (!strategistAgent) {
        throw new Error('Learning Strategist Agent not available');
      }

      const learningPath = await strategistAgent.generatePath({
        userProfile: data.userProfile,
        completedTopics: data.completedTopics,
        targetRole: data.targetRole,
        timeframe: data.timeframe,
        sessionId
      });

      await this.updateAgentSession(session.id, {
        status: 'COMPLETED',
        resultData: { learningPath },
        endTime: new Date()
      });

      return learningPath;
    } catch (error) {
      await this.updateAgentSession(session.id, {
        status: 'FAILED',
        errorMessage: error.message,
        endTime: new Date()
      });
      throw error;
    }
  }

  /**
   * Generate practice scenario using Practice Coach Agent
   */
  private async generatePracticeScenario(
    userId: string, 
    data: { 
      topicId: string; 
      difficulty: string; 
      userProfile: UserProfile;
      scenarioType?: string;
    }
  ): Promise<any> {
    const sessionId = this.generateSessionId();
    
    const session = await this.createAgentSession({
      userId,
      agentType: 'PRACTICE_COACH',
      sessionId,
      context: { topicId: data.topicId, difficulty: data.difficulty }
    });

    try {
      const coachAgent = this.agents.get('PRACTICE_COACH');
      if (!coachAgent) {
        throw new Error('Practice Coach Agent not available');
      }

      const scenario = await coachAgent.generateScenario({
        topicId: data.topicId,
        difficulty: data.difficulty,
        userProfile: data.userProfile,
        scenarioType: data.scenarioType,
        sessionId
      });

      await this.updateAgentSession(session.id, {
        status: 'COMPLETED',
        resultData: { scenario },
        endTime: new Date()
      });

      return scenario;
    } catch (error) {
      await this.updateAgentSession(session.id, {
        status: 'FAILED',
        errorMessage: error.message,
        endTime: new Date()
      });
      throw error;
    }
  }

  /**
   * Process research query using Research Assistant Agent
   */
  private async processResearchQuery(
    userId: string, 
    data: { 
      query: string; 
      topics: string[]; 
      depth?: 'basic' | 'detailed' | 'comprehensive';
    }
  ): Promise<any> {
    const sessionId = this.generateSessionId();
    
    const session = await this.createAgentSession({
      userId,
      agentType: 'RESEARCH_ASSISTANT',
      sessionId,
      context: { query: data.query, topics: data.topics }
    });

    try {
      const researchAgent = this.agents.get('RESEARCH_ASSISTANT');
      if (!researchAgent) {
        throw new Error('Research Assistant Agent not available');
      }

      const research = await researchAgent.conductResearch({
        query: data.query,
        topics: data.topics,
        depth: data.depth || 'detailed',
        sessionId
      });

      await this.updateAgentSession(session.id, {
        status: 'COMPLETED',
        resultData: { research },
        endTime: new Date()
      });

      return research;
    } catch (error) {
      await this.updateAgentSession(session.id, {
        status: 'FAILED',
        errorMessage: error.message,
        endTime: new Date()
      });
      throw error;
    }
  }

  /**
   * Process chat request using appropriate agent based on context
   */
  private async processChatRequest(
    userId: string, 
    data: { 
      message: string; 
      topicId?: string; 
      context?: any;
      preferredAgent?: AgentType;
    }
  ): Promise<any> {
    const sessionId = this.generateSessionId();
    
    // Determine which agent should handle the request
    const agentType = data.preferredAgent || this.determineOptimalAgent(data);
    
    const session = await this.createAgentSession({
      userId,
      agentType,
      sessionId,
      context: { topicId: data.topicId, originalMessage: data.message }
    });

    try {
      const agent = this.agents.get(agentType);
      if (!agent) {
        throw new Error(`${agentType} Agent not available`);
      }

      const response = await agent.processChat({
        message: data.message,
        topicId: data.topicId,
        context: data.context,
        userId,
        sessionId
      });

      await this.updateAgentSession(session.id, {
        status: 'COMPLETED',
        resultData: { response },
        endTime: new Date()
      });

      return response;
    } catch (error) {
      await this.updateAgentSession(session.id, {
        status: 'FAILED',
        errorMessage: error.message,
        endTime: new Date()
      });
      throw error;
    }
  }

  /**
   * Determine the optimal agent for handling a request
   */
  private determineOptimalAgent(data: { message: string; topicId?: string; context?: any }): AgentType {
    const message = data.message.toLowerCase();

    // Keywords that suggest specific agent types
    if (message.includes('practice') || message.includes('scenario') || message.includes('exercise')) {
      return 'PRACTICE_COACH';
    }
    
    if (message.includes('research') || message.includes('latest') || message.includes('trends')) {
      return 'RESEARCH_ASSISTANT';
    }
    
    if (message.includes('path') || message.includes('roadmap') || message.includes('plan')) {
      return 'LEARNING_STRATEGIST';
    }
    
    if (message.includes('newsletter') || message.includes('article') || message.includes('content')) {
      return 'CONTENT_CURATOR';
    }

    // Default to conversation coach for general questions
    return 'CONVERSATION_COACH';
  }

  /**
   * Create a new agent session
   */
  private async createAgentSession(data: {
    userId: string;
    agentType: AgentType;
    sessionId: string;
    context: any;
  }): Promise<any> {
    return await AgentSessionModel.create({
      userId: data.userId,
      agentType: data.agentType,
      sessionId: data.sessionId,
      context: data.context,
      messages: [],
      status: 'ACTIVE',
      startTime: new Date(),
      tokensUsed: 0,
      cost: 0,
      resultData: {},
      metadata: {}
    });
  }

  /**
   * Update an agent session
   */
  private async updateAgentSession(sessionId: string, updates: any): Promise<void> {
    await AgentSessionModel.update(updates, {
      where: { id: sessionId }
    });
  }

  /**
   * Generate a unique session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Set up queue processing for background tasks
   */
  private setupQueueProcessing(): void {
    this.taskQueue.process('agent-task', async (job) => {
      const { agentType, taskData } = job.data;
      
      try {
        const agent = this.agents.get(agentType);
        if (!agent) {
          throw new Error(`Agent ${agentType} not found`);
        }

        const result = await agent.processTask(taskData);
        return result;
      } catch (error) {
        console.error(`Error processing agent task:`, error);
        throw error;
      }
    });

    this.taskQueue.on('completed', (job, result) => {
      console.log(`✅ Agent task completed: ${job.id}`);
    });

    this.taskQueue.on('failed', (job, err) => {
      console.error(`❌ Agent task failed: ${job.id}`, err);
    });
  }

  /**
   * Add a task to the processing queue
   */
  async addTask(agentType: AgentType, taskData: any, priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' = 'MEDIUM'): Promise<void> {
    const priorityMap = {
      'LOW': 1,
      'MEDIUM': 5,
      'HIGH': 10,
      'URGENT': 20
    };

    await this.taskQueue.add('agent-task', {
      agentType,
      taskData
    }, {
      priority: priorityMap[priority],
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000
      }
    });
  }

  /**
   * Get statistics about agent performance
   */
  async getAgentStatistics(): Promise<any> {
    const stats = {
      totalSessions: 0,
      sessionsByAgent: {},
      averageExecutionTime: 0,
      totalTokensUsed: 0,
      totalCost: 0,
      successRate: 0
    };

    try {
      const sessions = await AgentSessionModel.findAll({
        where: {
          endTime: { [require('sequelize').Op.ne]: null }
        }
      });

      stats.totalSessions = sessions.length;
      
      sessions.forEach((session: any) => {
        // Count by agent type
        if (!stats.sessionsByAgent[session.agentType]) {
          stats.sessionsByAgent[session.agentType] = {
            count: 0,
            totalTime: 0,
            tokens: 0,
            cost: 0,
            successes: 0
          };
        }
        
        const agentStats = stats.sessionsByAgent[session.agentType];
        agentStats.count++;
        agentStats.totalTime += session.executionTimeMs || 0;
        agentStats.tokens += session.tokensUsed || 0;
        agentStats.cost += parseFloat(session.cost || '0');
        
        if (session.status === 'COMPLETED') {
          agentStats.successes++;
        }
      });

      // Calculate averages and success rates
      Object.keys(stats.sessionsByAgent).forEach(agentType => {
        const agentStats = stats.sessionsByAgent[agentType];
        agentStats.averageTime = agentStats.totalTime / agentStats.count;
        agentStats.successRate = (agentStats.successes / agentStats.count) * 100;
      });

      return stats;
    } catch (error) {
      console.error('Error calculating agent statistics:', error);
      return stats;
    }
  }

  /**
   * Gracefully shutdown the orchestrator
   */
  async shutdown(): Promise<void> {
    console.log('🔄 Shutting down Agent Orchestrator...');
    await this.taskQueue.close();
    await this.redis.disconnect();
    console.log('✅ Agent Orchestrator shutdown complete');
  }
}