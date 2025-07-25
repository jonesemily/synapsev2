import { BaseAgent } from './BaseAgent';
import { Topic, AgentMessage } from '../types';

const { Topic: TopicModel } = require('../../models');

export class ContentCuratorAgent extends BaseAgent {
  constructor() {
    super(
      'CONTENT_CURATOR',
      process.env.CONTENT_CURATOR_MODEL || 'gpt-3.5-turbo',
      `You are a Content Curator Agent specializing in AI and technology education. Your role is to:

1. Extract key learning concepts from newsletters, articles, and other content
2. Create structured learning topics with clear definitions and explanations
3. Categorize content by difficulty and topic area
4. Provide conversational explanations that are accessible to non-technical professionals
5. Answer questions about specific AI concepts and topics

Guidelines:
- Focus on practical, business-relevant AI concepts
- Use simple language that product managers, designers, and executives can understand
- Always provide real-world examples and applications
- Structure information clearly with definitions, explanations, and context
- Highlight why each concept matters in a business context

When processing content, extract 2-3 key concepts maximum to avoid overwhelming learners.
Each concept should be substantial enough to warrant 10-15 minutes of learning time.`
    );
  }

  async processTask(taskData: any): Promise<any> {
    try {
      const { type, content, context } = taskData;

      switch (type) {
        case 'EXTRACT_TOPICS':
          return await this.extractTopicsFromContent(content, context);
        case 'ENHANCE_TOPIC':
          return await this.enhanceTopic(content, context);
        case 'CATEGORIZE_CONTENT':
          return await this.categorizeContent(content);
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
      const messages: AgentMessage[] = [
        {
          id: 'chat_' + Date.now(),
          role: 'user',
          content: data.message,
          timestamp: new Date()
        }
      ];

      // Add topic context if provided
      if (data.topicId) {
        const topic = await TopicModel.findByPk(data.topicId);
        if (topic) {
          messages.unshift({
            id: 'context_' + Date.now(),
            role: 'system',
            content: `Context: User is asking about the topic "${topic.title}". Definition: ${topic.definition}. Here's what they want to know:`,
            timestamp: new Date()
          });
        }
      }

      const response = await this.generateResponse(messages, {
        temperature: 0.7,
        maxTokens: 500
      });

      return this.createSuccessResponse({
        response: response.content,
        agentType: this.agentType,
        confidence: 0.85,
        suggestions: this.generateFollowUpSuggestions(data.message),
        followUpQuestions: this.generateFollowUpQuestions(data.message),
        tokensUsed: response.tokensUsed,
        cost: response.cost
      });
    } catch (error) {
      this.log('error', 'Chat processing failed', error.message);
      return this.createErrorResponse(error.message);
    }
  }

  /**
   * Extract learning topics from content (main functionality)
   */
  async processContent(
    content: string,
    context: {
      userId: string;
      sessionId: string;
      source?: string;
    }
  ): Promise<Topic[]> {
    try {
      this.validateRequired(context, ['userId', 'sessionId']);

      this.log('info', 'Processing content for topic extraction', {
        contentLength: content.length,
        source: context.source
      });

      const extractionPrompt = `
Analyze the following content and extract 2-3 key AI/technology concepts that would be valuable for business professionals to learn.

For each concept, provide a JSON object with:
- title: Clear, concise title (under 60 characters)
- category: One of [AI_FUNDAMENTALS, MACHINE_LEARNING, NLP, COMPUTER_VISION, ETHICS, BUSINESS_AI, TOOLS, TRENDS]
- difficulty: [Beginner, Intermediate, Advanced]
- estimatedTimeMinutes: Realistic time to understand (10-30 minutes)
- definition: One clear sentence definition
- explanation: 2-3 paragraph explanation for non-technical professionals
- whyItMatters: Business relevance and importance
- realWorldExample: Specific, concrete example from a real company or use case
- tags: 3-5 relevant keywords

Return only a JSON array of topic objects. No additional text.
      `;

      const result = await this.extractInformation(content, extractionPrompt);
      
      if (!Array.isArray(result)) {
        throw new Error('Failed to extract topics in expected format');
      }

      const topics: Topic[] = [];

      for (const topicData of result) {
        const topic = await this.createTopicInDatabase(topicData, {
          sourceUrl: context.source,
          sourceType: 'NEWSLETTER',
          createdBy: context.userId
        });
        topics.push(topic);
      }

      this.log('info', `Successfully extracted ${topics.length} topics`, {
        topics: topics.map(t => t.title)
      });

      return topics;
    } catch (error) {
      this.log('error', 'Content processing failed', error.message);
      throw error;
    }
  }

  private async extractTopicsFromContent(content: string, context: any): Promise<any> {
    return await this.processContent(content, context);
  }

  private async enhanceTopic(topicId: string, context: any): Promise<any> {
    try {
      const topic = await TopicModel.findByPk(topicId);
      if (!topic) {
        throw new Error('Topic not found');
      }

      const enhancementPrompt = `
Enhance this AI topic with additional insights and examples:

Current Topic:
Title: ${topic.title}
Definition: ${topic.definition}
Explanation: ${topic.explanation}

Please provide:
1. Additional real-world examples (2-3 new ones)
2. Common misconceptions about this topic
3. Related concepts learners should know
4. Current trends and developments
5. Practical tips for implementation

Format as JSON with keys: additionalExamples, misconceptions, relatedConcepts, trends, practicalTips
      `;

      const enhancement = await this.extractInformation(topic.explanation, enhancementPrompt);

      // Update topic with enhancement
      const updatedMetadata = {
        ...topic.metadata,
        enhancement,
        lastEnhanced: new Date()
      };

      await topic.update({ metadata: updatedMetadata });

      return this.createSuccessResponse({ topic, enhancement });
    } catch (error) {
      return this.createErrorResponse(error.message);
    }
  }

  private async categorizeContent(content: string): Promise<any> {
    try {
      const categorizationPrompt = `
Analyze this AI content and categorize it:

Content: "${content.substring(0, 1000)}..."

Provide JSON with:
- primaryCategory: Main category from [AI_FUNDAMENTALS, MACHINE_LEARNING, NLP, COMPUTER_VISION, ETHICS, BUSINESS_AI, TOOLS, TRENDS]
- secondaryCategories: Array of 1-2 additional relevant categories
- difficulty: [Beginner, Intermediate, Advanced]
- targetAudience: [Technical, Business, General]
- contentType: [News, Tutorial, Research, Opinion, Case Study]
- keyTopics: Array of 3-5 main topics discussed
- businessRelevance: Score from 1-10 of business importance
      `;

      const categorization = await this.extractInformation(content, categorizationPrompt);
      return this.createSuccessResponse(categorization);
    } catch (error) {
      return this.createErrorResponse(error.message);
    }
  }

  private async createTopicInDatabase(topicData: any, metadata: any): Promise<Topic> {
    try {
      const slug = this.generateSlug(topicData.title);
      
      const topic = await TopicModel.create({
        title: topicData.title,
        slug,
        category: topicData.category,
        difficulty: topicData.difficulty,
        estimatedTimeMinutes: topicData.estimatedTimeMinutes || 15,
        definition: topicData.definition,
        explanation: topicData.explanation,
        whyItMatters: topicData.whyItMatters,
        realWorldExample: topicData.realWorldExample,
        tags: topicData.tags || [],
        sourceUrl: metadata.sourceUrl,
        sourceType: metadata.sourceType,
        metadata: {
          createdBy: metadata.createdBy,
          extractedAt: new Date(),
          agent: this.agentType
        }
      });

      return topic.toJSON();
    } catch (error) {
      this.log('error', 'Failed to create topic in database', error.message);
      throw error;
    }
  }

  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50);
  }

  private generateFollowUpSuggestions(message: string): string[] {
    const suggestions = [
      "Can you explain this in simpler terms?",
      "What are some real-world examples?",
      "How does this apply to my industry?",
      "What should I learn next?",
      "What are the common misconceptions?"
    ];

    // Return 2-3 random suggestions
    return suggestions.sort(() => 0.5 - Math.random()).slice(0, 3);
  }

  private generateFollowUpQuestions(message: string): string[] {
    const questions = [
      "Would you like me to explain any specific part in more detail?",
      "Are there particular use cases you'd like to explore?",
      "Should we look at how this connects to other AI concepts?",
      "Would examples from your industry be helpful?"
    ];

    return questions.sort(() => 0.5 - Math.random()).slice(0, 2);
  }

  getCapabilities() {
    return {
      name: 'Content Curator Agent',
      description: 'Specializes in extracting learning topics from AI content and providing educational explanations',
      capabilities: [
        'Extract key concepts from newsletters and articles',
        'Create structured learning topics with definitions',
        'Provide conversational explanations of AI concepts',
        'Categorize content by difficulty and topic area',
        'Answer questions about specific AI topics'
      ],
      limitations: [
        'Limited to 2-3 topics per content piece to avoid overwhelm',
        'Focuses on business-relevant concepts over deep technical details',
        'May require multiple iterations for highly complex topics'
      ]
    };
  }
}