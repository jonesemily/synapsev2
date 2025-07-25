import { BaseAgent } from './BaseAgent';
import { UserProfile, Topic, LearningPath, AgentMessage } from '../types';

const { LearningPath: LearningPathModel, Topic: TopicModel, UserProgress, User } = require('../../models');

export class LearningStrategistAgent extends BaseAgent {
  constructor() {
    super(
      'LEARNING_STRATEGIST',
      process.env.LEARNING_STRATEGIST_MODEL || 'gpt-4',
      `You are a Learning Strategist Agent specializing in personalized AI education planning. Your role is to:

1. Analyze user learning patterns and completed topics
2. Create personalized 30-day learning roadmaps
3. Identify optimal learning sequences based on prerequisites
4. Suggest topics based on user's role, industry, and goals
5. Adapt learning paths based on progress and performance

Guidelines:
- Consider the user's role (PM, Designer, Executive, etc.) when creating paths
- Sequence topics logically with proper prerequisites
- Balance foundational concepts with practical applications
- Account for user's available time and learning velocity
- Recommend 4-8 topics per learning path to avoid overwhelm
- Focus on business-relevant skills and applications

Key Principles:
- Start with fundamentals before advanced topics
- Mix theoretical understanding with practical applications
- Consider industry-specific use cases
- Adapt difficulty based on user's experience level
- Ensure topics build on each other logically`
    );
  }

  async processTask(taskData: any): Promise<any> {
    try {
      const { type, data, context } = taskData;

      switch (type) {
        case 'GENERATE_LEARNING_PATH':
          return await this.generateLearningPath(data);
        case 'ADAPT_LEARNING_PATH':
          return await this.adaptLearningPath(data.pathId, data.userProgress);
        case 'ANALYZE_LEARNING_GAPS':
          return await this.analyzeLearningGaps(data.userId);
        case 'RECOMMEND_NEXT_TOPICS':
          return await this.recommendNextTopics(data.userId, data.completedTopics);
        default:
          throw new Error(`Unknown task type: ${type}`);
      }
    } catch (error) {
      this.log('error', 'Task processing failed', error.message);
      return this.createErrorResponse(error.message);
    }
  }

  async processChat(data: {
    message: string;
    topicId?: string;
    context?: any;
    userId: string;
    sessionId: string;
  }): Promise<any> {
    try {
      // Get user profile and progress for context
      const user = await User.findByPk(data.userId);
      const userProgress = await UserProgress.findAll({
        where: { userId: data.userId },
        include: [{ model: TopicModel, as: 'topic' }]
      });

      const contextMessage = `
User Profile:
- Role: ${user.role}
- Experience: ${user.experience}
- Learning Goals: ${user.learningGoals || 'Not specified'}
- Completed Topics: ${userProgress.filter(p => p.status === 'COMPLETED').length}
- Current Focus: ${userProgress.filter(p => p.status === 'IN_PROGRESS').map(p => p.topic.title).join(', ') || 'None'}
      `;

      const messages: AgentMessage[] = [
        {
          id: 'context_' + Date.now(),
          role: 'system',
          content: contextMessage,
          timestamp: new Date()
        },
        {
          id: 'chat_' + Date.now(),
          role: 'user',
          content: data.message,
          timestamp: new Date()
        }
      ];

      const response = await this.generateResponse(messages, {
        temperature: 0.6,
        maxTokens: 600
      });

      return this.createSuccessResponse({
        response: response.content,
        agentType: this.agentType,
        confidence: 0.9,
        suggestions: this.generateStrategicSuggestions(data.message, user),
        followUpQuestions: this.generateStrategicQuestions(data.message),
        tokensUsed: response.tokensUsed,
        cost: response.cost
      });
    } catch (error) {
      this.log('error', 'Chat processing failed', error.message);
      return this.createErrorResponse(error.message);
    }
  }

  /**
   * Generate a personalized learning path (main functionality)
   */
  async generatePath(data: {
    userProfile: UserProfile;
    completedTopics: Topic[];
    targetRole?: string;
    timeframe?: number;
    sessionId: string;
  }): Promise<LearningPath> {
    try {
      this.validateRequired(data, ['userProfile', 'completedTopics', 'sessionId']);

      this.log('info', 'Generating learning path', {
        userId: data.userProfile.id,
        completedTopics: data.completedTopics.length,
        targetRole: data.targetRole
      });

      // Analyze user's current knowledge state
      const knowledgeAnalysis = await this.analyzeCurrentKnowledge(
        data.userProfile,
        data.completedTopics
      );

      // Get available topics
      const availableTopics = await TopicModel.findAll({
        where: { isActive: true }
      });

      // Generate learning path using AI
      const pathData = await this.generateLearningPathWithAI(
        data.userProfile,
        knowledgeAnalysis,
        availableTopics,
        data.targetRole,
        data.timeframe
      );

      // Create learning path in database
      const learningPath = await this.createLearningPathInDatabase(
        pathData,
        data.userProfile.id
      );

      this.log('info', 'Learning path generated successfully', {
        pathId: learningPath.id,
        topicCount: pathData.topics.length
      });

      return learningPath;
    } catch (error) {
      this.log('error', 'Learning path generation failed', error.message);
      throw error;
    }
  }

  private async generateLearningPath(data: any): Promise<any> {
    return await this.generatePath(data);
  }

  private async adaptLearningPath(pathId: string, userProgress: any): Promise<any> {
    try {
      const learningPath = await LearningPathModel.findByPk(pathId, {
        include: [
          { model: TopicModel, as: 'topics' },
          { model: User, as: 'user' }
        ]
      });

      if (!learningPath) {
        throw new Error('Learning path not found');
      }

      // Analyze current progress
      const progressAnalysis = await this.analyzePathProgress(learningPath, userProgress);

      // Generate adaptation recommendations
      const adaptationPrompt = `
Analyze this learning path and user progress to recommend adaptations:

Current Path: ${learningPath.title}
Progress: ${Math.round(learningPath.progress * 100)}%
User Role: ${learningPath.user.role}
User Experience: ${learningPath.user.experience}

Topics Status:
${progressAnalysis.topicStatuses.map(t => `- ${t.title}: ${t.status} (Confidence: ${t.confidence}/10)`).join('\n')}

Struggling Areas: ${progressAnalysis.strugglingAreas.join(', ')}
Strong Areas: ${progressAnalysis.strongAreas.join(', ')}

Provide JSON with:
- shouldAdapt: boolean
- adaptationType: ["SEQUENCE", "DIFFICULTY", "CONTENT", "PACE"]
- recommendations: Array of specific changes
- newTopics: Array of topics to add
- removeTopics: Array of topics to remove or replace
- reasoning: Explanation of why these changes are needed
      `;

      const adaptation = await this.extractInformation(
        progressAnalysis.summary,
        adaptationPrompt
      );

      if (adaptation.shouldAdapt) {
        await this.applyPathAdaptations(learningPath, adaptation);
      }

      return this.createSuccessResponse({ adaptation, path: learningPath });
    } catch (error) {
      return this.createErrorResponse(error.message);
    }
  }

  private async analyzeLearningGaps(userId: string): Promise<any> {
    try {
      const user = await User.findByPk(userId);
      const userProgress = await UserProgress.findAll({
        where: { userId },
        include: [{ model: TopicModel, as: 'topic' }]
      });

      const gapAnalysisPrompt = `
Analyze learning gaps for this user:

Role: ${user.role}
Experience Level: ${user.experience}
Industry: ${user.industry || 'Not specified'}

Completed Topics (${userProgress.filter(p => p.status === 'COMPLETED').length}):
${userProgress
  .filter(p => p.status === 'COMPLETED')
  .map(p => `- ${p.topic.title} (${p.topic.category}) - Mastery: ${Math.round(p.masteryScore * 100)}%`)
  .join('\n')}

In Progress (${userProgress.filter(p => p.status === 'IN_PROGRESS').length}):
${userProgress
  .filter(p => p.status === 'IN_PROGRESS')
  .map(p => `- ${p.topic.title} (Confidence: ${p.confidenceLevel}/10)`)
  .join('\n')}

Provide JSON analysis with:
- skillGaps: Array of {category, currentLevel, requiredLevel, priority, reasoning}
- recommendations: Array of specific topics to address gaps
- learningPriorities: Ordered list of focus areas
- estimatedTimeToClose: Time needed to close each gap
- careerImpact: How closing gaps affects career advancement
      `;

      const analysis = await this.extractInformation('', gapAnalysisPrompt);
      return this.createSuccessResponse(analysis);
    } catch (error) {
      return this.createErrorResponse(error.message);
    }
  }

  private async recommendNextTopics(userId: string, completedTopics: Topic[]): Promise<any> {
    try {
      const user = await User.findByPk(userId);
      const availableTopics = await TopicModel.findAll({
        where: { isActive: true }
      });

      const recommendationPrompt = `
Recommend the next 3-5 topics for this user based on their profile and completed topics:

User Profile:
- Role: ${user.role}
- Experience: ${user.experience}
- Daily Time Goal: ${user.preferences.dailyTimeGoal} minutes
- Preferred Difficulty: ${user.preferences.difficulty}

Completed Topics: ${completedTopics.map(t => t.title).join(', ')}

Available Topics:
${availableTopics.map(t => 
  `- ${t.title} (${t.category}, ${t.difficulty}, ${t.estimatedTimeMinutes}min)`
).join('\n')}

Provide JSON with:
- recommendations: Array of {topicId, title, reasoning, priority, prerequisitesMet}
- learningSequence: Optimal order to study recommended topics
- timeEstimate: Total estimated time for recommended topics
- rationale: Overall reasoning for this recommendation set
      `;

      const recommendations = await this.extractInformation('', recommendationPrompt);
      return this.createSuccessResponse(recommendations);
    } catch (error) {
      return this.createErrorResponse(error.message);
    }
  }

  private async analyzeCurrentKnowledge(
    userProfile: UserProfile,
    completedTopics: Topic[]
  ): Promise<any> {
    const knowledgeByCategory = {};
    
    completedTopics.forEach(topic => {
      if (!knowledgeByCategory[topic.category]) {
        knowledgeByCategory[topic.category] = [];
      }
      knowledgeByCategory[topic.category].push(topic);
    });

    return {
      totalTopicsCompleted: completedTopics.length,
      categoryCoverage: knowledgeByCategory,
      strongAreas: Object.keys(knowledgeByCategory).filter(cat => 
        knowledgeByCategory[cat].length >= 3
      ),
      emergingAreas: Object.keys(knowledgeByCategory).filter(cat => 
        knowledgeByCategory[cat].length === 1 || knowledgeByCategory[cat].length === 2
      ),
      gapAreas: ['AI_FUNDAMENTALS', 'MACHINE_LEARNING', 'BUSINESS_AI', 'ETHICS']
        .filter(cat => !knowledgeByCategory[cat])
    };
  }

  private async generateLearningPathWithAI(
    userProfile: UserProfile,
    knowledgeAnalysis: any,
    availableTopics: any[],
    targetRole?: string,
    timeframe?: number
  ): Promise<any> {
    const pathPrompt = `
Create a personalized learning path for this user:

User Profile:
- Role: ${userProfile.role}
- Experience: ${userProfile.experience}
- Target Role: ${targetRole || 'Current role improvement'}
- Available Time: ${userProfile.preferences.dailyTimeGoal} minutes/day
- Timeframe: ${timeframe || 30} days

Current Knowledge:
- Completed Topics: ${knowledgeAnalysis.totalTopicsCompleted}
- Strong Areas: ${knowledgeAnalysis.strongAreas.join(', ')}
- Gap Areas: ${knowledgeAnalysis.gapAreas.join(', ')}

Available Topics:
${availableTopics.slice(0, 50).map(t => 
  `- ${t.id}: ${t.title} (${t.category}, ${t.difficulty}, ${t.estimatedTimeMinutes}min)`
).join('\n')}

Create a JSON learning path with:
- title: Compelling path name
- description: Path overview and goals
- type: Path type from ["PERSONALIZED", "ROLE_BASED", "SKILL_BASED"]
- difficulty: Overall difficulty level
- estimatedDays: Realistic completion time
- topics: Array of selected topic IDs in learning sequence
- reasoning: Why this path was chosen
- milestones: Key checkpoints and achievements
    `;

    return await this.extractInformation('', pathPrompt);
  }

  private async createLearningPathInDatabase(pathData: any, userId: string): Promise<any> {
    try {
      const learningPath = await LearningPathModel.create({
        userId,
        title: pathData.title,
        description: pathData.description,
        type: pathData.type,
        difficulty: pathData.difficulty,
        estimatedDays: pathData.estimatedDays,
        status: 'ACTIVE',
        progress: 0.0,
        metadata: {
          createdBy: 'LEARNING_STRATEGIST_AGENT',
          reasoning: pathData.reasoning,
          milestones: pathData.milestones,
          adaptationCount: 0
        }
      });

      // Add topics to the learning path
      if (pathData.topics && pathData.topics.length > 0) {
        const topicAssociations = pathData.topics.map((topicId: string, index: number) => ({
          learningPathId: learningPath.id,
          topicId,
          sequenceOrder: index + 1,
          isRequired: true,
          isCompleted: false,
          targetMasteryScore: 0.8
        }));

        await require('../../models').LearningPathTopics.bulkCreate(topicAssociations);
      }

      return learningPath.toJSON();
    } catch (error) {
      this.log('error', 'Failed to create learning path in database', error.message);
      throw error;
    }
  }

  private async analyzePathProgress(learningPath: any, userProgress: any): Promise<any> {
    // Implementation for analyzing learning path progress
    return {
      topicStatuses: [],
      strugglingAreas: [],
      strongAreas: [],
      summary: 'Progress analysis complete'
    };
  }

  private async applyPathAdaptations(learningPath: any, adaptation: any): Promise<void> {
    // Implementation for applying adaptations to learning path
    this.log('info', 'Applying path adaptations', adaptation);
  }

  private generateStrategicSuggestions(message: string, user: any): string[] {
    const roleSuggestions = {
      'PM': [
        "Let's create a product-focused learning path",
        "How about exploring AI tools for product management?",
        "Should we focus on AI strategy and implementation?"
      ],
      'Designer': [
        "Let's explore AI tools for design workflows",
        "How about learning AI for user experience optimization?",
        "Should we focus on AI ethics in design?"
      ],
      'Executive': [
        "Let's create a strategic AI leadership path",
        "How about focusing on AI business transformation?",
        "Should we explore AI governance and ethics?"
      ]
    };

    return roleSuggestions[user.role] || [
      "Let's create a customized learning path for you",
      "How about focusing on practical AI applications?",
      "Should we start with AI fundamentals?"
    ];
  }

  private generateStrategicQuestions(message: string): string[] {
    return [
      "What specific role or industry are you targeting?",
      "How much time can you dedicate to learning each day?",
      "Are there particular AI applications you're most interested in?"
    ];
  }

  getCapabilities() {
    return {
      name: 'Learning Strategist Agent',
      description: 'Creates personalized learning paths and analyzes learning progress to optimize educational outcomes',
      capabilities: [
        'Generate personalized 30-day learning roadmaps',
        'Analyze user learning patterns and knowledge gaps',
        'Adapt learning paths based on progress and performance',
        'Recommend optimal learning sequences with prerequisites',
        'Provide role-specific and industry-focused recommendations'
      ],
      limitations: [
        'Requires sufficient user progress data for accurate analysis',
        'Learning path effectiveness depends on user engagement',
        'May need manual adjustment for highly specialized roles'
      ]
    };
  }
}