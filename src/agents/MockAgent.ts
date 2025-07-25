import { AgentType, Topic, LearningPath, PracticeScenario } from '../types';

export class MockAgent {
  private agentType: AgentType;

  constructor(agentType: AgentType) {
    this.agentType = agentType;
  }

  async processNewsletter(content: string): Promise<Topic[]> {
    // Return mock topics based on content
    return [
      {
        id: 'mock-topic-1',
        title: 'AI Model Improvements',
        slug: 'ai-model-improvements',
        category: 'AI_FUNDAMENTALS',
        difficulty: 'Intermediate',
        estimatedTimeMinutes: 15,
        definition: 'Recent advances in AI model performance and efficiency',
        explanation: 'This mock topic explains how AI models are becoming more powerful while using fewer resources. The key improvements include better reasoning, reduced computational costs, and wider applicability across business use cases.',
        whyItMatters: 'These improvements make AI more accessible and cost-effective for businesses, enabling wider adoption and more practical applications.',
        realWorldExample: 'Companies like OpenAI have reduced API costs by 60% while improving performance by 40%, making AI solutions more viable for startups and enterprises.',
        prerequisites: [],
        tags: ['AI', 'performance', 'efficiency'],
        metadata: { mockGenerated: true },
        isActive: true,
        sourceType: 'NEWSLETTER',
        version: 1
      },
      {
        id: 'mock-topic-2',
        title: 'Business AI Integration',
        slug: 'business-ai-integration',
        category: 'BUSINESS_AI',
        difficulty: 'Beginner',
        estimatedTimeMinutes: 20,
        definition: 'Strategies for integrating AI into business workflows',
        explanation: 'This mock topic covers practical approaches to implementing AI in business processes. It includes planning, team preparation, tool selection, and measuring ROI from AI initiatives.',
        whyItMatters: 'Successful AI integration can automate repetitive tasks, improve decision-making, and create competitive advantages in the marketplace.',
        realWorldExample: 'Slack uses AI for message summarization and search, while Notion implements AI writing assistance directly in their productivity platform.',
        prerequisites: [],
        tags: ['business', 'integration', 'workflow'],
        metadata: { mockGenerated: true },
        isActive: true,
        sourceType: 'NEWSLETTER',
        version: 1
      }
    ];
  }

  async generateLearningPath(userProfile: any): Promise<LearningPath> {
    return {
      id: 'mock-learning-path-1',
      userId: userProfile.id,
      title: `AI Mastery Path for ${userProfile.role}`,
      description: 'A comprehensive 30-day learning journey tailored to your role and experience level',
      type: 'PERSONALIZED',
      targetRole: userProfile.role,
      estimatedDays: 30,
      difficulty: userProfile.experience,
      status: 'ACTIVE',
      progress: 0.0,
      metadata: {
        createdBy: 'MOCK_LEARNING_STRATEGIST_AGENT',
        reasoning: 'Generated based on user role and experience level',
        adaptationCount: 0
      },
      topics: [],
      startedAt: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    };
  }

  async generatePracticeScenario(topicId: string, difficulty: string): Promise<PracticeScenario> {
    return {
      id: 'mock-scenario-1',
      topicId,
      title: 'AI Implementation Decision',
      description: 'A realistic workplace scenario about choosing AI solutions',
      scenarioType: 'DECISION_MAKING',
      difficulty: difficulty as any,
      estimatedTimeMinutes: 25,
      context: 'Your company is evaluating AI tools to improve customer support efficiency',
      situation: 'The customer service team is overwhelmed with tickets, and response times are increasing',
      challenge: 'Choose between three AI solutions: chatbot, ticket classification, or response suggestion system',
      expectedOutcomes: [
        'Analyze each solution\'s pros and cons',
        'Consider implementation complexity',
        'Evaluate cost-benefit ratio',
        'Make a justified recommendation'
      ],
      evaluationCriteria: [
        'Business impact assessment',
        'Technical feasibility analysis',
        'Resource requirement consideration',
        'Risk evaluation'
      ],
      hints: [
        'Consider your team\'s technical capabilities',
        'Think about user adoption challenges',
        'Evaluate measurable success metrics'
      ],
      sampleResponses: {
        excellent: ['Comprehensive analysis with clear reasoning'],
        good: ['Good analysis with minor gaps'],
        needsImprovement: ['Surface-level analysis needs deeper thinking']
      },
      tags: ['decision-making', 'business-ai', 'customer-service'],
      industry: 'Technology',
      companySize: 'MEDIUM',
      roleLevel: 'MID',
      isActive: true,
      createdBy: 'PRACTICE_COACH_AGENT',
      metadata: { mockGenerated: true }
    };
  }

  async conductResearch(query: string, topics: string[]): Promise<any> {
    return {
      query,
      topics,
      depth: 'detailed',
      sources: [
        {
          url: 'https://example.com/research-1',
          title: `${query} - Industry Analysis`,
          content: 'Mock research findings showing current trends and future predictions...',
          publishedDate: '2024-01-15',
          source: 'Mock Research Institute',
          relevanceScore: 0.95
        }
      ],
      analysis: {
        executiveSummary: `Mock analysis of ${query} showing significant growth potential and emerging opportunities.`,
        keyFindings: [
          'AI adoption is accelerating across industries',
          'Companies report 40% efficiency gains',
          'Investment in AI tools increased 200% last year'
        ],
        trends: [
          {
            trend: 'Multimodal AI Integration',
            direction: 'increasing',
            impact: 'high',
            timeline: '6-12 months'
          }
        ],
        credibilityScore: 8,
        confidence: 7
      },
      insights: {
        recommendations: [
          'Invest in AI training for your team',
          'Start with low-risk pilot projects',
          'Focus on measurable business outcomes'
        ],
        nextSteps: [
          'Evaluate current AI readiness',
          'Identify high-impact use cases',
          'Create implementation timeline'
        ]
      },
      timestamp: new Date()
    };
  }

  async processChat(message: string): Promise<any> {
    const responses = {
      'CONTENT_CURATOR': `I can help you understand AI concepts! Based on your message "${message}", I'd suggest focusing on practical applications and real-world examples. What specific AI topic would you like to explore?`,
      'LEARNING_STRATEGIST': `Great question! For your learning journey, I recommend starting with fundamentals and building up to advanced topics. Based on "${message}", here's what I suggest exploring next...`,
      'PRACTICE_COACH': `Let's practice applying this knowledge! Your message "${message}" suggests you're ready for hands-on scenarios. I can create realistic workplace situations to help you apply what you've learned.`,
      'RESEARCH_ASSISTANT': `I can research that for you! Regarding "${message}", I can analyze current trends, gather expert opinions, and provide actionable insights. What specific aspect interests you most?`
    };

    return {
      response: responses[this.agentType] || 'Mock response generated successfully!',
      agentType: this.agentType,
      confidence: 0.8,
      suggestions: [
        'Try a more specific question',
        'Ask about real-world applications',
        'Request a practical example'
      ],
      followUpQuestions: [
        'What aspect interests you most?',
        'Would you like a specific example?',
        'How does this apply to your work?'
      ],
      tokensUsed: 0,
      cost: 0,
      mockGenerated: true
    };
  }
}